import { Badge } from "@/components/ui/badge";
import type { EstadoProyecto } from "@/lib/supabase/types";

const FASE_LABEL: Record<EstadoProyecto, string> = {
  prospecto: "Prospecto",
  // Etiqueta visible "Avalúo" (Bloque 2, decisión del usuario) — mismo vocabulario que
  // usan los documentos de metodología e informes generados. El valor en base de datos
  // sigue siendo "diagnostico"; esto es solo el texto que se muestra.
  diagnostico: "Avalúo",
  definicion: "Definición",
  arquitectura: "Arquitectura",
  pilotaje: "Pilotaje",
  transferencia: "Transferencia",
  anclaje: "Anclaje",
  cerrado: "Cerrado",
};

const FASE_CLASS: Record<EstadoProyecto, string> = {
  prospecto: "bg-muted text-muted-foreground",
  diagnostico: "bg-secondary/30 text-foreground",
  definicion: "bg-secondary/50 text-foreground",
  arquitectura: "bg-primary/15 text-primary",
  pilotaje: "bg-primary/30 text-primary",
  transferencia: "bg-primary/50 text-primary-foreground",
  anclaje: "bg-success/20 text-success",
  cerrado: "bg-foreground/10 text-foreground",
};

export function FaseBadge({ estado }: { estado: EstadoProyecto }) {
  return <Badge className={FASE_CLASS[estado]}>{FASE_LABEL[estado]}</Badge>;
}

export const FASES_ORDEN: EstadoProyecto[] = [
  "prospecto",
  "diagnostico",
  "definicion",
  "arquitectura",
  "pilotaje",
  "transferencia",
  "anclaje",
  "cerrado",
];

export { FASE_LABEL };
