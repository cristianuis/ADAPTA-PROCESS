import type { Database } from "@/lib/supabase/types";

type Actividad = Database["public"]["Tables"]["actividades"]["Row"];

export type LetraRaci = "R" | "A" | "C" | "I" | "";

export interface FilaRaci {
  actividad: string;
  orden: number;
  celdas: Record<string, LetraRaci>;
}

export interface MatrizRaci {
  roles: string[];
  filas: FilaRaci[];
}

/** Deriva la matriz RACI de las actividades — no se captura por separado, se calcula de los roles asignados. */
export function generarMatrizRaci(actividades: Actividad[]): MatrizRaci {
  const roles = new Set<string>();
  for (const a of actividades) {
    if (a.rol_responsable) roles.add(a.rol_responsable);
    if (a.rol_aprobador) roles.add(a.rol_aprobador);
    (a.roles_consultados ?? []).forEach((r) => roles.add(r));
    (a.roles_informados ?? []).forEach((r) => roles.add(r));
  }

  const rolesOrdenados = [...roles].sort();

  const filas: FilaRaci[] = [...actividades]
    .sort((a, b) => a.orden - b.orden)
    .map((a) => {
      const celdas: Record<string, LetraRaci> = {};
      for (const rol of rolesOrdenados) {
        if (rol === a.rol_responsable) celdas[rol] = "R";
        else if (rol === a.rol_aprobador) celdas[rol] = "A";
        else if ((a.roles_consultados ?? []).includes(rol)) celdas[rol] = "C";
        else if ((a.roles_informados ?? []).includes(rol)) celdas[rol] = "I";
        else celdas[rol] = "";
      }
      return { actividad: a.nombre, orden: a.orden, celdas };
    });

  return { roles: rolesOrdenados, filas };
}
