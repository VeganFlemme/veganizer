import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import "./globals.css";

// Single family (docs/DESIGN.md § 2), self-hosted by next/font, fallback system-ui.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veganizer.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Veganizer — ton plat face à sa version végétale", template: "%s — Veganizer" },
  description:
    "Compare un plat avec produits animaux et sa version végétale : nutrition, santé, environnement, protection animale et économie, chaque chiffre sourcé.",
  openGraph: { siteName: "Veganizer", locale: "fr_FR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0F2724" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${schibsted.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ground text-ink">
        <SiteHeader />
        <div id="contenu" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
