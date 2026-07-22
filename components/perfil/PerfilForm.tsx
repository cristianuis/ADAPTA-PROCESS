"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { guardarPerfilConsultor } from "@/lib/actions/consultores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PerfilFormProps {
  defaultValues: {
    nombre: string;
    empresa: string;
    colorPrimario: string;
    colorSecundario: string;
    tarifaHoraObjetivo: string;
    ejemplosEstilo: string;
  };
}

export function PerfilForm({ defaultValues }: PerfilFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(defaultValues);

  function handleChange<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await guardarPerfilConsultor({
        nombre: values.nombre,
        empresa: values.empresa,
        colorPrimario: values.colorPrimario,
        colorSecundario: values.colorSecundario,
        tarifaHoraObjetivo: values.tarifaHoraObjetivo ? Number(values.tarifaHoraObjetivo) : null,
        ejemplosEstilo: values.ejemplosEstilo,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Perfil guardado.");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Perfil de consultor</CardTitle>
        <CardDescription>
          Esta información y estos colores se usan en los entregables que generes para tus clientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              required
              value={values.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="empresa">Empresa (opcional)</Label>
            <Input
              id="empresa"
              value={values.empresa}
              onChange={(e) => handleChange("empresa", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="colorPrimario">Color primario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Selector de color primario"
                  className="size-9 shrink-0 rounded-md border border-input"
                  value={values.colorPrimario}
                  onChange={(e) => handleChange("colorPrimario", e.target.value)}
                />
                <Input
                  id="colorPrimario"
                  value={values.colorPrimario}
                  onChange={(e) => handleChange("colorPrimario", e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="colorSecundario">Color secundario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Selector de color secundario"
                  className="size-9 shrink-0 rounded-md border border-input"
                  value={values.colorSecundario}
                  onChange={(e) => handleChange("colorSecundario", e.target.value)}
                />
                <Input
                  id="colorSecundario"
                  value={values.colorSecundario}
                  onChange={(e) => handleChange("colorSecundario", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tarifa">Tarifa hora objetivo (opcional)</Label>
            <Input
              id="tarifa"
              type="number"
              min={0}
              step="0.01"
              value={values.tarifaHoraObjetivo}
              onChange={(e) => handleChange("tarifaHoraObjetivo", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ejemplosEstilo">Ejemplos de estilo (opcional)</Label>
            <Textarea
              id="ejemplosEstilo"
              rows={5}
              placeholder="Pega 2-3 párrafos tuyos como referencia de voz para los textos que genera la IA. Mientras esto esté vacío, la redacción no cambia."
              value={values.ejemplosEstilo}
              onChange={(e) => handleChange("ejemplosEstilo", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Se usa como referencia de tono en el resumen ejecutivo y la justificación metodológica. Sin
              contenido aquí, esos textos se generan exactamente igual que hoy.
            </p>
          </div>
          <Button type="submit" disabled={isPending} className="self-start">
            Guardar perfil
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
