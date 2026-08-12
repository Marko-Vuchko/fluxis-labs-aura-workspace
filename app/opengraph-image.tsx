import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/site-config";

export const alt = `${SITE_NAME} - ${SITE_TAGLINE}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "radial-gradient(circle at 18% 20%, rgba(34,211,238,0.22), transparent 42%), radial-gradient(circle at 82% 78%, rgba(168,85,247,0.2), transparent 40%), #05070D",
          color: "#E8EDF5",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "#22D3EE",
              boxShadow: "0 0 24px rgba(34,211,238,0.85)",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#22D3EE",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            Fluxis Labs
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 34,
              color: "#8B95A8",
              maxWidth: 860,
              lineHeight: 1.3,
            }}
          >
            {SITE_TAGLINE}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(34,211,238,0.28)",
            paddingTop: 28,
            fontSize: 22,
            color: "#A855F7",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <span>Monte Carlo · WebGL · FastAPI</span>
          <span style={{ color: "#22D3EE" }}>1000 × 12</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
