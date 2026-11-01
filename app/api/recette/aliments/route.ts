import { NextResponse, type NextRequest } from "next/server";
import { searchIngredients } from "@/lib/compare/data";

// GET /api/recette/aliments?q=… — ingredient autocompletion (pure foods only, rule 9).
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  if (q.trim().length < 2) return NextResponse.json({ hits: [] });
  try {
    return NextResponse.json({ hits: await searchIngredients(q) }, { headers: { "cache-control": "public, max-age=60, s-maxage=600" } });
  } catch {
    return NextResponse.json({ hits: [], error: "indisponible" }, { status: 503 });
  }
}
