"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Database } from "@/lib/supabase/types";

type Hallazgo = Database["public"]["Tables"]["hallazgos"]["Row"];

function cuadrante(impacto: number, esfuerzo: number): string {
  const altoImpacto = impacto >= 3;
  const altoEsfuerzo = esfuerzo >= 3;
  if (altoImpacto && !altoEsfuerzo) return "Victoria rápida";
  if (altoImpacto && altoEsfuerzo) return "Proyecto mayor";
  if (!altoImpacto && !altoEsfuerzo) return "Relleno";
  return "Ingrato";
}

const CUADRANTE_COLOR: Record<string, string> = {
  "Victoria rápida": "var(--success)",
  "Proyecto mayor": "var(--primary)",
  Relleno: "var(--muted-foreground)",
  Ingrato: "var(--destructive)",
};

export function MatrizPriorizacion({ hallazgos }: { hallazgos: Hallazgo[] }) {
  const data = hallazgos.map((h) => ({
    x: h.esfuerzo,
    y: h.impacto,
    titulo: h.titulo,
    cuadrante: cuadrante(h.impacto, h.esfuerzo),
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(CUADRANTE_COLOR).map(([nombre, color]) => (
          <span key={nombre} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            {nombre}
          </span>
        ))}
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Esfuerzo"
              domain={[0, 6]}
              ticks={[1, 2, 3, 4, 5]}
              label={{ value: "Esfuerzo", position: "insideBottom", offset: -5, fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Impacto"
              domain={[0, 6]}
              ticks={[1, 2, 3, 4, 5]}
              label={{ value: "Impacto", angle: -90, position: "insideLeft", fontSize: 12 }}
            />
            <ReferenceLine x={3} stroke="var(--border)" />
            <ReferenceLine y={3} stroke="var(--border)" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="rounded-md border border-border bg-popover p-2 text-xs shadow-md">
                    <p className="font-medium">{p.titulo}</p>
                    <p className="text-muted-foreground">
                      {p.cuadrante} — Impacto {p.y}, Esfuerzo {p.x}
                    </p>
                  </div>
                );
              }}
            />
            <Scatter data={data}>
              {data.map((entry, index) => (
                <Cell key={index} fill={CUADRANTE_COLOR[entry.cuadrante]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
