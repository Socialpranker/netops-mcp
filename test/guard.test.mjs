// Unit tests for the scope-guard — the safety core of netops-mcp.
// Runs against the built output (dist/) so we test exactly what ships.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Guard, GuardError, DEFAULT_GUARD, guardFromEnv } from "../dist/guard.js";

const mk = (over = {}) => new Guard({ ...DEFAULT_GUARD, audit: false, ...over });

test("checkTarget: rejects empty / whitespace targets", () => {
  const g = mk();
  assert.throws(() => g.checkTarget(""), GuardError);
  assert.throws(() => g.checkTarget("   "), GuardError);
});

test("checkTarget: rejects shell metacharacters and whitespace", () => {
  const g = mk();
  for (const bad of [
    "a;b",
    "a&b",
    "a|b",
    "a`b`",
    "a$b",
    "a(b)",
    "a{b}",
    "a<b",
    "a>b",
    "a\\b",
    "a b",
  ]) {
    assert.throws(() => g.checkTarget(bad), GuardError, `expected reject: ${bad}`);
  }
});

test("checkTarget: accepts plain hostnames and IPs when no lists set", () => {
  const g = mk();
  assert.doesNotThrow(() => g.checkTarget("example.com"));
  assert.doesNotThrow(() => g.checkTarget("sub.example.com"));
  assert.doesNotThrow(() => g.checkTarget("10.0.0.1"));
  assert.doesNotThrow(() => g.checkTarget("2001:db8::1")); // colons are allowed (not in metachar set)
});

test("checkTarget: denylist exact match blocks", () => {
  const g = mk({ deny: ["evil.com"] });
  assert.throws(() => g.checkTarget("evil.com"), GuardError);
  assert.doesNotThrow(() => g.checkTarget("good.com"));
});

test("checkTarget: denylist wildcard (*.suffix) blocks subdomains", () => {
  const g = mk({ deny: ["*.evil.com"] });
  assert.throws(() => g.checkTarget("api.evil.com"), GuardError);
  assert.throws(() => g.checkTarget("a.b.evil.com"), GuardError);
  // bare apex does not match "*.evil.com" (suffix is ".evil.com")
  assert.doesNotThrow(() => g.checkTarget("evil.com"));
});

test("checkTarget: allowlist strict mode blocks everything not listed", () => {
  const g = mk({ allow: ["example.com", "*.internal.net"] });
  assert.doesNotThrow(() => g.checkTarget("example.com"));
  assert.doesNotThrow(() => g.checkTarget("host.internal.net"));
  assert.throws(() => g.checkTarget("other.com"), GuardError);
});

test("checkTarget: empty allowlist means allow-all (not deny-all)", () => {
  const g = mk({ allow: [] });
  assert.doesNotThrow(() => g.checkTarget("anything.com"));
});

test("checkTarget: deny takes precedence over allow", () => {
  const g = mk({ allow: ["*.example.com"], deny: ["bad.example.com"] });
  assert.doesNotThrow(() => g.checkTarget("good.example.com"));
  assert.throws(() => g.checkTarget("bad.example.com"), GuardError);
});

test("checkTarget: CIDR denylist matches IPs inside the range", () => {
  const g = mk({ deny: ["10.0.0.0/8"] });
  assert.throws(() => g.checkTarget("10.1.2.3"), GuardError);
  assert.throws(() => g.checkTarget("10.255.255.255"), GuardError);
  assert.doesNotThrow(() => g.checkTarget("11.0.0.1"));
});

test("checkTarget: CIDR allowlist (strict) only permits in-range IPs", () => {
  const g = mk({ allow: ["192.168.0.0/16"] });
  assert.doesNotThrow(() => g.checkTarget("192.168.50.1"));
  assert.throws(() => g.checkTarget("192.169.0.1"), GuardError);
});

test("checkTarget: /32 CIDR matches a single host only", () => {
  const g = mk({ deny: ["203.0.113.5/32"] });
  assert.throws(() => g.checkTarget("203.0.113.5"), GuardError);
  assert.doesNotThrow(() => g.checkTarget("203.0.113.6"));
});

test("checkPorts: rejects empty list", () => {
  assert.throws(() => mk().checkPorts([]), GuardError);
});

test("checkPorts: enforces the per-call cap", () => {
  const g = mk({ maxPortsPerCall: 3 });
  assert.doesNotThrow(() => g.checkPorts([22, 80, 443]));
  assert.throws(() => g.checkPorts([1, 2, 3, 4]), GuardError);
});

test("checkPorts: rejects out-of-range and non-integer ports", () => {
  const g = mk();
  assert.throws(() => g.checkPorts([0]), GuardError);
  assert.throws(() => g.checkPorts([65536]), GuardError);
  assert.throws(() => g.checkPorts([-1]), GuardError);
  assert.throws(() => g.checkPorts([80.5]), GuardError);
  assert.throws(() => g.checkPorts([NaN]), GuardError);
});

test("checkPorts: accepts valid boundary ports", () => {
  assert.doesNotThrow(() => mk().checkPorts([1, 65535]));
});

test("assertWriteEnabled: gated off by default, open with allowWrite", () => {
  assert.throws(() => mk().assertWriteEnabled("wg_peer_add"), GuardError);
  assert.doesNotThrow(() => mk({ allowWrite: true }).assertWriteEnabled("wg_peer_add"));
});

test("assertNetworkAllowed: blocked in localOnly mode", () => {
  assert.throws(() => mk({ localOnly: true }).assertNetworkAllowed("globalping"), GuardError);
  assert.doesNotThrow(() => mk({ localOnly: false }).assertNetworkAllowed("globalping"));
});

test("guardFromEnv: CLI flags toggle the right config", () => {
  const g = guardFromEnv(["--enable-write", "--local-only", "--no-audit"]);
  assert.equal(g.cfg.allowWrite, true);
  assert.equal(g.cfg.localOnly, true);
  assert.equal(g.cfg.audit, false);
});

test("guardFromEnv: defaults when no flags/env", () => {
  const saved = { ...process.env };
  delete process.env.NETOPS_ALLOW;
  delete process.env.NETOPS_DENY;
  delete process.env.NETOPS_MAX_PORTS;
  delete process.env.NETOPS_LOCAL_ONLY;
  delete process.env.NETOPS_ENABLE_WRITE;
  try {
    const g = guardFromEnv([]);
    assert.equal(g.cfg.allowWrite, false);
    assert.equal(g.cfg.localOnly, false);
    assert.equal(g.cfg.audit, true);
    assert.equal(g.cfg.maxPortsPerCall, 20);
    assert.deepEqual(g.cfg.allow, []);
    assert.deepEqual(g.cfg.deny, []);
  } finally {
    Object.assign(process.env, saved);
  }
});

test("guardFromEnv: env lists are split on commas and spaces", () => {
  const saved = { ...process.env };
  process.env.NETOPS_ALLOW = "example.com, *.internal.net  10.0.0.0/8";
  process.env.NETOPS_DENY = "evil.com";
  process.env.NETOPS_MAX_PORTS = "5";
  try {
    const g = guardFromEnv([]);
    assert.deepEqual(g.cfg.allow, ["example.com", "*.internal.net", "10.0.0.0/8"]);
    assert.deepEqual(g.cfg.deny, ["evil.com"]);
    assert.equal(g.cfg.maxPortsPerCall, 5);
  } finally {
    process.env.NETOPS_ALLOW = saved.NETOPS_ALLOW;
    process.env.NETOPS_DENY = saved.NETOPS_DENY;
    process.env.NETOPS_MAX_PORTS = saved.NETOPS_MAX_PORTS;
    if (saved.NETOPS_ALLOW === undefined) delete process.env.NETOPS_ALLOW;
    if (saved.NETOPS_DENY === undefined) delete process.env.NETOPS_DENY;
    if (saved.NETOPS_MAX_PORTS === undefined) delete process.env.NETOPS_MAX_PORTS;
  }
});

test("guardFromEnv: NETOPS_*=1 env equivalents to flags", () => {
  const saved = { ...process.env };
  process.env.NETOPS_LOCAL_ONLY = "1";
  process.env.NETOPS_ENABLE_WRITE = "1";
  try {
    const g = guardFromEnv([]);
    assert.equal(g.cfg.localOnly, true);
    assert.equal(g.cfg.allowWrite, true);
  } finally {
    if (saved.NETOPS_LOCAL_ONLY === undefined) delete process.env.NETOPS_LOCAL_ONLY;
    else process.env.NETOPS_LOCAL_ONLY = saved.NETOPS_LOCAL_ONLY;
    if (saved.NETOPS_ENABLE_WRITE === undefined) delete process.env.NETOPS_ENABLE_WRITE;
    else process.env.NETOPS_ENABLE_WRITE = saved.NETOPS_ENABLE_WRITE;
  }
});

test("guardFromEnv: NETOPS_* accept truthy strings, reject falsy ones", () => {
  const saved = { ...process.env };
  try {
    // truthy: "true"/"yes"/"on" (case-insensitive) behave like "1" — needed so the
    // .mcpb bundle's boolean toggles, which serialize to "true"/"false", work.
    for (const v of ["true", "TRUE", "yes", "on", "1"]) {
      process.env.NETOPS_LOCAL_ONLY = v;
      assert.equal(guardFromEnv([]).cfg.localOnly, true, `expected truthy for ${v}`);
    }
    // falsy: "false"/"0"/"" must NOT enable the flag
    for (const v of ["false", "0", "", "no", "off"]) {
      process.env.NETOPS_LOCAL_ONLY = v;
      assert.equal(guardFromEnv([]).cfg.localOnly, false, `expected falsy for "${v}"`);
    }
  } finally {
    if (saved.NETOPS_LOCAL_ONLY === undefined) delete process.env.NETOPS_LOCAL_ONLY;
    else process.env.NETOPS_LOCAL_ONLY = saved.NETOPS_LOCAL_ONLY;
  }
});

test("guardFromEnv: invalid NETOPS_MAX_PORTS is ignored (keeps default)", () => {
  const saved = process.env.NETOPS_MAX_PORTS;
  process.env.NETOPS_MAX_PORTS = "not-a-number";
  try {
    assert.equal(guardFromEnv([]).cfg.maxPortsPerCall, 20);
  } finally {
    if (saved === undefined) delete process.env.NETOPS_MAX_PORTS;
    else process.env.NETOPS_MAX_PORTS = saved;
  }
});
