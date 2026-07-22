"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { TYPE_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Medicion = Database["public"]["Tables"]["mediciones"]["Row"];

export function TendenciaChart({ mediciones, meta }: { mediciones: Medicion[]; meta: number | null }) {
  const data = mediciones.map((m) => ({ periodo: m.periodo, valor: m.valor }));
  const ultimoIndice = data.length - 1;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="periodo" tick={{ className: TYPE_SCALE.meta }} />
          <YAxis tick={{ className: TYPE_SCALE.meta }} />
          {/* Bloque B.4 — mismo patrón de tooltip que la matriz de priorización, no el default de recharts. */}
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-md border border-border bg-popover p-2 shadow-md">
                  <p className={cn(TYPE_SCALE.body, "font-medium")}>{label}</p>
                  <p className={TYPE_SCALE.meta}>Valor: {payload[0].value}</p>
                </div>
              );
            }}
          />
          {meta !== null && (
            <ReferenceLine
              y={meta}
              stroke="var(--secondary)"
              strokeDasharray="4 4"
              label={{ value: "Meta", position: "insideTopRight", className: TYPE_SCALE.meta }}
            />
          )}
          <Line
            type="monotone"
            dataKey="valor"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, index, key } = props;
              const esUltimo = index === ultimoIndice;
              return (
                <circle
                  key={key}
                  cx={cx}
                  cy={cy}
                  r={esUltimo ? 5 : 3}
                  fill={esUltimo ? "var(--secondary)" : "var(--primary)"}
                  stroke={esUltimo ? "var(--primary)" : "none"}
                  strokeWidth={esUltimo ? 1.5 : 0}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
