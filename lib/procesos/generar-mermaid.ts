import type { Database } from "@/lib/supabase/types";

type Actividad = Database["public"]["Tables"]["actividades"]["Row"];

function sanitizarId(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9]/g, "_") || "sin_rol";
}

function escaparTexto(texto: string): string {
  return texto.replace(/"/g, "'");
}

/** Genera un flowchart Mermaid con subgraphs por rol responsable, en el orden de las actividades. */
export function generarDiagramaMermaid(nombreProceso: string, actividades: Actividad[]): string {
  if (actividades.length === 0) {
    return `flowchart LR\n  vacio["${escaparTexto(nombreProceso)}: sin actividades registradas"]`;
  }

  const ordenadas = [...actividades].sort((a, b) => a.orden - b.orden);
  const roles = [...new Set(ordenadas.map((a) => a.rol_responsable || "Sin rol asignado"))];

  const lineas: string[] = ["flowchart TD"];

  for (const rol of roles) {
    const idRol = sanitizarId(rol);
    lineas.push(`  subgraph ${idRol}["${escaparTexto(rol)}"]`);
    for (const act of ordenadas.filter((a) => (a.rol_responsable || "Sin rol asignado") === rol)) {
      const idNodo = `act_${act.id.replace(/-/g, "").slice(0, 8)}`;
      const forma = act.es_valor_agregado ? `["${escaparTexto(act.nombre)}"]` : `("${escaparTexto(act.nombre)}")`;
      lineas.push(`    ${idNodo}${forma}`);
    }
    lineas.push("  end");
  }

  for (let i = 0; i < ordenadas.length - 1; i++) {
    const desde = `act_${ordenadas[i].id.replace(/-/g, "").slice(0, 8)}`;
    const hasta = `act_${ordenadas[i + 1].id.replace(/-/g, "").slice(0, 8)}`;
    lineas.push(`  ${desde} --> ${hasta}`);
  }

  return lineas.join("\n");
}
