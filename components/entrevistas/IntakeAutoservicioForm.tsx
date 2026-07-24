"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { responderIntakeAutoservicio } from "@/lib/actions/entrevistas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormValues {
  entrevistadoNombre: string;
  entrevistadoCargo: string;
  queRecibes: string;
  queHaces: string;
  queEntregas: string;
  queTeQuitaTiempo: string;
}

const PREGUNTAS: { name: keyof FormValues; label: string }[] = [
  { name: "queRecibes", label: "¿Qué recibes para empezar tu trabajo, y de quién?" },
  { name: "queHaces", label: "¿Qué haces con eso? (cuéntalo en tus propias palabras, paso a paso)" },
  { name: "queEntregas", label: "¿Qué entregas al terminar, y a quién?" },
  { name: "queTeQuitaTiempo", label: "¿Qué es lo que más tiempo te quita sin agregar valor?" },
];

export function IntakeAutoservicioForm({
  token,
  nombreInicial,
  cargoInicial,
}: {
  token: string;
  nombreInicial: string;
  cargoInicial: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      entrevistadoNombre: nombreInicial,
      entrevistadoCargo: cargoInicial,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await responderIntakeAutoservicio({ token, ...values });
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
          <p className="text-lg font-medium">Gracias por tu tiempo.</p>
          <p className="mt-2 text-sm text-muted-foreground">Tu respuesta fue registrada correctamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Describe tu proceso de trabajo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No hay respuestas correctas o incorrectas: cuéntanos cómo es tu día a día en tus propias palabras.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="entrevistadoNombre">Nombre</Label>
            <Input id="entrevistadoNombre" {...register("entrevistadoNombre", { required: true, minLength: 2 })} />
            {errors.entrevistadoNombre && <p className="text-xs text-destructive">Indica tu nombre.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="entrevistadoCargo">Cargo</Label>
            <Input id="entrevistadoCargo" {...register("entrevistadoCargo", { required: true, minLength: 2 })} />
            {errors.entrevistadoCargo && <p className="text-xs text-destructive">Indica tu cargo.</p>}
          </div>
        </CardContent>
      </Card>

      {PREGUNTAS.map((p) => (
        <Card key={p.name}>
          <CardHeader>
            <CardTitle className="text-base font-medium">{p.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={4} {...register(p.name, { required: true, minLength: 10 })} />
            {errors[p.name] && (
              <p className="mt-1 text-xs text-destructive">Cuéntanos un poco más — con una frase completa basta.</p>
            )}
          </CardContent>
        </Card>
      ))}

      <Button type="submit" disabled={isPending} className="self-start">
        Enviar respuesta
      </Button>
    </form>
  );
}
