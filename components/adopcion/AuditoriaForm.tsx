"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearAuditoria } from "@/lib/actions/auditorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/types";

type Proceso = Database["public"]["Tables"]["procesos"]["Row"];

export function AuditoriaForm({ proyectoId, procesos }: { proyectoId: string; procesos: Proceso[] }) {
  const [isPending, startTransition] = useTransition();
  const [procesoId, setProcesoId] = useState(procesos[0]?.id ?? "");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [casosRevisados, setCasosRevisados] = useState("");
  const [casosConformes, setCasosConformes] = useState("");
  const [desviaciones, setDesviaciones] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearAuditoria({
        proyectoId,
        procesoId,
        fecha,
        casosRevisados: Number(casosRevisados),
        casosConformes: Number(casosConformes),
        desviaciones: desviaciones
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean),
      });
      if (result?.error) toast.error(result.error);
    });
  }

  if (procesos.length === 0) {
    return (
      <p className="max-w-md rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
        Necesitas al menos un proceso diseñado (con actividades) antes de auditar su adopción.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Proceso auditado</Label>
        <Select value={procesoId} onValueChange={(v) => setProcesoId(v ?? "")}>
          <SelectTrigger>
            <SelectValue>{() => procesos.find((p) => p.id === procesoId)?.nombre}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {procesos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="casosRevisados">Casos revisados</Label>
          <Input
            id="casosRevisados"
            type="number"
            min={1}
            value={casosRevisados}
            onChange={(e) => setCasosRevisados(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="casosConformes">Casos conformes</Label>
          <Input
            id="casosConformes"
            type="number"
            min={0}
            value={casosConformes}
            onChange={(e) => setCasosConformes(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="desviaciones">Desviaciones observadas (una por línea)</Label>
        <Textarea id="desviaciones" rows={4} value={desviaciones} onChange={(e) => setDesviaciones(e.target.value)} />
      </div>
      <Button type="submit" disabled={isPending || !casosRevisados} className="self-start">
        Guardar auditoría
      </Button>
    </form>
  );
}
