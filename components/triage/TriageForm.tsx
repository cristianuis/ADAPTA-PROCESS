"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { triageSchema, type TriageFormInput } from "@/lib/validations/triage.schema";
import { guardarTriage } from "@/lib/actions/triage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PREGUNTAS_PUNTUADAS: {
  key: "p1" | "p2" | "p3" | "p4" | "p6";
  titulo: string;
  opciones: [string, string, string];
}[] = [
  {
    key: "p1",
    titulo: "1. ¿Existe documentación de procesos?",
    opciones: [
      "No existe ninguna documentación",
      "Existe documentación parcial o desactualizada",
      "Existe documentación completa y vigente",
    ],
  },
  {
    key: "p2",
    titulo: "2. ¿La documentación existente se usa en el día a día?",
    opciones: [
      "No, nadie la consulta",
      "Se usa ocasionalmente",
      "Se usa de forma consistente",
    ],
  },
  {
    key: "p3",
    titulo: "3. ¿Se mide el desempeño de los procesos?",
    opciones: [
      "No hay indicadores",
      "Hay indicadores informales o poco confiables",
      "Hay indicadores formales y confiables",
    ],
  },
  {
    key: "p4",
    titulo: "4. ¿Existen dueños de proceso claramente designados?",
    opciones: [
      "Nadie es responsable formalmente",
      "Hay responsables informales",
      "Hay dueños de proceso formalmente designados",
    ],
  },
  {
    key: "p6",
    titulo: "6. ¿Qué tan clara es la estructura de decisión en la empresa?",
    opciones: [
      "Las decisiones son difusas o hay conflicto de autoridad",
      "Existe una estructura de decisión parcialmente clara",
      "Existe una estructura de decisión clara y respetada",
    ],
  },
];

const OPCIONES_P5: { value: TriageFormInput["p5"]; label: string }[] = [
  { value: "crecimiento", label: "Crecimiento — la empresa está escalando y los procesos no dan abasto" },
  { value: "problema", label: "Problema — algo específico está fallando de forma recurrente" },
  { value: "requisito_externo", label: "Requisito externo — certificación, cliente o regulación con plazo" },
];

export function TriageForm({
  proyectoId,
  defaultValues,
}: {
  proyectoId: string;
  defaultValues?: Partial<TriageFormInput>;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TriageFormInput>({
    resolver: zodResolver(triageSchema),
    defaultValues: {
      proyectoId,
      p1: defaultValues?.p1 ?? undefined,
      p2: defaultValues?.p2 ?? undefined,
      p3: defaultValues?.p3 ?? undefined,
      p4: defaultValues?.p4 ?? undefined,
      p5: defaultValues?.p5,
      p6: defaultValues?.p6 ?? undefined,
      notas: defaultValues?.notas ?? "",
    },
  });

  function onSubmit(values: TriageFormInput) {
    startTransition(async () => {
      const result = await guardarTriage(values);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-4">
      {PREGUNTAS_PUNTUADAS.map(({ key, titulo, opciones }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-base font-medium">{titulo}</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name={key}
              render={({ field }) => (
                <RadioGroup
                  value={field.value?.toString() ?? ""}
                  onValueChange={(value) => field.onChange(Number(value))}
                  className="flex flex-col gap-2"
                >
                  {opciones.map((opcion, index) => (
                    <label
                      key={index}
                      htmlFor={`${key}-${index}`}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <RadioGroupItem value={index.toString()} id={`${key}-${index}`} className="mt-0.5" />
                      <span>{opcion}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
            {errors[key] && <p className="mt-2 text-xs text-destructive">Selecciona una opción</p>}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            5. ¿Cuál es el principal disparador de este proyecto?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="p5"
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? ""}
                onValueChange={field.onChange}
                className="flex flex-col gap-2"
              >
                {OPCIONES_P5.map(({ value, label }) => (
                  <label
                    key={value}
                    htmlFor={`p5-${value}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={value} id={`p5-${value}`} className="mt-0.5" />
                    <span>{label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />
          {errors.p5 && <p className="mt-2 text-xs text-destructive">Selecciona una opción</p>}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas adicionales (opcional)</Label>
        <Textarea id="notas" rows={3} {...register("notas")} />
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        Calcular arquetipo
      </Button>
    </form>
  );
}
