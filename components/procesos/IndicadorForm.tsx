"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearIndicador } from "@/lib/actions/indicadores";
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
import type { TipoIndicador } from "@/lib/supabase/types";

const TIPO_LABEL: Record<TipoIndicador, string> = { eficacia: "Eficacia", eficiencia: "Eficiencia", calidad: "Calidad" };

export function IndicadorForm({ procesoId, disabled }: { procesoId: string; disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoIndicador>("eficacia");
  const [formula, setFormula] = useState("");
  const [fuenteDatos, setFuenteDatos] = useState("");
  const [mecanismoCaptura, setMecanismoCaptura] = useState("");
  const [meta, setMeta] = useState("");

  function handleSubmit() {
    startTransition(async () => {
      const result = await crearIndicador({
        procesoId,
        nombre,
        tipo,
        formula,
        fuenteDatos,
        mecanismoCaptura,
        meta: meta ? Number(meta) : null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Indicador guardado.");
      setNombre("");
      setFormula("");
      setFuenteDatos("");
      setMecanismoCaptura("");
      setMeta("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" disabled={disabled}>Agregar indicador</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo indicador</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoIndicador)}>
                <SelectTrigger>
                  <SelectValue>{() => TIPO_LABEL[tipo]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_LABEL) as TipoIndicador[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta">Meta</Label>
              <Input id="meta" type="number" value={meta} onChange={(e) => setMeta(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="formula">Fórmula</Label>
            <Input id="formula" value={formula} onChange={(e) => setFormula(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fuenteDatos">Fuente de datos *</Label>
            <Input id="fuenteDatos" value={fuenteDatos} onChange={(e) => setFuenteDatos(e.target.value)} />
            <p className="text-xs text-muted-foreground">Obligatorio — no se puede guardar sin esto.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mecanismoCaptura">Mecanismo de captura *</Label>
            <Input id="mecanismoCaptura" value={mecanismoCaptura} onChange={(e) => setMecanismoCaptura(e.target.value)} />
          </div>
          <Button disabled={isPending || !nombre || !fuenteDatos || !mecanismoCaptura} onClick={handleSubmit}>
            Guardar indicador
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
