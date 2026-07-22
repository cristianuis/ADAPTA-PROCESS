"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearPlantillaDesdeProceso } from "@/lib/actions/plantillas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function GuardarComoPlantilla({ procesoId, nombreSugerido }: { procesoId: string; nombreSugerido: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(nombreSugerido);
  const [sector, setSector] = useState("");

  function handleSubmit() {
    startTransition(async () => {
      const result = await crearPlantillaDesdeProceso(procesoId, { nombre, sector, tipoProceso: "", descripcion: "" });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Guardado en tu biblioteca de plantillas.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Guardar como plantilla</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar en la biblioteca</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombrePlantilla">Nombre de la plantilla</Label>
            <Input id="nombrePlantilla" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sectorPlantilla">Sector (para futuras sugerencias)</Label>
            <Input id="sectorPlantilla" value={sector} onChange={(e) => setSector(e.target.value)} />
          </div>
          <Button disabled={isPending || !nombre} onClick={handleSubmit}>
            Guardar plantilla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
