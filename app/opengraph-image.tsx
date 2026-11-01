import { ImageResponse } from "next/og";
import { ShareImage } from "@/components/ui/ShareImage";

export const alt = "Veganizer — ton plat face à sa version végétale, données à l’appui";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <ShareImage title="Ton plat face à sa version végétale, données à l’appui." footer="Ciqual, Agribalyse, FAOSTAT, CIRC, France Stratégie : chaque chiffre sourcé." />,
    size,
  );
}
