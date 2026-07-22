"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { procesoSchema, type ProcesoInput } from "@/lib/validations/proceso.schema";
import { crearProceso } from "@/lib/actions/procesos";
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
import type { TipoProceso } from "@/lib/supabase/types";

const TIPO_LABEL: Record<TipoProceso, string> = {
  estrategico: "Estratégico",
  misional: "Misional",
  apoyo: "Apoyo",
};

export function ProcesoForm({ proyectoId }: { proyectoId: string }) {
  const [isPending, startTransition] = useTransition();
  const { control, register, handleSubmit } = useForm<ProcesoInput>({
    resolver: zodResolver(procesoSchema),
    defaultValues: { proyectoId, codigo: "", nombre: "", tipo: "misional", objetivo: "", alcanceInicio: "", alcanceFin: "", duenoNombre: "", duenoCargo: "" },
  });

  function onSubmit(values: ProcesoInput) {
    startTransition(async () => {
      const result = await crearProceso(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombre">Nombre del proceso *</Label>
          <Input id="nombre" {...register("nombre")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="codigo">Código</Label>
          <Input id="codigo" placeholder="Ej: MIS-01" {...register("codigo")} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Tipo</Label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue>{() => TIPO_LABEL[field.value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TIPO_LABEL) as TipoProceso[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Textarea id="objetivo" rows={2} {...register("objetivo")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="alcanceInicio">Alcance — inicia con</Label>
          <Input id="alcanceInicio" {...register("alcanceInicio")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="alcanceFin">Alcance — termina con</Label>
          <Input id="alcanceFin" {...register("alcanceFin")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="duenoNombre">Dueño del proceso</Label>
          <Input id="duenoNombre" {...register("duenoNombre")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="duenoCargo">Cargo del dueño</Label>
          <Input id="duenoCargo" {...register("duenoCargo")} />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        Crear proceso
      </Button>
    </form>
  );
}
