"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import type { Database } from "@/lib/supabase/types";

type Medicion = Database["public"]["Tables"]["mediciones"]["Row"];

export function TendenciaChart({ mediciones, meta }: { mediciones: Medicion[]; meta: number | null }) {
  const data = mediciones.map((m) => ({ periodo: m.periodo, valor: m.valor }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {meta !== null && <ReferenceLine y={meta} stroke="var(--secondary)" strokeDasharray="4 4" label={{ value: "Meta", fontSize: 10 }} />}
          <Line type="monotone" dataKey="valor" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
