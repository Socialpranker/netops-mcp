#!/usr/bin/env node
/**
 * Build the .mcpb bundle for double-click install in Claude Desktop.
 *
 * Layout produced (in mcpb-build/, gitignored):
 *   manifest.json            — copied from repo root, version synced from package.json
 *   server/                  — compiled dist/*.js (the MCP server)
 *   server/node_modules/     — production dependencies only
 *   package.json             — prod deps manifest used to install node_modules
 *
 * Then `mcpb pack` zips it into netops-mcp.mcpb at the repo root.
 *
 * Run: npm run build:mcpb   (requires a prior `npm run build`; this script does it)
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = join(root, "mcpb-build");
const serverDir = join(buildDir, "server");
const outFile = join(root, "netops-mcp.mcpb");

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: "inherit", cwd: root, ...opts });
}

// 1. Fresh compile.
console.log("→ compiling TypeScript (tsc)…");
run("npm", ["run", "build"]);
if (!existsSync(join(root, "dist", "index.js"))) {
  throw new Error("dist/index.js missing after build — aborting");
}

// 2. Clean build dir.
rmSync(buildDir, { recursive: true, force: true });
mkdirSync(serverDir, { recursive: true });

// 3. Copy compiled server.
cpSync(join(root, "dist"), serverDir, { recursive: true });

// 4. Sync the manifest version from package.json (single source of truth), copy it in.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
if (manifest.version !== pkg.version) {
  console.log(`→ syncing manifest version ${manifest.version} → ${pkg.version} from package.json`);
  manifest.version = pkg.version;
  // Keep the repo manifest authoritative too, so `mcpb validate manifest.json` agrees.
  writeFileSync(join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
}
writeFileSync(join(buildDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// 5. Install production dependencies into server/ so the bundle is self-contained.
const bundlePkg = {
  name: pkg.name,
  version: pkg.version,
  private: true,
  type: pkg.type,
  dependencies: pkg.dependencies,
};
writeFileSync(join(serverDir, "package.json"), JSON.stringify(bundlePkg, null, 2) + "\n");
console.log("→ installing production dependencies into the bundle…");
run("npm", ["install", "--omit=dev", "--no-package-lock", "--no-audit", "--no-fund"], {
  cwd: serverDir,
});

// 6. Pack.
console.log("→ packing .mcpb…");
rmSync(outFile, { force: true });
run("npx", ["-y", "@anthropic-ai/mcpb@latest", "pack", buildDir, outFile]);

console.log(`\n✓ built ${outFile}`);
