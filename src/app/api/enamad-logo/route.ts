const ENAMAD_URL =
  "https://trustseal.enamad.ir/logo.aspx?id=710295&Code=ox1vsnxyEfEQIT9YEy7YjjWvSikf3agS";
const TTL_MS = 3600_000; // 1 hour

let cache: { buffer: ArrayBuffer; contentType: string; at: number } | null = null;
let fetching = false;

async function fetchEnamadLogo(): Promise<void> {
  if (fetching) return;
  fetching = true;
  try {
    const res = await fetch(ENAMAD_URL, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Referer: "https://academy-rashed.ir/",
        "User-Agent": "Mozilla/5.0 (compatible; academy-rashed.ir)",
      },
    });
    if (!res.ok) return;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("Content-Type") || "image/png";
    cache = { buffer, contentType, at: Date.now() };
  } catch {
    // silently fail — stale cache or null stays
  } finally {
    fetching = false;
  }
}

// Pre-warm cache on module load (runs once when the server starts)
fetchEnamadLogo();

export async function GET() {
  const now = Date.now();

  // Serve stale immediately and refresh in background
  if (cache && now - cache.at >= TTL_MS) {
    fetchEnamadLogo();
  }

  // First request on cold start: wait for the fetch
  if (!cache) {
    await fetchEnamadLogo();
  }

  if (!cache) {
    return new Response(null, { status: 204 });
  }

  return new Response(cache.buffer.slice(0), {
    headers: {
      "Content-Type": cache.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
