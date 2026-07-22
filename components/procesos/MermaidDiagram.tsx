"use client";

import { useEffect, useRef, useState } from "react";

export function MermaidDiagram({ definicion }: { definicion: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        // Bloque B.5 — tema "base" con las variables de color de la app en vez del
        // tema "neutral" genérico de Mermaid, para que el diagrama se sienta parte
        // de ADAPTA OS y no un elemento ajeno insertado en la pantalla.
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "var(--primary)",
            primaryTextColor: "var(--primary-foreground)",
            primaryBorderColor: "var(--primary)",
            lineColor: "var(--border)",
            secondaryColor: "var(--secondary)",
            secondaryTextColor: "var(--secondary-foreground)",
            tertiaryColor: "var(--muted)",
            tertiaryTextColor: "var(--foreground)",
            fontFamily: "inherit",
          },
        });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, definicion);
        if (!cancelado && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch {
        if (!cancelado) setError("No se pudo renderizar el diagrama.");
      }
    }

    render();
    return () => {
      cancelado = true;
    };
  }, [definicion]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return <div ref={ref} className="overflow-x-auto rounded-md border border-border bg-card p-4" />;
}
