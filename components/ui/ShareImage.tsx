// Share image layout (1200 × 630), rendered by next/og. Inline styles only (Satori).
import { LOGO_PATHS } from "./Logo";

const INK = "#0F2724";

export function ShareImage({ title, plant, headline, caption, footer }: { title: string; plant?: string; headline?: string; caption?: string; footer: string }) {
  const dot = (color: string) => <div style={{ width: 22, height: 22, borderRadius: 999, background: color, flexShrink: 0 }} />;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: INK, color: "#FFFFFF" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="56" height="56" viewBox="0 0 28 28">
          <path d={LOGO_PATHS.animal} fill="#D9662B" />
          <path d={LOGO_PATHS.plant} fill="#0E8A74" />
        </svg>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em" }}>veganizer</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: title.length > 40 ? 56 : 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
          {plant ? dot("#D9662B") : null}
          <div style={{ display: "flex" }}>{title}</div>
        </div>
        {plant && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 700, color: "#DCEBE5" }}>
            {dot("#3FC1A3")}
            <div style={{ display: "flex" }}>{plant}</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
        {headline ? (
          <div style={{ display: "flex", flexDirection: "column", background: "#FFFFFF", color: INK, borderRadius: 22, padding: "20px 28px" }}>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>{headline}</div>
            {caption && <div style={{ display: "flex", fontSize: 24, color: "#3E5550", marginTop: 6 }}>{caption}</div>}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}
        <div style={{ display: "flex", fontSize: 24, color: "#B9D9CF", maxWidth: 560, textAlign: "right" }}>{footer}</div>
      </div>
    </div>
  );
}
