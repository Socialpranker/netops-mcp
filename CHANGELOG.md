# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Brand identity: "Verdict Stack" logo (`assets/logo-dark.svg` + `assets/logo-light.svg`),
  theme-aware via `<picture>` in the README header.
- Social preview image (`assets/og-image.png`, 1280×640) generated from `assets/og-image.svg`.
- `CHANGELOG.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1) and `.github/FUNDING.yml`.
- `author` field in `package.json`.
- Unit test suite (`node:test`, no new runtime deps): 37 cases covering the scope-guard
  (allow/deny matching, CIDR, port caps, write/network gates, env/argv parsing) and the
  fragile parsers (`extractDomains`, the `wg set` argv builder, hosts-file reader).
  Run with `npm run test:unit`; the full `npm test` does build + unit + smoke.
- ESLint (typescript-eslint, type-aware) and Prettier with `lint` / `format` / `format:check`
  scripts and a dedicated CI lint job. `prepublishOnly` now runs lint + the full test suite.
- README: "A network tool you can hand your assistant safely" section with a verifiable
  trust-comparison table (netops-mcp vs alpadalar/netops-mcp, globalping-mcp, ProbeOps)
  across read-only / no-shell / untrusted-input wrapper / zero-telemetry / local-first /
  WireGuard / transport, and a `shell-none` badge.
- **`.mcpb` bundle for one-click install in Claude Desktop** — `manifest.json` (MCPB spec
  0.3) plus `scripts/build-mcpb.mjs` and an `npm run build:mcpb` script that compiles,
  bundles production deps into a self-contained `server/`, syncs the version from
  `package.json`, and packs `netops-mcp.mcpb`. Flags are exposed as install-dialog toggles
  (local-only, WireGuard writes, allow/deny, max-ports) via `user_config`. `npm run
  validate:mcpb` checks the manifest. (Distributed as a GitHub release asset, not on npm.)
- `server` `instructions` on the `McpServer` — tells the model to start with `net_diagnose`
  for verdicts, use `net_triangulate` for "is it me or them?", prefer the orchestrators over
  hand-chaining single probes, and always surface the raw data under a verdict.
- README `Install` section reworked for first-run: one-click `.mcpb` path, a Windows
  `cmd /c npx` config, why `-y` is required, and a "don't see the tools?" 3-step checklist.

### Fixed

- `test:unit` failed on Node 20 in CI (`Could not find 'test/**/*.test.mjs'`): the quoted
  `**` glob relied on `node --test`'s native glob support, which only exists on Node 21+.
  Switched to `node --test test/*.test.mjs` — a POSIX glob the shell expands on any Node version.

### Changed

- README repositioned around "diagnosis with a verdict, locally": new tagline
  *"Network diagnosis that tells you whose side the problem is on — locally"*; the
  "What is this?" section now leads with the pain (a site that loads for everyone but you)
  and the contrast against cloud checkers that probe from a data center and can't see your
  machine; "Why it's different" attributes verdicts to the right tools (`net_triangulate`
  for the global YOUR/THEIR-SIDE call, `config_correlate` for the `/etc/hosts` catch) and
  adds the no-shell / untrusted-wrapper safety framing. No "AI-powered", no marketing buzzwords.
- README restructured for the GitHub landing page: hero with logo, table of contents,
  and the tool reference folded into a collapsible `<details>` block.
- `NETOPS_LOCAL_ONLY` / `NETOPS_ENABLE_WRITE` now accept any truthy string
  (`1`/`true`/`yes`/`on`, case-insensitive) instead of only `"1"`, so the `.mcpb` boolean
  toggles (which serialize to `"true"`/`"false"`) work. The old `"1"` form still works.
- Version string de-duplicated within `src/index.ts` (single `VERSION` const) instead of
  two hardcoded literals.

### Note

- The social preview image cannot be set via the GitHub API. To publish it, a maintainer must
  upload `assets/og-image.png` manually under **Settings → General → Social preview**.

## [0.1.0] — 2026-06-13

Initial release. A local-first MCP server for network diagnostics and tunnel/proxy
inspection — 19 tools that return human-readable verdicts, not raw dumps. Read-only
by default; the only state-mutating tools are gated behind a flag.

### Added

- Diagnostic tools that reason about results: `net_diagnose`, `net_triangulate`,
  `diagnosis_bundle`, `config_correlate`, `net_overview`, `cert_sweep`, and more.
- WireGuard / proxy inspection. The state-mutating peer operations
  (`wg_peer_add` / `wg_peer_remove`) are gated behind `--enable-write` and run as a
  dry-run unless `confirm:true`.
- MCP tool annotations (read-only / open-world hints) for all 19 tools.
- `--local-only` flag: the only outbound calls (globalping, ipify) are documented in
  [SECURITY.md](./SECURITY.md) and both honor this flag.
- Honest `config_correlate` demo GIF (`assets/cli.gif`), rendered in CI from a VHS tape.

### Security

- No shell: system utilities are invoked via `execFile` with an argv array, never a shell string.
- Network output is marked untrusted and sanitized against indirect prompt injection
  before it reaches the model.

[Unreleased]: https://github.com/Socialpranker/netops-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Socialpranker/netops-mcp/releases/tag/v0.1.0
