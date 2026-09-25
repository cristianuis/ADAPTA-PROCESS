"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { actualizarActividad, crearActividad, eliminarActividad } from "@/lib/actions/actividades";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Actividad = Database["public"]["Tables"]["actividades"]["Row"];

export function ActividadForm({ procesoId, siguienteOrden, actividad }: { procesoId: string; siguienteOrden: number; actividad?: Actividad }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(actividad?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(actividad?.descripcion ?? "");
  const [rolResponsable, setRolResponsable] = useState(actividad?.rol_responsable ?? "");
  const [rolAprobador, setRolAprobador] = useState(actividad?.rol_aprobador ?? "");
  const [rolesConsultados, setRolesConsultados] = useState(actividad?.roles_consultados?.join(", ") ?? "");
  const [rolesInformados, setRolesInformados] = useState(actividad?.roles_informados?.join(", ") ?? "");
  const [tiempoMin, setTiempoMin] = useState(actividad?.tiempo_estimado_min?.toString() ?? "");
  const [sistemaSoporte, setSistemaSoporte] = useState(actividad?.sistema_soporte ?? "");
  const [esValorAgregado, setEsValorAgregado] = useState(actividad?.es_valor_agregado ?? true);

  function handleSubmit() {
    startTransition(async () => {
      const input = {
        procesoId,
        orden: actividad?.orden ?? siguienteOrden,
        nombre,
        descripcion,
        rolResponsable,
        rolAprobador,
        rolesConsultados: rolesConsultados.split(",").map((r) => r.trim()).filter(Boolean),
        rolesInformados: rolesInformados.split(",").map((r) => r.trim()).filter(Boolean),
        tiempoEstimadoMin: tiempoMin ? Number(tiempoMin) : null,
        esValorAgregado,
        sistemaSoporte,
      };
      const result = actividad ? await actualizarActividad(actividad.id, input) : await crearActividad(input);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(actividad ? "Actividad actualizada." : "Actividad agregada.");
      if (!actividad) {
        setNombre(""); setDescripcion(""); setRolResponsable(""); setRolAprobador("");
        setRolesConsultados(""); setRolesInformados(""); setTiempoMin(""); setSistemaSoporte("");
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size={actividad ? "sm" : "default"}>{actividad ? "Editar" : "Agregar actividad"}</Button>} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{actividad ? "Editar actividad AS-IS" : `Nueva actividad (paso ${siguienteOrden})`}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="actividad-nombre">Nombre de la actividad</Label>
            <Input id="actividad-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="actividad-descripcion">Cómo se ejecuta hoy, incluidas esperas o traspasos</Label>
            <Textarea id="actividad-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="sistemaSoporte">Sistema o herramienta actual</Label>
              <Input id="sistemaSoporte" value={sistemaSoporte} onChange={(e) => setSistemaSoporte(e.target.value)} />
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
          <div className="flex flex-wrap justify-between gap-2">
            {actividad && <Button variant="ghost" disabled={isPending} onClick={() => {
              if (!window.confirm("¿Retirar esta actividad del AS-IS? Esta acción no se puede deshacer.")) return;
              startTransition(async () => {
                const resultado = await eliminarActividad(actividad.id, procesoId);
                if (resultado.error) toast.error(resultado.error);
                else { toast.success("Actividad retirada."); setOpen(false); }
              });
            }}>Retirar actividad</Button>}
            <Button disabled={isPending || !nombre} onClick={handleSubmit}>Guardar actividad</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
