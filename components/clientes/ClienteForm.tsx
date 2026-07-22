"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { clienteSchema, type ClienteInput } from "@/lib/validations/cliente.schema";
import { crearCliente, actualizarCliente } from "@/lib/actions/clientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClienteFormProps {
  clienteId?: string;
  defaultValues?: Partial<ClienteInput>;
}

const EMPTY: ClienteInput = {
  razonSocial: "",
  nit: "",
  sector: "",
  subsector: "",
  numEmpleados: null,
  facturacionAnual: null,
  ciudad: "",
  contactoNombre: "",
  contactoCargo: "",
  contactoEmail: "",
  contactoTelefono: "",
  notas: "",
};

export function ClienteForm({ clienteId, defaultValues }: ClienteFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  function onSubmit(values: ClienteInput) {
    startTransition(async () => {
      const result = clienteId
        ? await actualizarCliente(clienteId, values)
        : await crearCliente(values);

      if (result?.error) {
        toast.error(result.error);
      } else if (clienteId) {
        toast.success("Cliente actualizado.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="razonSocial">Razón social *</Label>
          <Input id="razonSocial" {...register("razonSocial")} />
          {errors.razonSocial && (
            <p className="text-xs text-destructive">{errors.razonSocial.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nit">NIT</Label>
          <Input id="nit" {...register("nit")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Input id="ciudad" {...register("ciudad")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sector">Sector</Label>
          <Input id="sector" {...register("sector")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="subsector">Subsector</Label>
          <Input id="subsector" {...register("subsector")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="numEmpleados">N.º de empleados</Label>
          <Input id="numEmpleados" type="number" min={1} {...register("numEmpleados")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="facturacionAnual">Facturación anual</Label>
          <Input
            id="facturacionAnual"
            type="number"
            min={0}
            step="0.01"
            {...register("facturacionAnual")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactoNombre">Contacto — nombre</Label>
          <Input id="contactoNombre" {...register("contactoNombre")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactoCargo">Contacto — cargo</Label>
          <Input id="contactoCargo" {...register("contactoCargo")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactoEmail">Contacto — email</Label>
          <Input id="contactoEmail" type="email" {...register("contactoEmail")} />
          {errors.contactoEmail && (
            <p className="text-xs text-destructive">{errors.contactoEmail.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactoTelefono">Contacto — teléfono</Label>
          <Input id="contactoTelefono" {...register("contactoTelefono")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" rows={3} {...register("notas")} />
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {clienteId ? "Guardar cambios" : "Crear cliente"}
      </Button>
    </form>
  );
}
