import { NextResponse, type NextRequest } from "next/server";
import { getRecipeData } from "@/lib/compare/data";

// GET /api/recette/donnees?codes=a,b,c — data to compute a recipe in the browser (no AI, no account).
export async function GET(request: NextRequest) {
  const codes = (request.nextUrl.searchParams.get("codes") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => /^[0-9A-Za-z_]{1,20}$/.test(c));
  if (codes.length === 0) return NextResponse.json({ error: "codes manquants" }, { status: 400 });
  try {
    const data = await getRecipeData(codes);
    if (!data) return NextResponse.json({ error: "aliments inconnus" }, { status: 404 });
    return NextResponse.json(data, { headers: { "cache-control": "public, max-age=300, s-maxage=3600" } });
  } catch {
    return NextResponse.json({ error: "indisponible" }, { status: 503 });
  }
}
