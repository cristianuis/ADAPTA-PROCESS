"use client";

import { useState, useTransition } from "react";
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
import { responderPemmPublico } from "@/lib/actions/pemm";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TipoPEMM } from "@/lib/supabase/types";

interface FormValues {
  [key: string]: number | undefined;
}

export function EncuestaPublicaForm({
  token,
  tipo,
  procesoEvaluado,
}: {
  token: string;
  tipo: TipoPEMM;
  procesoEvaluado: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [enviado, setEnviado] = useState(false);
  const dimensiones: Dimension[] = tipo === "proceso" ? DIMENSIONES_PROCESO : DIMENSIONES_EMPRESA;

  const { control, handleSubmit, formState } = useForm<FormValues>();

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await responderPemmPublico({ token, ...values } as never);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="py-8 text-center">
          <p className="text-lg font-medium">Gracias por responder.</p>
          <p className="mt-2 text-sm text-muted-foreground">Tu respuesta fue registrada correctamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {tipo === "proceso" ? `Encuesta de proceso: ${procesoEvaluado ?? ""}` : "Encuesta de capacidades de empresa"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Responde según lo que observas en tu día a día. No hay respuestas correctas o incorrectas.
        </p>
      </div>

      {dimensiones.map((dim) => (
        <Card key={dim}>
          <CardHeader>
            <CardTitle className="text-base font-medium">{DIMENSION_LABEL[dim]}</CardTitle>
            <p className="text-sm text-muted-foreground">{DIMENSION_PREGUNTA[dim]}</p>
          </CardHeader>
          <CardContent>
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
                        <span>{texto}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              )}
            />
          </CardContent>
        </Card>
      ))}

      <Button type="submit" disabled={isPending} className="self-start">
        Enviar respuesta
      </Button>
      {Object.keys(formState.errors).length > 0 && (
        <p className="text-xs text-destructive">Responde todas las preguntas antes de enviar.</p>
      )}
    </form>
  );
}
