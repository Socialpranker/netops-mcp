/**
 * Safe system-command runner. Always execFile with an argv array — never a shell
 * string — so target values can't inject commands. Includes a hard timeout.
 */

import { execFile } from "node:child_process";

export interface RunResult {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function run(cmd: string, args: string[], timeoutMs = 8000): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = execFile(
      cmd,
      args,
      { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
      (err, stdout, stderr) => {
        const e = err as (Error & { signal?: string; code?: number | string }) | null;
        const timedOut = Boolean(e && e.signal === "SIGTERM");
        resolve({
          ok: !err,
          code: e ? (typeof e.code === "number" ? e.code : null) : 0,
          stdout: stdout?.toString() ?? "",
          stderr: stderr?.toString() ?? "",
          timedOut,
        });
      },
    );
    child.on("error", () => {
      /* swallowed: resolved by callback with err */
    });
  });
}

/** Run a command feeding `input` to stdin (e.g. `wg pubkey`). */
export function runWithInput(
  cmd: string,
  args: string[],
  input: string,
  timeoutMs = 5000,
): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = execFile(
      cmd,
      args,
      { timeout: timeoutMs, maxBuffer: 1024 * 1024, windowsHide: true },
      (err, stdout, stderr) => {
        const e = err as (Error & { signal?: string; code?: number | string }) | null;
        resolve({
          ok: !err,
          code: e ? (typeof e.code === "number" ? e.code : null) : 0,
          stdout: stdout?.toString() ?? "",
          stderr: stderr?.toString() ?? "",
          timedOut: Boolean(e && e.signal === "SIGTERM"),
        });
      },
    );
    child.stdin?.end(input);
  });
}

/** True if a binary exists on PATH (best-effort, cross-platform). */
export async function hasBinary(name: string): Promise<boolean> {
  const probe = process.platform === "win32" ? "where" : "which";
  const r = await run(probe, [name], 3000);
  return r.ok && r.stdout.trim().length > 0;
}
