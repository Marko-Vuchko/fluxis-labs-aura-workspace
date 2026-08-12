import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

/**
 * Favicon in Deep Space Cyan - a glowing node mark, not a generic letter tile.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05070D",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background:
              "radial-gradient(circle at 35% 30%, #67E8F9 0%, #22D3EE 45%, #0891B2 100%)",
            boxShadow: "0 0 10px rgba(34,211,238,0.9)",
            border: "1px solid rgba(168,85,247,0.55)",
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
