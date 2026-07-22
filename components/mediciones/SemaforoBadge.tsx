import { CircleCheckIcon, TriangleAlertIcon, OctagonXIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TYPE_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import type { Semaforo } from "@/lib/adopcion/calcular-adopcion";

// Bloque B.1 — color solo no basta (rojo/verde puro es el error de accesibilidad
// más común); cada estado lleva también un ícono y una etiqueta de texto distinta.
const SEMAFORO_CONFIG: Record<Semaforo, { clase: string; Icon: typeof CircleCheckIcon; label: string }> = {
  verde: { clase: "bg-success/20 text-success", Icon: CircleCheckIcon, label: "En meta" },
  amarillo: { clase: "bg-secondary/40 text-foreground", Icon: TriangleAlertIcon, label: "Cerca de la meta" },
  rojo: { clase: "bg-destructive/20 text-destructive", Icon: OctagonXIcon, label: "Fuera de meta" },
};

export function SemaforoBadge({ estado }: { estado: Semaforo }) {
  const { clase, Icon, label } = SEMAFORO_CONFIG[estado];
  return (
    <Badge className={cn(clase, "gap-1")}>
      <Icon className="size-3.5" />
      <span className={cn(TYPE_SCALE.meta, clase)}>{label}</span>
    </Badge>
  );
}
