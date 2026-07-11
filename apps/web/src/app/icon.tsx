import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#11110f",
        color: "#d7ad67",
        fontSize: 180,
        fontWeight: 700,
        letterSpacing: -18,
        border: "24px solid #d7ad67",
        borderRadius: 112,
        paddingRight: 18,
      }}
    >
      AE
    </div>,
    size,
  );
}
