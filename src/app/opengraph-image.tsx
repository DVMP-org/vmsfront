import { ImageResponse } from "next/og";
import { marketingSiteUrl } from "@/components/marketing/seo";

export const alt = "VMS Core property operations platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "68px 76px",
        color: "#182126",
        background: "#f3f3ee",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ed704f",
            color: "white",
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          V
        </div>
        <div style={{ display: "flex", gap: 6, fontSize: 25, fontWeight: 700 }}>
          VMS <span style={{ fontWeight: 400 }}>Core</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
        <div
          style={{
            color: "#a6533b",
            fontSize: 18,
            letterSpacing: 4,
            fontWeight: 700,
          }}
        >
          PROPERTY OPERATIONS PLATFORM · NIGERIA
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 68,
            lineHeight: 1.02,
            letterSpacing: -3,
            fontWeight: 700,
          }}
        >
          One platform for your properties, people and operations.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#59645e",
          fontSize: 17,
        }}
      >
        <span>Sites · People · Access · Charges · Maintenance</span>
        <span>{new URL(marketingSiteUrl).host}</span>
      </div>
    </div>,
    { ...size },
  );
}
