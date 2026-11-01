import type { MetadataRoute } from "next";
import { listAutoCards } from "@/lib/compare/auto-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veganizer.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cards = await listAutoCards();
  const pages = ["", "/recette", "/methodologie", "/sources", "/a-propos", "/mentions-legales", "/confidentialite", "/conditions"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.5 })),
    ...cards.map((c) => ({ url: `${siteUrl}${c.href}`, changeFrequency: "monthly" as const, priority: c.kind === "paire" ? 0.8 : 0.6 })),
  ];
}
