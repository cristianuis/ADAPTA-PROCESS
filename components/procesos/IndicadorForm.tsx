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
import type { SentidoIndicador, TipoIndicador } from "@/lib/supabase/types";

const TIPO_LABEL: Record<TipoIndicador, string> = {
  eficacia: "Eficacia",
  eficiencia: "Eficiencia",
  calidad: "Calidad",
};

const SENTIDO_LABEL: Record<SentidoIndicador, string> = {
  mayor_es_mejor: "Mayor es mejor",
  menor_es_mejor: "Menor es mejor",
  rango_objetivo: "Rango objetivo",
};

export function IndicadorForm({ procesoId, disabled }: { procesoId: string; disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoIndicador>("eficacia");
  const [sentido, setSentido] = useState<SentidoIndicador | null>(null);
  const [formula, setFormula] = useState("");
  const [fuenteDatos, setFuenteDatos] = useState("");
  const [mecanismoCaptura, setMecanismoCaptura] = useState("");
  const [meta, setMeta] = useState("");
  const [limiteInferior, setLimiteInferior] = useState("");
  const [limiteSuperior, setLimiteSuperior] = useState("");

  function handleSubmit() {
    if (!sentido) {
      toast.error("Define si un valor mayor, menor o dentro de un rango es mejor.");
      return;
    }

    startTransition(async () => {
      const result = await crearIndicador({
        procesoId,
        nombre,
        tipo,
        sentido,
        formula,
        fuenteDatos,
        mecanismoCaptura,
        meta: sentido !== "rango_objetivo" && meta !== "" ? Number(meta) : null,
        limiteInferior:
          sentido === "rango_objetivo" && limiteInferior !== ""
            ? Number(limiteInferior)
            : null,
        limiteSuperior:
          sentido === "rango_objetivo" && limiteSuperior !== ""
            ? Number(limiteSuperior)
            : null,
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
      setSentido(null);
      setMeta("");
      setLimiteInferior("");
      setLimiteSuperior("");
      setOpen(false);
    });
  }

  const rangoIncompleto =
    sentido === "rango_objetivo" &&
    (limiteInferior === "" || limiteSuperior === "");

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(value) => setTipo(value as TipoIndicador)}>
                <SelectTrigger>
                  <SelectValue>{() => TIPO_LABEL[tipo]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_LABEL) as TipoIndicador[]).map((valor) => (
                    <SelectItem key={valor} value={valor}>{TIPO_LABEL[valor]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Sentido *</Label>
              <Select
                value={sentido ?? undefined}
                onValueChange={(value) => setSentido(value as SentidoIndicador)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el sentido" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SENTIDO_LABEL) as SentidoIndicador[]).map((valor) => (
                    <SelectItem key={valor} value={valor}>{SENTIDO_LABEL[valor]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sentido === "rango_objetivo" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="limiteInferior">Límite inferior *</Label>
                <Input id="limiteInferior" type="number" step="any" value={limiteInferior} onChange={(e) => setLimiteInferior(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="limiteSuperior">Límite superior *</Label>
                <Input id="limiteSuperior" type="number" step="any" value={limiteSuperior} onChange={(e) => setLimiteSuperior(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta">Meta</Label>
              <Input id="meta" type="number" step="any" value={meta} onChange={(e) => setMeta(e.target.value)} />
            </div>
          )}

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
          <Button
            disabled={
              isPending || !nombre || !fuenteDatos || !mecanismoCaptura ||
              !sentido || rangoIncompleto
            }
            onClick={handleSubmit}
          >
            Guardar indicador
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
