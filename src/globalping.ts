/**
 * Globalping API client — runs the SAME test from remote probes worldwide, so we
 * can compare "from my machine" vs "from elsewhere" and answer: is it me or them?
 * Free, no API key required. https://api.globalping.io/v1/measurements
 */

const BASE = "https://api.globalping.io/v1/measurements";

export interface GpProbeResult {
  location: string;
  reachable: boolean;
  rawStatus?: string;
  summary?: string;
}

export interface GpMeasurement {
  id?: string;
  type: string;
  target: string;
  results: GpProbeResult[];
  error?: string;
}

interface CreateResp {
  id: string;
}

/**
 * Run a ping (default) from a few global locations and return per-probe reachability.
 * @param locations magic strings like "US", "EU", "Asia", "world" (defaults to a spread).
 */
export async function globalpingTest(
  target: string,
  type: "ping" | "http" | "dns" = "ping",
  locations: string[] = ["US", "EU", "Asia"],
  limit = 3,
  timeoutMs = 20000,
): Promise<GpMeasurement> {
  try {
    const body = {
      type,
      target,
      locations: locations.map((magic) => ({ magic })),
      limit,
      measurementOptions: type === "ping" ? { packets: 3 } : undefined,
    };
    const created = await fetchJson<CreateResp>(
      BASE,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      timeoutMs,
    );
    if (!created?.id) return { type, target, results: [], error: "no measurement id returned" };

    // Poll until finished.
    const deadline = Date.now() + timeoutMs;
    let last: any = null;
    while (Date.now() < deadline) {
      await sleep(800);
      last = await fetchJson<any>(`${BASE}/${created.id}`, {}, timeoutMs);
      if (last?.status === "finished") break;
    }
    if (!last) return { type, target, results: [], error: "no response while polling" };

    const results: GpProbeResult[] = (last.results ?? []).map((r: any) => {
      const loc = r.probe
        ? `${r.probe.city ?? ""} ${r.probe.country ?? ""}`.trim() || r.probe.country
        : "unknown";
      const status: string = r.result?.status ?? "unknown";
      // ping: result.stats.loss; http: result.statusCode
      let reachable = status === "finished";
      if (type === "ping" && r.result?.stats) {
        reachable = (r.result.stats.loss ?? 100) < 100;
      }
      if (type === "http" && typeof r.result?.statusCode === "number") {
        reachable = r.result.statusCode > 0;
      }
      const summary =
        type === "ping" && r.result?.stats
          ? `loss ${r.result.stats.loss}% avg ${r.result.stats.avg}ms`
          : type === "http" && r.result?.statusCode
            ? `HTTP ${r.result.statusCode}`
            : status;
      return { location: loc, reachable, rawStatus: status, summary };
    });

    return { id: created.id, type, target, results };
  } catch (e) {
    return { type, target, results: [], error: e instanceof Error ? e.message : String(e) };
  }
}

async function fetchJson<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok && res.status !== 202) {
      throw new Error(`globalping HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch this machine's public egress IP (used by dns_leak / tunnel checks). */
export async function egressIp(timeoutMs = 6000, localAddress?: string): Promise<string | null> {
  // Uses a plain text echo endpoint. localAddress lets us bind to a specific interface.
  try {
    if (localAddress) {
      // Node fetch can't bind localAddress directly; fall back to https module path.
      return await egressIpBound(localAddress, timeoutMs);
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.ipify.org", { signal: ctrl.signal });
      return (await res.text()).trim() || null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

async function egressIpBound(localAddress: string, timeoutMs: number): Promise<string | null> {
  const https = await import("node:https");
  return new Promise((resolve) => {
    const req = https.request(
      "https://api.ipify.org",
      { method: "GET", localAddress, timeout: timeoutMs },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data.trim() || null));
      },
    );
    req.once("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.once("error", () => resolve(null));
    req.end();
  });
}
