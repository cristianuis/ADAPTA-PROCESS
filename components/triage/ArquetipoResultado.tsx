import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Arquetipo } from "@/lib/supabase/types";

interface ArquetipoResultadoProps {
  proyectoId: string;
  arquetipo: Arquetipo;
  puntajeTotal: number;
  alertaGobierno: boolean;
}

export function ArquetipoResultado({
  proyectoId,
  arquetipo,
  puntajeTotal,
  alertaGobierno,
}: ArquetipoResultadoProps) {
  const info = ARQUETIPO_INFO[arquetipo];

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {alertaGobierno && (
        <div className="flex items-start gap-3 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Alerta de gobierno societario</p>
            <p className="mt-1">
              La respuesta a la pregunta 6 indica que la estructura de decisión es difusa o hay
              conflicto de autoridad. Es posible que el problema real no sea de procesos sino de
              gobierno corporativo — vale la pena explorarlo con el cliente antes de avanzar con
              la ruta de intervención.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{info.titulo}</CardTitle>
          <Badge className="bg-primary text-primary-foreground">Puntaje: {puntajeTotal}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">{info.descripcion}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          render={<Link href={`/proyectos/${proyectoId}/triage`}>Rehacer triage</Link>}
        />
        <Button render={<Link href={`/proyectos/${proyectoId}`}>Volver al proyecto</Link>} />
      </div>
    </div>
  );
}
