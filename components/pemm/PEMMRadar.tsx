"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DIMENSION_LABEL, DESCRIPTORES, type Dimension } from "@/lib/pemm/descriptores";
import { TYPE_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

interface PEMMRadarProps {
  dimensiones: Dimension[];
  valores: Partial<Record<Dimension, number | null>>;
  benchmark?: Partial<Record<Dimension, number | null>>;
}

interface PuntoRadar {
  dimensionKey: Dimension;
  dimension: string;
  valor: number;
  benchmark?: number;
}

export function PEMMRadar({ dimensiones, valores, benchmark }: PEMMRadarProps) {
  const data: PuntoRadar[] = dimensiones.map((dim) => ({
    dimensionKey: dim,
    dimension: DIMENSION_LABEL[dim],
    valor: valores[dim] ?? 0,
    benchmark: benchmark?.[dim] ?? undefined,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="dimension" tick={{ className: TYPE_SCALE.meta }} />
          <PolarRadiusAxis angle={90} domain={[0, 4]} tickCount={5} tick={{ className: TYPE_SCALE.meta }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const punto = payload[0].payload as PuntoRadar;
              const descriptor =
                punto.valor >= 1 && punto.valor <= 4 ? DESCRIPTORES[punto.dimensionKey][punto.valor - 1] : null;
              return (
                <div className="max-w-64 rounded-md border border-border bg-popover p-2 shadow-md">
                  <p className={cn(TYPE_SCALE.body, "font-medium")}>
                    {punto.dimension} — Nivel {punto.valor}
                  </p>
                  {descriptor && <p className={cn(TYPE_SCALE.meta, "mt-1")}>{descriptor}</p>}
                  {typeof punto.benchmark === "number" && (
                    <p className={cn(TYPE_SCALE.meta, "mt-1")}>Benchmark sectorial: {punto.benchmark}</p>
                  )}
                </div>
              );
            }}
          />
          <Radar
            name="Nivel actual"
            dataKey="valor"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.35}
          />
          {benchmark && (
            <>
              <Radar
                name="Benchmark sectorial"
                dataKey="benchmark"
                stroke="var(--secondary)"
                fill="var(--secondary)"
                fillOpacity={0.15}
              />
              <Legend
                content={({ payload }) => (
                  <div className="mt-2 flex flex-wrap justify-center gap-3">
                    {payload?.map((entry) => (
                      <span key={entry.value} className={cn(TYPE_SCALE.meta, "flex items-center gap-1.5")}>
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.value}
                      </span>
                    ))}
                  </div>
                )}
              />
            </>
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
