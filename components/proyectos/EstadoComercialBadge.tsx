import { Badge } from "@/components/ui/badge";
import type { EstadoComercial } from "@/lib/supabase/types";

export const ESTADO_COMERCIAL_LABEL: Record<EstadoComercial, string> = {
  prospecto: "Prospecto",
  contratado: "Contratado",
  pausado: "Pausado",
  cerrado: "Cerrado",
};

const ESTADO_COMERCIAL_CLASS: Record<EstadoComercial, string> = {
  prospecto: "bg-muted text-muted-foreground",
  contratado: "bg-success/20 text-success",
  pausado: "bg-secondary/50 text-foreground",
  cerrado: "bg-foreground/10 text-foreground",
};

export const ESTADOS_COMERCIALES: EstadoComercial[] = [
  "prospecto",
  "contratado",
  "pausado",
  "cerrado",
];

export function EstadoComercialBadge({
  estado,
}: {
  estado: EstadoComercial;
}) {
  return (
    <Badge className={ESTADO_COMERCIAL_CLASS[estado]}>
      {ESTADO_COMERCIAL_LABEL[estado]}
    </Badge>
  );
}
