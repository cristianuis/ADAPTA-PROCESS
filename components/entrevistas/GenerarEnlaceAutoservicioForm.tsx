"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearInvitacionAutoservicio } from "@/lib/actions/entrevistas";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const NUEVO = "__nuevo__";

export function GenerarEnlaceAutoservicioForm({
  proyectoId,
  personasRegistradas,
}: {
  proyectoId: string;
  personasRegistradas: { nombre: string; cargo: string | null }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [seleccion, setSeleccion] = useState(NUEVO);
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [enlace, setEnlace] = useState<string | null>(null);

  function handleSeleccion(valor: string | null) {
    setSeleccion(valor ?? NUEVO);
    if (!valor || valor === NUEVO) {
      setNombre("");
      setCargo("");
      return;
    }
    const persona = personasRegistradas.find((p) => p.nombre === valor);
    setNombre(persona?.nombre ?? "");
    setCargo(persona?.cargo ?? "");
  }

  function handleCrear() {
    startTransition(async () => {
      const result = await crearInvitacionAutoservicio({
        proyectoId,
        entrevistadoNombre: nombre,
        entrevistadoCargo: cargo,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const url = `${window.location.origin}/encuesta/proceso/${result.token}`;
      setEnlace(url);
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSeleccion(NUEVO);
      setNombre("");
      setCargo("");
      setEnlace(null);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline">Generar enlaces de autoservicio</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar enlace de autoservicio</DialogTitle>
        </DialogHeader>
        {enlace ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Comparte este enlace con la persona. Podrá describir su propio proceso sin que la entrevistes tú. Es de
              un solo uso.
            </p>
            <div className="flex gap-2">
              <Input readOnly value={enlace} />
              <Button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(enlace);
                  toast.success("Enlace copiado.");
                }}
              >
                Copiar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Persona</Label>
              <Select value={seleccion} onValueChange={handleSeleccion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NUEVO}>Nueva persona / enlace genérico</SelectItem>
                  {personasRegistradas.map((p) => (
                    <SelectItem key={p.nombre} value={p.nombre}>
                      {p.nombre}
                      {p.cargo ? ` · ${p.cargo}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="asNombre">Nombre (opcional)</Label>
              <Input id="asNombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="asCargo">Cargo (opcional)</Label>
              <Input id="asCargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
            </div>
            <Button type="button" disabled={isPending} onClick={handleCrear}>
              Generar enlace
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
