import { ImageResponse } from "next/og";
import { ShareImage } from "@/components/ui/ShareImage";
import { buildAutoPage } from "@/lib/compare/auto";
import { getAutoPair } from "@/lib/compare/auto-data";
import { listPairs } from "@/lib/compare/data";

export const alt = "Un plat face à sa version végétale — Veganizer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const pairs = await listPairs();
  return pairs.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pair = await getAutoPair(slug);
  const model = pair ? buildAutoPage(pair.input, pair.defaultCode, { light: true })?.model : null;
  const v = pair && model ? model.variants[pair.defaultCode] : undefined;
  const verdict = v?.scores.verdict;
  return new ImageResponse(
    <ShareImage
      title={model?.animal.name ?? "Un plat face à sa version végétale"}
      plant={v?.dish.name}
      headline={verdict ? `${verdict.vegetalWins} sur ${verdict.total}` : undefined}
      caption={verdict ? "catégories gagnées par la version végétale" : undefined}
      footer="Nutrition, santé, environnement, protection animale, économie : chaque chiffre sourcé."
    />,
    size,
  );
}
