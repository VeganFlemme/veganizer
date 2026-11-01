import { ImageResponse } from "next/og";
import { getPairPage, listPairs } from "@/lib/compare/data";
import { CLIMATE_MAIN } from "@/lib/compare/config";
import { formatValue, gapSentence } from "@/lib/format";

export const alt = "Comparaison d’un plat et de son alternative végétale — Veganizer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const pairs = await listPairs();
  return pairs.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = await getPairPage(slug);
  const maison = model?.variants.maison ?? model?.variants.commerce;
  const co2 = maison?.rows.perServing.find((r) => r.id === CLIMATE_MAIN);
  const source = co2?.sourceIds.map((id) => model?.sources[id]).filter(Boolean)[0];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#ffffff", color: "#18181b" }}>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#065f46" }}>Veganizer</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{model ? `${model.animal.name} : et en version végétale ?` : "Comparer un plat et son alternative végétale"}</div>
          {maison && co2?.reductionPercent != null && co2.animal?.value != null && co2.vegetal?.value != null && (
            <div style={{ display: "flex", fontSize: 40, color: "#064e3b" }}>
              {`${maison.dish.name} : ${gapSentence(co2.reductionPercent)} de CO₂e par portion (${formatValue(co2.vegetal.value)} kg contre ${formatValue(co2.animal.value)} kg)`}
            </div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#3f3f46" }}>
          {source ? `Source : ${source.name}${source.version ? `, version ${source.version}` : ""} · veganizer` : "Chiffres sourcés · veganizer"}
        </div>
      </div>
    ),
    size,
  );
}
