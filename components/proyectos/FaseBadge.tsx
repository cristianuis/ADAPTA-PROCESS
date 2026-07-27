import { Badge } from "@/components/ui/badge";
import type { FaseMetodologica } from "@/lib/supabase/types";

export const FASE_LABEL: Record<FaseMetodologica, string> = {
  contextualizacion: "Contextualización",
  definicion: "Definición",
  arquitectura: "Arquitectura",
  pilotaje: "Pilotaje",
  transferencia: "Transferencia",
  anclaje: "Anclaje",
};

const FASE_CLASS: Record<FaseMetodologica, string> = {
  contextualizacion: "bg-secondary/30 text-foreground",
  definicion: "bg-secondary/50 text-foreground",
  arquitectura: "bg-primary/15 text-primary",
  pilotaje: "bg-primary/30 text-primary",
  transferencia: "bg-primary/50 text-primary-foreground",
  anclaje: "bg-success/20 text-success",
};

export const FASES_ORDEN: FaseMetodologica[] = [
  "contextualizacion",
  "definicion",
  "arquitectura",
  "pilotaje",
  "transferencia",
  "anclaje",
];

export function FaseBadge({ fase }: { fase: FaseMetodologica }) {
  return <Badge className={FASE_CLASS[fase]}>{FASE_LABEL[fase]}</Badge>;
}
