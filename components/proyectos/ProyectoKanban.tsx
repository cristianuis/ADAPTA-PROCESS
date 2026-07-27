"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { actualizarEstadoComercial } from "@/lib/actions/proyectos";
import { FASES_ORDEN, FASE_LABEL } from "@/components/proyectos/FaseBadge";
import {
  ESTADOS_COMERCIALES,
  ESTADO_COMERCIAL_LABEL,
} from "@/components/proyectos/EstadoComercialBadge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  EstadoComercial,
  FaseMetodologica,
} from "@/lib/supabase/types";

interface ProyectoConCliente {
  id: string;
  nombre: string;
  estado_comercial: EstadoComercial;
  fase_metodologica: FaseMetodologica;
  arquetipo: string | null;
  clientes: { razon_social: string } | null;
}

export function ProyectoKanban({ proyectos }: { proyectos: ProyectoConCliente[] }) {
  const [isPending, startTransition] = useTransition();

  function handleCambioEstado(proyectoId: string, estado: EstadoComercial) {
    startTransition(async () => {
      const result = await actualizarEstadoComercial(proyectoId, estado);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {FASES_ORDEN.map((fase) => {
        const proyectosDeFase = proyectos.filter(
          (proyecto) => proyecto.fase_metodologica === fase
        );
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
                    value={proyecto.estado_comercial}
                    onValueChange={(value) =>
                      handleCambioEstado(proyecto.id, value as EstadoComercial)
                    }
                  >
                    <SelectTrigger
                      aria-label={`Estado comercial de ${proyecto.nombre}`}
                      className="mt-2 h-8 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_COMERCIALES.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {ESTADO_COMERCIAL_LABEL[estado]}
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
