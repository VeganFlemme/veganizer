import { NextResponse, type NextRequest } from "next/server";

// Real HTTP 404 for unknown /compare/<slug>. With Cache Components the page streams its
// shell before notFound() can run, so the status would stay 200: we check the slug first.
// Node.js runtime (Next 16 default for proxy), publishable key only (RLS applies).
const TTL_MS = 10 * 60 * 1000;
let cache: { at: number; slugs: Set<string> } | null = null;

async function publishedSlugs(): Promise<Set<string> | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.slugs;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/dishes?select=slug&kind=eq.animal&is_published=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { slug: string }[];
    cache = { at: Date.now(), slugs: new Set(rows.map((r) => r.slug)) };
    return cache.slugs;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (!slug) return NextResponse.next();
  const slugs = await publishedSlugs();
  // Fail open: if the list cannot be read, the page itself still shows "introuvable".
  if (!slugs || slugs.has(decodeURIComponent(slug))) return NextResponse.next();
  const target = new URL("/introuvable", request.url);
  // Client-side navigations (RSC requests) keep Next's rewrite; full page loads get the HTML
  // of /introuvable with a real 404 status (a rewrite cannot change the status code).
  if (request.headers.get("rsc")) return NextResponse.rewrite(target);
  try {
    const page = await fetch(target, { headers: { accept: "text/html" } });
    return new NextResponse(page.body, { status: 404, headers: { "content-type": page.headers.get("content-type") ?? "text/html; charset=utf-8" } });
  } catch {
    return new NextResponse("Page introuvable", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}

export const config = { matcher: "/compare/:slug*" };
