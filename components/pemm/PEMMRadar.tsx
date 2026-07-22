"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { DIMENSION_LABEL, type Dimension } from "@/lib/pemm/descriptores";

interface PEMMRadarProps {
  dimensiones: Dimension[];
  valores: Partial<Record<Dimension, number | null>>;
  benchmark?: Partial<Record<Dimension, number | null>>;
}

export function PEMMRadar({ dimensiones, valores, benchmark }: PEMMRadarProps) {
  const data = dimensiones.map((dim) => ({
    dimension: DIMENSION_LABEL[dim],
    valor: valores[dim] ?? 0,
    benchmark: benchmark?.[dim] ?? undefined,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 4]} tickCount={5} tick={{ fontSize: 10 }} />
          <Radar
            name="Nivel actual"
            dataKey="valor"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.35}
          />
          {benchmark && (
            <Radar
              name="Benchmark sectorial"
              dataKey="benchmark"
              stroke="var(--secondary)"
              fill="var(--secondary)"
              fillOpacity={0.15}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
