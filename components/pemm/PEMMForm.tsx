"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  DIMENSIONES_PROCESO,
  DIMENSIONES_EMPRESA,
  DIMENSION_LABEL,
  DIMENSION_PREGUNTA,
  DESCRIPTORES,
  type Dimension,
} from "@/lib/pemm/descriptores";
import { crearEvaluacionPemmProceso, crearEvaluacionPemmEmpresa } from "@/lib/actions/pemm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TipoPEMM } from "@/lib/supabase/types";

interface PEMMFormValues {
  procesoEvaluado: string;
  evidencias: Record<string, string>;
  [key: string]: unknown;
}

export function PEMMForm({ proyectoId, tipo }: { proyectoId: string; tipo: TipoPEMM }) {
  const [isPending, startTransition] = useTransition();
  const dimensiones: Dimension[] = tipo === "proceso" ? DIMENSIONES_PROCESO : DIMENSIONES_EMPRESA;

  const { control, register, handleSubmit, formState } = useForm<PEMMFormValues>({
    defaultValues: { procesoEvaluado: "", evidencias: {} },
  });

  function onSubmit(values: PEMMFormValues) {
    startTransition(async () => {
      const base = { proyectoId, evidencias: values.evidencias };
      const result =
        tipo === "proceso"
          ? await crearEvaluacionPemmProceso({
              ...base,
              procesoEvaluado: values.procesoEvaluado,
              diseno: values.diseno as 1 | 2 | 3 | 4,
              ejecutores: values.ejecutores as 1 | 2 | 3 | 4,
              responsable: values.responsable as 1 | 2 | 3 | 4,
              infraestructura: values.infraestructura as 1 | 2 | 3 | 4,
              indicadores: values.indicadores as 1 | 2 | 3 | 4,
            })
          : await crearEvaluacionPemmEmpresa({
              ...base,
              liderazgo: values.liderazgo as 1 | 2 | 3 | 4,
              cultura: values.cultura as 1 | 2 | 3 | 4,
              experiencia: values.experiencia as 1 | 2 | 3 | 4,
              gobierno: values.gobierno as 1 | 2 | 3 | 4,
            });
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-4">
      {tipo === "proceso" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="procesoEvaluado">¿Qué proceso se evalúa? *</Label>
          <Input id="procesoEvaluado" required {...register("procesoEvaluado", { required: true })} />
        </div>
      )}

      {dimensiones.map((dim) => (
        <Card key={dim}>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {DIMENSION_LABEL[dim]}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{DIMENSION_PREGUNTA[dim]}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Controller
              control={control}
              name={dim}
              rules={{ required: true }}
              render={({ field }) => (
                <RadioGroup
                  value={field.value?.toString() ?? ""}
                  onValueChange={(value) => field.onChange(Number(value))}
                  className="flex flex-col gap-2"
                >
                  {DESCRIPTORES[dim].map((texto, index) => {
                    const nivel = index + 1;
                    return (
                      <label
                        key={nivel}
                        htmlFor={`${dim}-${nivel}`}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                      >
                        <RadioGroupItem value={nivel.toString()} id={`${dim}-${nivel}`} className="mt-0.5" />
                        <span>
                          <span className="font-medium">Nivel {nivel}.</span> {texto}
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>
              )}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor={`evidencia-${dim}`} className="text-xs text-muted-foreground">
                Evidencia que justifica esta calificación (opcional)
              </Label>
              <Textarea id={`evidencia-${dim}`} rows={2} {...register(`evidencias.${dim}` as const)} />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="submit" disabled={isPending} className="self-start">
        Guardar evaluación
      </Button>
      {Object.keys(formState.errors).length > 0 && (
        <p className="text-xs text-destructive">Responde todas las dimensiones antes de guardar.</p>
      )}
    </form>
  );
}
