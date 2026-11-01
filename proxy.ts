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

// /aliment/<code>: existence checked code by code (3 684 foods), answers cached for TTL_MS.
const foodCache = new Map<string, { at: number; exists: boolean }>();
const FOOD_CACHE_MAX = 5000;

async function foodExists(code: string): Promise<boolean | null> {
  const hit = foodCache.get(code);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.exists;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/foods?select=code&code=eq.${encodeURIComponent(code)}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const exists = ((await res.json()) as unknown[]).length > 0;
    if (foodCache.size > FOOD_CACHE_MAX) foodCache.clear();
    foodCache.set(code, { at: Date.now(), exists });
    return exists;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const [, section, rawSlug] = request.nextUrl.pathname.split("/");
  if (!rawSlug) return NextResponse.next();
  const slug = decodeURIComponent(rawSlug);
  // Fail open: if the data cannot be read, the page itself still shows "introuvable".
  if (section === "aliment") {
    const exists = await foodExists(slug);
    if (exists !== false) return NextResponse.next();
    return notFoundResponse(request);
  }
  const slugs = await publishedSlugs();
  if (!slugs || slugs.has(slug)) return NextResponse.next();
  return notFoundResponse(request);
}

async function notFoundResponse(request: NextRequest) {
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

export const config = { matcher: ["/compare/:slug*", "/aliment/:code*"] };
