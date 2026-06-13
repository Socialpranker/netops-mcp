# Contributing to netops-mcp

Thanks for taking the time. This is a small, focused project — a local-first network
diagnostics MCP server. Contributions that keep it small, safe, and honest are welcome.

## Getting started

```bash
git clone https://github.com/Socialpranker/netops-mcp.git
cd netops-mcp
npm install
npm run build
npm run smoke      # boots the server and asserts the MCP handshake + tool count
```

`npm run smoke` is what CI runs. If it passes locally, CI should be green.

## Ground rules

- **Read-only stays the default.** Any tool that mutates state must be gated behind
  `--enable-write` and dry-run unless `confirm:true`, the way `wg_peer_add/remove` are.
- **No shell.** System utilities are invoked via `execFile` with an argv array — never a
  shell string. Validate and reject untrusted input before building a command.
- **No telemetry.** The only outbound calls are the two documented in
  [SECURITY.md](./SECURITY.md), and both must honor `--local-only`.
- **Verdicts over raw dumps.** The value of this server is that it reasons about results.
  New diagnostic tools should return a human-readable conclusion, not just JSON.
- **Degrade gracefully.** A missing binary (`ping`, `traceroute`, `wg`) should produce a
  clear "not available" result, never a crash.

## Pull requests

- Keep PRs focused — one logical change.
- Run `npm run build && npm run smoke` before pushing.
- Describe what you changed and why. If you added a tool, note its safety properties.

## Reporting bugs

Open an [issue](https://github.com/Socialpranker/netops-mcp/issues) with the tool you
called, the arguments, what you expected, and what you got. For anything
security-sensitive, open a private advisory instead — see [SECURITY.md](./SECURITY.md).
