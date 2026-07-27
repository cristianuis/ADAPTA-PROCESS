import { ImageResponse } from "next/og";

export const alt =
  "Cristian Alfonso — Consultoría de procesos y herramientas digitales";
export const size = { width: 1200, height: 630 };
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
          background: "#173c2a",
          color: "#ffffff",
          padding: "64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 58,
              height: 58,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: "#dce95f",
              color: "#173c2a",
              fontWeight: 700,
            }}
          >
            CA
          </div>
          <span>Cristian Alfonso</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <p
            style={{
              margin: 0,
              maxWidth: 980,
              fontSize: 76,
              lineHeight: 0.98,
              letterSpacing: "-4px",
              fontWeight: 700,
            }}
          >
            Procesos que funcionan cuando nadie está mirando.
          </p>
          <p
            style={{
              margin: "30px 0 0",
              fontSize: 24,
              color: "#bfd0c5",
            }}
          >
            Consultoría de procesos + herramientas digitales
          </p>
        </div>
      </div>
    ),
    size
  );
}
