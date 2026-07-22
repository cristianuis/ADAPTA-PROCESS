"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { guardarSipoc } from "@/lib/actions/sipoc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLUMNAS = [
  { key: "proveedores", label: "Proveedores (S)" },
  { key: "entradas", label: "Entradas (I)" },
  { key: "pasos", label: "Pasos (P) — máx. 5-7" },
  { key: "salidas", label: "Salidas (O)" },
  { key: "clientes", label: "Clientes (C)" },
] as const;

type ColumnaKey = (typeof COLUMNAS)[number]["key"];

function aTexto(lista: string[] | null): string {
  return (lista ?? []).join("\n");
}

function aLista(texto: string): string[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

interface SipocData {
  proveedores: string[] | null;
  entradas: string[] | null;
  pasos: string[] | null;
  salidas: string[] | null;
  clientes: string[] | null;
}

export function SipocForm({ procesoId, sipoc }: { procesoId: string; sipoc: SipocData | null }) {
  const [isPending, startTransition] = useTransition();
  const [valores, setValores] = useState<Record<ColumnaKey, string>>({
    proveedores: aTexto(sipoc?.proveedores ?? null),
    entradas: aTexto(sipoc?.entradas ?? null),
    pasos: aTexto(sipoc?.pasos ?? null),
    salidas: aTexto(sipoc?.salidas ?? null),
    clientes: aTexto(sipoc?.clientes ?? null),
  });

  function guardar() {
    if (aLista(valores.pasos).length > 7) {
      toast.error("Máximo 7 pasos en un SIPOC — resume, no detalles cada micro-actividad.");
      return;
    }
    startTransition(async () => {
      const result = await guardarSipoc({
        procesoId,
        proveedores: aLista(valores.proveedores),
        entradas: aLista(valores.entradas),
        pasos: aLista(valores.pasos),
        salidas: aLista(valores.salidas),
        clientes: aLista(valores.clientes),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("SIPOC guardado.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SIPOC</CardTitle>
        <p className="text-xs text-muted-foreground">Un elemento por línea en cada columna.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          {COLUMNAS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-2">
              <Label htmlFor={key} className="text-xs">
                {label}
              </Label>
              <Textarea
                id={key}
                rows={6}
                value={valores[key]}
                onChange={(e) => setValores((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Button onClick={guardar} disabled={isPending} className="mt-4">
          Guardar SIPOC
        </Button>
      </CardContent>
    </Card>
  );
}
