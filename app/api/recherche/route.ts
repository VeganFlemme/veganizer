import { NextResponse, type NextRequest } from "next/server";
import { searchCatalog } from "@/lib/compare/data";

// GET /api/recherche?q=… — catalogue search (verified pairs, then Ciqual / Agribalyse foods).
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  if (q.trim().length < 2) return NextResponse.json({ hits: [] });
  try {
    return NextResponse.json({ hits: await searchCatalog(q) }, { headers: { "cache-control": "public, max-age=60, s-maxage=600" } });
  } catch {
    return NextResponse.json({ hits: [], error: "La recherche est indisponible pour le moment." }, { status: 503 });
  }
}
