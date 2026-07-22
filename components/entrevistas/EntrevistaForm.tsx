"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import type { EntrevistaInput } from "@/lib/validations/entrevista.schema";
import { crearEntrevista } from "@/lib/actions/entrevistas";
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

const NIVEL_LABEL = { direccion: "Dirección", mando_medio: "Mando medio", operacion: "Operación" } as const;

export function EntrevistaForm({ proyectoId }: { proyectoId: string }) {
  const [isPending, startTransition] = useTransition();
  const { control, register, handleSubmit } = useForm<EntrevistaInput>({
    defaultValues: {
      proyectoId,
      entrevistadoNombre: "",
      entrevistadoCargo: "",
      nivel: "operacion",
      fecha: "",
      transcripcion: "",
    },
  });

  function onSubmit(values: EntrevistaInput) {
    startTransition(async () => {
      const result = await crearEntrevista(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="entrevistadoNombre">Nombre *</Label>
        <Input id="entrevistadoNombre" required {...register("entrevistadoNombre")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="entrevistadoCargo">Cargo</Label>
          <Input id="entrevistadoCargo" {...register("entrevistadoCargo")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" {...register("fecha")} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Nivel jerárquico</Label>
        <Controller
          control={control}
          name="nivel"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue>{() => NIVEL_LABEL[field.value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NIVEL_LABEL) as (keyof typeof NIVEL_LABEL)[]).map((n) => (
                  <SelectItem key={n} value={n}>
                    {NIVEL_LABEL[n]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="transcripcion">Transcripción (opcional por ahora — puedes pegarla después)</Label>
        <Textarea id="transcripcion" rows={6} {...register("transcripcion")} />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        Guardar entrevista
      </Button>
    </form>
  );
}
