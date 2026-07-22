"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearHallazgoManual } from "@/lib/actions/hallazgos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CategoriaHallazgo, FuenteHallazgo } from "@/lib/supabase/types";

const CATEGORIA_LABEL: Record<CategoriaHallazgo, string> = {
  proceso: "Proceso",
  gobierno: "Gobierno",
  tecnologia: "Tecnología",
  cultura: "Cultura",
  datos: "Datos",
};

const FUENTE_LABEL: Record<FuenteHallazgo, string> = {
  entrevista: "Entrevista",
  observacion: "Observación",
  documental: "Documental",
  financiero: "Financiero",
};

export function HallazgoForm({ proyectoId }: { proyectoId: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<CategoriaHallazgo>("proceso");
  const [fuente, setFuente] = useState<FuenteHallazgo>("observacion");
  const [impacto, setImpacto] = useState(3);
  const [esfuerzo, setEsfuerzo] = useState(3);

  function handleSubmit() {
    startTransition(async () => {
      const result = await crearHallazgoManual({
        proyectoId,
        titulo,
        descripcion,
        categoria,
        impacto: impacto as 1 | 2 | 3 | 4 | 5,
        esfuerzo: esfuerzo as 1 | 2 | 3 | 4 | 5,
        fuente,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Hallazgo agregado.");
      setTitulo("");
      setDescripcion("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Agregar hallazgo manual</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo hallazgo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaHallazgo)}>
                <SelectTrigger>
                  <SelectValue>{() => CATEGORIA_LABEL[categoria]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_LABEL) as CategoriaHallazgo[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORIA_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fuente</Label>
              <Select value={fuente} onValueChange={(v) => setFuente(v as FuenteHallazgo)}>
                <SelectTrigger>
                  <SelectValue>{() => FUENTE_LABEL[fuente]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FUENTE_LABEL) as FuenteHallazgo[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {FUENTE_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Impacto (1-5)</Label>
              <Select value={impacto.toString()} onValueChange={(v) => setImpacto(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Esfuerzo (1-5)</Label>
              <Select value={esfuerzo.toString()} onValueChange={(v) => setEsfuerzo(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button disabled={isPending || !titulo} onClick={handleSubmit}>
            Guardar hallazgo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
