"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DIMENSION_LABEL, type Dimension } from "@/lib/pemm/descriptores";
import { TYPE_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import type { ComparativaPemm } from "@/lib/actions/pemm";

export function ComparativaPercepcion({ datos }: { datos: ComparativaPemm[] }) {
  const chartData = datos.map((fila) => ({
    dimension: DIMENSION_LABEL[fila.dimension as Dimension] ?? fila.dimension,
    Dirección: fila.direccion,
    "Mando medio": fila.mando_medio,
    Operación: fila.operacion,
  }));

  const brechaMaxima = datos.reduce<{ dimension: string; brecha: number } | null>((max, fila) => {
    const valores = [fila.direccion, fila.operacion].filter((v): v is number => typeof v === "number");
    if (valores.length < 2) return max;
    const brecha = Math.abs(valores[0] - valores[1]);
    if (!max || brecha > max.brecha) return { dimension: DIMENSION_LABEL[fila.dimension as Dimension], brecha };
    return max;
  }, null);

  return (
    <div className="flex flex-col gap-3">
      {brechaMaxima && brechaMaxima.brecha > 0 && (
        <div className="rounded-md border border-secondary bg-secondary/20 px-4 py-3 text-sm">
          <span className="font-medium">Mayor brecha de percepción:</span> &quot;{brechaMaxima.dimension}&quot; —
          diferencia de {brechaMaxima.brecha} nivel(es) entre dirección y operación. Esta discrepancia es en sí
          misma un hallazgo a explorar con el cliente.
        </div>
      )}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="dimension" tick={{ className: TYPE_SCALE.meta }} />
            <YAxis domain={[0, 4]} tickCount={5} tick={{ className: TYPE_SCALE.meta }} />
            {/* Bloque B.4 — mismo patrón de tooltip que la matriz de priorización, no el default de recharts. */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-md border border-border bg-popover p-2 shadow-md">
                    <p className={cn(TYPE_SCALE.body, "font-medium")}>{label}</p>
                    {payload.map((entry, i) => (
                      <p key={i} className={TYPE_SCALE.meta} style={{ color: entry.color }}>
                        {entry.name}: {entry.value ?? "—"}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
            <Bar dataKey="Dirección" fill="var(--primary)" />
            <Bar dataKey="Mando medio" fill="var(--chart-3)" />
            <Bar dataKey="Operación" fill="var(--secondary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
