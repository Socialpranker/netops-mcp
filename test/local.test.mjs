// Unit tests for local-system readers/parsers: extractDomains (the fragile
// nginx/Caddy/Traefik/compose scraper), wg argv builder, key validators, and
// the hosts-file reader (path overridable via NETOPS_HOSTS_FILE).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  extractDomains,
  buildWgSetArgs,
  WG_KEY_RE,
  WG_IFACE_RE,
  readHostsFile,
} from "../dist/local.js";

async function withTmpDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), "netops-test-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const domainsOf = (hits) => new Set(hits.map((h) => h.domain));

test("extractDomains: pulls server_name from an nginx conf", async () => {
  await withTmpDir(async (dir) => {
    const f = join(dir, "site.conf");
    await writeFile(
      f,
      `server {
         server_name api.example.com www.example.com;
         listen 443 ssl;
       }`,
    );
    const got = domainsOf(await extractDomains([f]));
    assert.ok(got.has("api.example.com"));
    assert.ok(got.has("www.example.com"));
  });
});

test("extractDomains: pulls Traefik Host(`...`) rules", async () => {
  await withTmpDir(async (dir) => {
    const f = join(dir, "traefik.yml");
    await writeFile(
      f,
      `http:
         routers:
           app:
             rule: "Host(\`app.example.com\`)"`,
    );
    const got = domainsOf(await extractDomains([f]));
    assert.ok(got.has("app.example.com"));
  });
});

test("extractDomains: scans a directory of *.conf / *.yml files", async () => {
  await withTmpDir(async (dir) => {
    await writeFile(join(dir, "a.conf"), "server_name one.example.com;");
    await writeFile(join(dir, "b.yaml"), "rule: Host(`two.example.com`)");
    await writeFile(join(dir, "ignore.txt"), "server_name skipme.example.com;");
    const got = domainsOf(await extractDomains([dir]));
    assert.ok(got.has("one.example.com"));
    assert.ok(got.has("two.example.com"));
    // .txt is not in the scanned extension set
    assert.ok(!got.has("skipme.example.com"));
  });
});

test("extractDomains: filters config-key noise and non-FQDNs", async () => {
  await withTmpDir(async (dir) => {
    const f = join(dir, "noise.yml");
    await writeFile(
      f,
      `myapp.rule: something
       service: backend
       host: localhost
       internal: db.internal
       local: printer.local
       real: keep.example.com`,
    );
    const got = domainsOf(await extractDomains([f]));
    assert.ok(got.has("keep.example.com"));
    for (const junk of [
      "myapp.rule",
      "service",
      "backend",
      "localhost",
      "db.internal",
      "printer.local",
    ]) {
      assert.ok(!got.has(junk), `should not extract: ${junk}`);
    }
  });
});

test("extractDomains: strips wildcard prefix from *.domain", async () => {
  await withTmpDir(async (dir) => {
    const f = join(dir, "wild.conf");
    await writeFile(f, "server_name *.example.com;");
    const got = domainsOf(await extractDomains([f]));
    assert.ok(got.has("example.com"));
    assert.ok(!got.has("*.example.com"));
  });
});

test("extractDomains: unreadable path is skipped, not thrown", async () => {
  const hits = await extractDomains(["/nonexistent/path/does/not/exist.conf"]);
  assert.deepEqual(hits, []);
});

test("extractDomains: dedupes, recording first source", async () => {
  await withTmpDir(async (dir) => {
    const f = join(dir, "dup.conf");
    await writeFile(f, "server_name dup.example.com dup.example.com;");
    const hits = await extractDomains([f]);
    const dups = hits.filter((h) => h.domain === "dup.example.com");
    assert.equal(dups.length, 1);
    assert.equal(dups[0].source, f);
  });
});

test("buildWgSetArgs: add peer with endpoint + allowed-ips", () => {
  const args = buildWgSetArgs(
    {
      iface: "wg0",
      publicKey: "PUBKEY",
      endpoint: "1.2.3.4:51820",
      allowedIps: "10.0.0.2/32",
    },
    false,
  );
  assert.deepEqual(args, [
    "set",
    "wg0",
    "peer",
    "PUBKEY",
    "endpoint",
    "1.2.3.4:51820",
    "allowed-ips",
    "10.0.0.2/32",
  ]);
});

test("buildWgSetArgs: add peer with only required fields", () => {
  const args = buildWgSetArgs({ iface: "wg0", publicKey: "PUBKEY" }, false);
  assert.deepEqual(args, ["set", "wg0", "peer", "PUBKEY"]);
});

test("buildWgSetArgs: remove ignores optional fields", () => {
  const args = buildWgSetArgs(
    { iface: "wg0", publicKey: "PUBKEY", endpoint: "1.2.3.4:51820", allowedIps: "10.0.0.2/32" },
    true,
  );
  assert.deepEqual(args, ["set", "wg0", "peer", "PUBKEY", "remove"]);
});

test("WG_KEY_RE: accepts valid base64 wg keys, rejects junk", () => {
  // 44-char base64 ending in '=' (43 sig chars + '=')
  assert.ok(WG_KEY_RE.test("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ="));
  assert.ok(!WG_KEY_RE.test("too-short="));
  assert.ok(!WG_KEY_RE.test("no-equals-sign-padding-aaaaaaaaaaaaaaaaaaaaaa"));
  assert.ok(!WG_KEY_RE.test("has spaces in it aaaaaaaaaaaaaaaaaaaaaaaaaa="));
});

test("WG_IFACE_RE: accepts sane iface names, rejects bad ones", () => {
  assert.ok(WG_IFACE_RE.test("wg0"));
  assert.ok(WG_IFACE_RE.test("wg-home"));
  assert.ok(!WG_IFACE_RE.test("")); // empty
  assert.ok(!WG_IFACE_RE.test("wg0; rm -rf")); // shell injection
  assert.ok(!WG_IFACE_RE.test("a".repeat(16))); // too long (max 15)
});

test("readHostsFile: parses entries from an overridden hosts path", async () => {
  await withTmpDir(async (dir) => {
    const f = join(dir, "hosts");
    await writeFile(
      f,
      `# a comment
127.0.0.1   localhost
10.0.0.5    db.internal cache.internal
192.168.1.1 router   # inline comment

`,
    );
    const saved = process.env.NETOPS_HOSTS_FILE;
    process.env.NETOPS_HOSTS_FILE = f;
    try {
      const entries = await readHostsFile();
      const byIp = Object.fromEntries(entries.map((e) => [e.ip, e.hostnames]));
      assert.deepEqual(byIp["127.0.0.1"], ["localhost"]);
      assert.deepEqual(byIp["10.0.0.5"], ["db.internal", "cache.internal"]);
      // inline comment is stripped, leaving just the hostname
      assert.deepEqual(byIp["192.168.1.1"], ["router"]);
    } finally {
      if (saved === undefined) delete process.env.NETOPS_HOSTS_FILE;
      else process.env.NETOPS_HOSTS_FILE = saved;
    }
  });
});

test("readHostsFile: missing file yields empty array, not a throw", async () => {
  const saved = process.env.NETOPS_HOSTS_FILE;
  process.env.NETOPS_HOSTS_FILE = "/no/such/hosts/file/here";
  try {
    assert.deepEqual(await readHostsFile(), []);
  } finally {
    if (saved === undefined) delete process.env.NETOPS_HOSTS_FILE;
    else process.env.NETOPS_HOSTS_FILE = saved;
  }
});
