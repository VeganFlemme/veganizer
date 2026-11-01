"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BASES, CLIMATE_MAIN, COVERAGE_WARNING } from "@/lib/compare/config";
import type { CriterionRow, DishView, PairPageModel, SideValue, SourceRow, Variant, VariantView } from "@/lib/compare/view";
import type { Basis } from "@/lib/scoring";
import { formatEur, formatInt, formatPercent, formatValue, gapSentence, MISSING } from "@/lib/format";

const VARIANT_LABEL: Record<Variant, string> = { maison: "Fait maison", commerce: "Du commerce" };

// ---------------------------------------------------------------------------
function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
            value === o.id ? "border-emerald-800 bg-emerald-800 text-white" : "border-zinc-400 bg-white text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SourceBadges({ ids, sources }: { ids: string[]; sources: Record<string, SourceRow> }) {
  if (ids.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => {
        const s = sources[id];
        return (
          <Link
            key={id}
            href={`/sources#${id}`}
            className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-800 hover:underline"
            title={s ? `${s.name}${s.version ? `, ${s.version}` : ""} — licence : ${s.license}` : id}
          >
            Source : {sourceLabel(id)}
            {s?.commercial_use === false && " · usage non commercial"}
          </Link>
        );
      })}
    </span>
  );
}

function Value({ v, unit }: { v: SideValue | null; unit: string }) {
  if (!v || v.value == null) return <span className="text-amber-800">{MISSING}</span>;
  return (
    <span>
      <span className="font-semibold">{formatValue(v.value)}</span> {unit}
      {v.rangePublished && (
        <span className="block text-xs text-zinc-700">
          fourchette {formatValue(v.low)} à {formatValue(v.high)}
        </span>
      )}
      {v.coverage < COVERAGE_WARNING && (
        <span className="block text-xs text-amber-800">données pour {formatPercent(v.coverage * 100)} de la masse</span>
      )}
    </span>
  );
}

function Verdict({ row }: { row: CriterionRow }) {
  const gap = gapSentence(row.reductionPercent);
  if (row.lowCoverage && row.reductionPercent != null)
    return <span className="text-zinc-800">Version végétale : {gap} (indicatif : données partielles, pas de verdict)</span>;
  if (row.winner === "vegetal") return <span className="text-emerald-800">Version végétale : {gap} · mieux</span>;
  if (row.winner === "animal") return <span className="text-zinc-800">Version végétale : {gap} · le plat animal fait mieux</span>;
  return <span className="text-zinc-800">Version végétale : {gap}</span>;
}

/** "ciqual-2025" → "Ciqual 2025", "agribalyse-3.2" → "Agribalyse 3.2". */
function sourceLabel(id: string): string {
  const [head, ...rest] = id.split("-");
  return [head.length <= 4 ? head.toUpperCase() : head[0].toUpperCase() + head.slice(1), ...rest].join(" ");
}

function Rows({ rows, sources, animalName, vegetalName }: { rows: CriterionRow[]; sources: Record<string, SourceRow>; animalName: string; vegetalName: string }) {
  return (
    <ul className="flex flex-col divide-y divide-zinc-200">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-col gap-1 py-3">
          <span className="font-medium" title={r.sourceName !== r.name ? r.sourceName : undefined}>
            {r.name}
          </span>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-zinc-700">{animalName}</dt>
              <dd>
                <Value v={r.animal} unit={r.unit} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-700">{vegetalName}</dt>
              <dd>
                <Value v={r.vegetal} unit={r.unit} />
              </dd>
            </div>
          </dl>
          <span className="text-sm">
            <Verdict row={r} />
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <SourceBadges ids={r.sourceIds} sources={sources} />
            {r.worstDqr != null && (
              <span className="text-xs text-zinc-700" title="Indice de qualité des données Agribalyse : 1 = très fiable, 5 = incertain">
                qualité des données (DQR) : {formatValue(r.worstDqr)} / 5
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2 rounded-xl border border-zinc-300 p-4">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Soon({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800">
      <strong>Bientôt.</strong> {children}
    </p>
  );
}

function Recipe({ dish, title }: { dish: DishView; title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-zinc-700">
        Pour {dish.servings} portions, environ {formatInt(dish.gramsPerServing)} g par portion
      </p>
      <ul className="list-disc pl-5 text-sm">
        {dish.ingredients.map((i) => (
          <li key={i.code}>
            {formatInt(i.grams)} g — {i.label}{" "}
            <span className="text-zinc-700" title={i.officialName ?? undefined}>
              (code {i.code})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
function VariantPanel({ model, v, basis }: { model: PairPageModel; v: VariantView; basis: Basis }) {
  const rows = v.rows[basis];
  const nutrition = rows.filter((r) => r.group === "nutrients");
  const climate = rows.filter((r) => r.group === "impacts");
  const animals = rows.filter((r) => r.group === "animalImpacts");
  const co2 = v.rows.perServing.find((r) => r.id === CLIMATE_MAIN);
  const anyRange = climate.some((r) => r.animal?.rangePublished || r.vegetal?.rangePublished);
  const a = model.animal.name;
  const p = v.dish.name;
  const baseLabel = BASES.find((b) => b.id === basis)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-lg">
          <strong>{p}</strong>
        </p>
        {v.dish.description && <p className="text-zinc-800">{v.dish.description}</p>}
        {v.rationale && (
          <p className="text-sm text-zinc-700">
            <strong>Pourquoi c’est comparable :</strong> {v.rationale}
          </p>
        )}
      </div>

      {v.keyCoverage != null && v.keyCoverage < COVERAGE_WARNING && (
        <p role="note" className="rounded-lg border border-amber-700 bg-amber-50 px-3 py-2 text-amber-900">
          Attention : l’énergie, les protéines ou les émissions ne sont connues que pour {formatPercent(v.keyCoverage * 100)} de la masse du
          plat. Les résultats sont à lire avec prudence.
        </p>
      )}
      {v.anyPartial && (
        <p role="note" className="rounded-lg border border-zinc-400 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
          Certains nutriments ne sont mesurés que pour une partie des ingrédients (sources incomplètes, jamais remplacées par 0). Pour
          ceux-là, l’écart est indicatif et nous ne donnons pas de verdict : la part de la masse couverte est indiquée sous chaque valeur.
        </p>
      )}

      {co2 && co2.animal?.value != null && co2.vegetal?.value != null && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-lg text-emerald-950">
          Par portion, la version végétale émet <strong>{formatValue(co2.vegetal.value)} kg CO₂e</strong> contre{" "}
          {formatValue(co2.animal.value)} kg pour le plat animal : <strong>{gapSentence(co2.reductionPercent)}</strong>.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card id={`nutrition-${v.variant}`} title="Nutrition">
          <p className="text-sm text-zinc-700">Valeurs {baseLabel}. « Mieux » suit les repères généraux de santé publique (plus de fibres, moins de sel et de graisses saturées) ; l’énergie et les sucres totaux ne sont pas jugés.</p>
          <Rows rows={nutrition} sources={model.sources} animalName={a} vegetalName="Version végétale" />
        </Card>

        <Card id={`climat-${v.variant}`} title="Climat et environnement">
          <p className="text-sm text-zinc-700">
            Valeurs {baseLabel}.{" "}
            {!anyRange && "Agribalyse ne publie pas de fourchette pour ces aliments : ce sont des valeurs centrales, avec leur indice de qualité (DQR)."}{" "}
            Certaines valeurs publiées sont négatives : <Link href="/methodologie#valeurs-negatives" className="underline">pourquoi</Link>.
          </p>
          <Rows rows={climate} sources={model.sources} animalName={a} vegetalName="Version végétale" />
        </Card>

        <Card id={`sante-${v.variant}`} title="Santé">
          <Soon>
            Les repères officiels (PNNS, classement du CIRC pour la viande rouge et transformée) et les estimations de minutes de vie en bonne
            santé seront ajoutés avec leurs sources.
          </Soon>
          <p className="text-sm text-zinc-700">Pas de conseil médical : parlez-en à un professionnel de santé.</p>
        </Card>

        <Card id={`animaux-${v.variant}`} title="Animaux">
          {animals.length > 0 && v.hasAnimalData ? (
            <Rows rows={animals} sources={model.sources} animalName={a} vegetalName="Version végétale" />
          ) : (
            <Soon>Le nombre d’animaux concernés par portion sera calculé à partir des statistiques FAO, avec la source de chaque facteur.</Soon>
          )}
        </Card>

        <Card id={`cout-${v.variant}`} title="Coût">
          <div className="flex flex-col gap-1">
            <h3 className="font-medium">Coût climat pour la collectivité ({v.climateCost.year}), par portion</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-zinc-700">{a}</dt>
                <dd className="font-semibold">{formatEur(v.climateCost.animalEur)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-700">Version végétale</dt>
                <dd className="font-semibold">{formatEur(v.climateCost.vegetalEur)}</dd>
              </div>
            </dl>
            <p className="text-xs text-zinc-700">
              Émissions par portion × valeur de l’action pour le climat ({formatEur(v.climateCost.eurPerKg)} par kg CO₂e en {v.climateCost.year}
              {v.climateCost.derived && ", calculée avec le taux de croissance publié par la source"}).
            </p>
            {v.climateCost.sourceId && <SourceBadges ids={[v.climateCost.sourceId]} sources={model.sources} />}
          </div>
          <Soon>Le prix en magasin (prix médians observés en France) sera ajouté quand assez d’observations seront disponibles.</Soon>
        </Card>
      </div>

      <section aria-labelledby={`mieux-${v.variant}`} className="flex flex-col gap-3 rounded-xl border-2 border-zinc-400 p-4">
        <h2 id={`mieux-${v.variant}`} className="text-xl font-semibold">
          Là où le plat animal fait mieux, et comment compenser
        </h2>
        {v.animalBetter.length === 0 ? (
          <p>Sur les critères affichés ici, le plat animal ne fait mieux sur aucun point.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {v.animalBetter.map((x) => (
              <li key={x.criterion} className="flex flex-col gap-1">
                <span className="font-medium">
                  {x.name}
                  {x.partial && <span className="font-normal text-zinc-700"> (d’après des données partielles)</span>}
                </span>
                {x.conseil ? (
                  <>
                    <span className="text-sm">
                      <strong>{x.conseil.titre}.</strong> {x.conseil.texte}
                    </span>
                    <span className="flex flex-wrap gap-1 text-xs">
                      {x.conseil.sources.map((s) => (
                        <a key={s.url} href={s.url} className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-zinc-800 underline" rel="noopener noreferrer">
                          {s.publisher}
                          {s.pages ? `, ${s.pages}` : ""}
                        </a>
                      ))}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-zinc-700">Pas encore de conseil sourcé pour ce point : nous y travaillons.</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-zinc-700">Informations générales, pas un conseil médical : parlez-en à un professionnel de santé.</p>
      </section>

      <section aria-labelledby={`action-${v.variant}`} className="flex flex-col gap-3 rounded-xl bg-emerald-50 p-4">
        <h2 id={`action-${v.variant}`} className="text-xl font-semibold text-emerald-950">
          Passer à l’action
        </h2>
        <p className="text-emerald-950">
          Pas besoin de tout changer d’un coup : essayer cette recette une fois cette semaine, c’est déjà un pas. Voici les quantités
          utilisées pour le calcul.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Recipe dish={v.dish} title={p} />
          <Recipe dish={model.animal} title={`${a} (pour comparaison)`} />
        </div>
        <p className="text-sm">
          <Link href="/" className="font-medium text-emerald-900 underline">
            Découvrir d’autres plats
          </Link>
        </p>
      </section>
    </div>
  );
}

export function CompareView({ model }: { model: PairPageModel }) {
  const available = (["maison", "commerce"] as Variant[]).filter((x) => model.variants[x]);
  const [variant, setVariant] = useState<Variant>(available[0] ?? "maison");
  const [basis, setBasis] = useState<Basis>("perServing");
  const v = model.variants[variant];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-300 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Alternative végétale</span>
          <Toggle label="Choisir l’alternative végétale" options={available.map((x) => ({ id: x, label: VARIANT_LABEL[x] }))} value={variant} onChange={setVariant} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Comparer</span>
          <Toggle label="Base de comparaison" options={BASES} value={basis} onChange={setBasis} />
        </div>
      </div>
      {v ? <VariantPanel model={model} v={v} basis={basis} /> : <p>Alternative indisponible.</p>}
    </div>
  );
}
