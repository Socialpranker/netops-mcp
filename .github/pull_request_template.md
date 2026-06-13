## What & why

<!-- What does this change, and what problem does it solve? -->

## Checklist

- [ ] `npm run build && npm run smoke` passes locally
- [ ] No new shell strings — system calls use `execFile` with an argv array
- [ ] Any mutating behavior is gated behind `--enable-write` and dry-run unless `confirm:true`
- [ ] Any new outbound call honors `--local-only` and is documented in SECURITY.md
- [ ] New diagnostic tools return a human-readable verdict, not just raw JSON
