"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { proyectoSchema, type ProyectoInput } from "@/lib/validations/proyecto.schema";
import { crearProyecto } from "@/lib/actions/proyectos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/types";

type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

interface ProyectoFormProps {
  clientes: Cliente[];
  clienteIdPreseleccionado?: string;
}

export function ProyectoForm({ clientes, clienteIdPreseleccionado }: ProyectoFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProyectoInput>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      clienteId: clienteIdPreseleccionado ?? "",
      nombre: "",
      estado: "prospecto",
      fechaInicio: "",
      fechaFinEstimada: "",
      valorContrato: null,
      modeloCobro: "",
    },
  });

  const clienteId = watch("clienteId");

  function onSubmit(values: ProyectoInput) {
    startTransition(async () => {
      const result = await crearProyecto(values);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  if (clientes.length === 0) {
    return (
      <p className="max-w-md rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
        Necesitas registrar al menos un cliente antes de crear un proyecto.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Cliente *</Label>
        <Select
          value={clienteId}
          onValueChange={(value) => setValue("clienteId", value ?? "")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un cliente">
              {(value: string | null) =>
                clientes.find((cliente) => cliente.id === value)?.razon_social ??
                "Selecciona un cliente"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.razon_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre del proyecto *</Label>
        <Input id="nombre" {...register("nombre")} />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaInicio">Fecha de inicio</Label>
          <Input id="fechaInicio" type="date" {...register("fechaInicio")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaFinEstimada">Fin estimado</Label>
          <Input id="fechaFinEstimada" type="date" {...register("fechaFinEstimada")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="valorContrato">Valor del contrato</Label>
          <Input id="valorContrato" type="number" min={0} step="0.01" {...register("valorContrato")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="modeloCobro">Modelo de cobro</Label>
          <Input id="modeloCobro" placeholder="Ej: fijo, por hitos" {...register("modeloCobro")} />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        Crear proyecto
      </Button>
    </form>
  );
}
