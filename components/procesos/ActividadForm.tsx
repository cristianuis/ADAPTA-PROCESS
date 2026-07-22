"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearActividad } from "@/lib/actions/actividades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ActividadForm({ procesoId, siguienteOrden }: { procesoId: string; siguienteOrden: number }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rolResponsable, setRolResponsable] = useState("");
  const [rolAprobador, setRolAprobador] = useState("");
  const [rolesConsultados, setRolesConsultados] = useState("");
  const [rolesInformados, setRolesInformados] = useState("");
  const [tiempoMin, setTiempoMin] = useState("");
  const [esValorAgregado, setEsValorAgregado] = useState(true);

  function handleSubmit() {
    startTransition(async () => {
      const result = await crearActividad({
        procesoId,
        orden: siguienteOrden,
        nombre,
        rolResponsable,
        rolAprobador,
        rolesConsultados: rolesConsultados.split(",").map((r) => r.trim()).filter(Boolean),
        rolesInformados: rolesInformados.split(",").map((r) => r.trim()).filter(Boolean),
        tiempoEstimadoMin: tiempoMin ? Number(tiempoMin) : null,
        esValorAgregado,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Actividad agregada.");
      setNombre("");
      setRolResponsable("");
      setRolAprobador("");
      setRolesConsultados("");
      setRolesInformados("");
      setTiempoMin("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Agregar actividad</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva actividad (paso {siguienteOrden})</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="actividad-nombre">Nombre de la actividad</Label>
            <Input id="actividad-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rolResponsable">Rol responsable (R)</Label>
              <Input id="rolResponsable" value={rolResponsable} onChange={(e) => setRolResponsable(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rolAprobador">Rol aprobador (A)</Label>
              <Input id="rolAprobador" value={rolAprobador} onChange={(e) => setRolAprobador(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rolesConsultados">Consultados (C, separados por coma)</Label>
              <Input id="rolesConsultados" value={rolesConsultados} onChange={(e) => setRolesConsultados(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rolesInformados">Informados (I, separados por coma)</Label>
              <Input id="rolesInformados" value={rolesInformados} onChange={(e) => setRolesInformados(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tiempoMin">Tiempo estimado (min)</Label>
              <Input id="tiempoMin" type="number" min={1} value={tiempoMin} onChange={(e) => setTiempoMin(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input
                id="esValorAgregado"
                type="checkbox"
                checked={esValorAgregado}
                onChange={(e) => setEsValorAgregado(e.target.checked)}
                className="size-4"
              />
              <Label htmlFor="esValorAgregado" className="text-sm font-normal">
                Es valor agregado
              </Label>
            </div>
          </div>
          <Button disabled={isPending || !nombre} onClick={handleSubmit}>
            Guardar actividad
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
