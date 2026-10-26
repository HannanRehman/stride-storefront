import { ImageResponse } from "next/og";
export const alt = "Stride — original sportswear storefront";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fff",
        width: "100%",
        height: "100%",
        padding: "64px",
        color: "#111",
      }}
    >
      <div style={{ fontSize: 42, fontWeight: 700, display: "flex" }}>
        stride.
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 94,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -5,
        }}
      >
        <span>Find your</span>
        <span>next gear.</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 25,
          color: "#616165",
          borderTop: "1px solid #e5e5e5",
          paddingTop: 24,
        }}
      >
        <span>Keep moving. Stay you.</span>
        <span>Original sportswear concepts</span>
      </div>
    </div>,
    size,
  );
}
