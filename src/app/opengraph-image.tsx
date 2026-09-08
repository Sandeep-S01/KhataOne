import { ImageResponse } from "next/og";

export const alt =
  "KhataOne turns WhatsApp client documents into CA-reviewed accounting records.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#F7F5EF",
          color: "#1F2A24",
          padding: 64,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid #D8D2C4",
            borderRadius: 28,
            background: "#FFFFFF",
            padding: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 58,
                height: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                background: "#146B43",
                color: "#FFFFFF",
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              K
            </div>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
              <span>Khata</span>
              <span style={{ color: "#146B43" }}>One</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div
              style={{
                color: "#146B43",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              WhatsApp-first GST workflow for CA firms
            </div>
            <div
              style={{
                maxWidth: 880,
                fontSize: 66,
                lineHeight: 1.05,
                fontWeight: 700,
              }}
            >
              Client documents become CA-reviewed accounting records.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 18,
              color: "#5F6B63",
              fontSize: 24,
            }}
          >
            <span>WhatsApp intake</span>
            <span style={{ color: "#D98A1F" }}>|</span>
            <span>AI draft extraction</span>
            <span style={{ color: "#D98A1F" }}>|</span>
            <span>Human approval</span>
            <span style={{ color: "#D98A1F" }}>|</span>
            <span>GST summaries</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
