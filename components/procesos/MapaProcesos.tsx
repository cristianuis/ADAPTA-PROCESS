import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import type { TipoProceso } from "@/lib/supabase/types";

type Proceso = Database["public"]["Tables"]["procesos"]["Row"];

const GRUPOS: { tipo: TipoProceso; titulo: string; clase: string }[] = [
  { tipo: "estrategico", titulo: "Procesos estratégicos", clase: "bg-primary/10 border-primary/30" },
  { tipo: "misional", titulo: "Procesos misionales", clase: "bg-secondary/20 border-secondary/40" },
  { tipo: "apoyo", titulo: "Procesos de apoyo", clase: "bg-muted border-border" },
];

export function MapaProcesos({ procesos, proyectoId }: { procesos: Proceso[]; proyectoId: string }) {
  return (
    <div className="flex flex-col gap-4">
      {GRUPOS.map(({ tipo, titulo, clase }) => {
        const delGrupo = procesos.filter((p) => p.tipo === tipo);
        return (
          <div key={tipo} className={`rounded-lg border p-4 ${clase}`}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h3>
            {delGrupo.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin procesos clasificados aquí todavía.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {delGrupo.map((p) => (
                  <Link
                    key={p.id}
                    href={`/proyectos/${proyectoId}/procesos/${p.id}`}
                    className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:border-primary"
                  >
                    {p.codigo ? <span className="mr-1.5 font-mono text-xs text-muted-foreground">{p.codigo}</span> : null}
                    {p.nombre}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
