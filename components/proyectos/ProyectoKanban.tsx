"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { actualizarEstadoProyecto } from "@/lib/actions/proyectos";
import { FASES_ORDEN, FASE_LABEL } from "@/components/proyectos/FaseBadge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EstadoProyecto } from "@/lib/supabase/types";

interface ProyectoConCliente {
  id: string;
  nombre: string;
  estado: EstadoProyecto;
  arquetipo: string | null;
  clientes: { razon_social: string } | null;
}

export function ProyectoKanban({ proyectos }: { proyectos: ProyectoConCliente[] }) {
  const [isPending, startTransition] = useTransition();

  function handleCambioEstado(proyectoId: string, estado: EstadoProyecto) {
    startTransition(async () => {
      const result = await actualizarEstadoProyecto(proyectoId, estado);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {FASES_ORDEN.map((fase) => {
        const proyectosDeFase = proyectos.filter((p) => p.estado === fase);
        return (
          <div key={fase} className="flex w-64 shrink-0 flex-col gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {FASE_LABEL[fase]} ({proyectosDeFase.length})
            </h3>
            <div className="flex flex-col gap-2">
              {proyectosDeFase.map((proyecto) => (
                <Card key={proyecto.id} className="p-3">
                  <Link href={`/proyectos/${proyecto.id}`} className="text-sm font-medium hover:underline">
                    {proyecto.nombre}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {proyecto.clientes?.razon_social ?? "—"}
                  </p>
                  {proyecto.arquetipo && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      Arquetipo {proyecto.arquetipo}
                    </p>
                  )}
                  <Select
                    disabled={isPending}
                    value={proyecto.estado}
                    onValueChange={(value) =>
                      handleCambioEstado(proyecto.id, value as EstadoProyecto)
                    }
                  >
                    <SelectTrigger className="mt-2 h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FASES_ORDEN.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FASE_LABEL[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
