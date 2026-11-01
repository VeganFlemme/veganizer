import type { MetadataRoute } from "next";
import { listPairs } from "@/lib/compare/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veganizer.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pairs = await listPairs();
  const pages = ["", "/recette", "/methodologie", "/sources", "/a-propos", "/mentions-legales", "/confidentialite", "/conditions"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.5 })),
    ...pairs.map((p) => ({ url: `${siteUrl}/compare/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
