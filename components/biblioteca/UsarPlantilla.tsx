"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { aplicarPlantilla } from "@/lib/actions/plantillas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/supabase/types";

type Plantilla = Database["public"]["Tables"]["plantillas_proceso"]["Row"];

export function UsarPlantilla({ proyectoId, plantillas }: { proyectoId: string; plantillas: Plantilla[] }) {
  const [isPending, startTransition] = useTransition();
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [nombreProceso, setNombreProceso] = useState("");

  if (plantillas.length === 0) return null;

  function aplicar(plantillaId: string) {
    if (!nombreProceso.trim()) {
      toast.error("Escribe el nombre del proceso nuevo.");
      return;
    }
    startTransition(async () => {
      const result = await aplicarPlantilla({ plantillaId, proyectoId, nombreProceso });
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Card className="max-w-xl border-secondary/40 bg-secondary/10">
      <CardHeader>
        <CardTitle className="text-base">Usar una plantilla de tu biblioteca</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          placeholder="Nombre del proceso nuevo"
          value={nombreProceso}
          onChange={(e) => setNombreProceso(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          {plantillas.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm">
              <div>
                <span className="font-medium">{p.nombre}</span>
                {p.sector && <span className="ml-2 text-xs text-muted-foreground">{p.sector}</span>}
                <span className="ml-2 text-xs text-muted-foreground">usada {p.veces_usada}x</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setSeleccionada(p.id);
                  aplicar(p.id);
                }}
              >
                {isPending && seleccionada === p.id ? "Aplicando..." : "Usar esta"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
