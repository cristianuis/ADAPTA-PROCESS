"use client";

import { useState } from "react";
import { calcularTarifaHora } from "@/lib/tarifa/calcular-tarifa";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CalculadoraTarifa() {
  const [costoMensual, setCostoMensual] = useState(0);
  const [utilidad, setUtilidad] = useState(0);
  const [horas, setHoras] = useState(160);

  const resultado =
    horas > 0
      ? calcularTarifaHora({ costoMensualTotal: costoMensual, utilidadDeseadaMensual: utilidad, horasTotalesMes: horas })
      : null;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Calculadora de tarifa hora objetivo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="costoMensual">Costo mensual total</Label>
            <Input
              id="costoMensual"
              type="number"
              min={0}
              value={costoMensual || ""}
              onChange={(e) => setCostoMensual(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="utilidad">Utilidad deseada</Label>
            <Input
              id="utilidad"
              type="number"
              min={0}
              value={utilidad || ""}
              onChange={(e) => setUtilidad(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="horas">Horas totales/mes</Label>
            <Input id="horas" type="number" min={1} value={horas} onChange={(e) => setHoras(Number(e.target.value))} />
          </div>
        </div>
        {resultado && (
          <div className="rounded-md bg-accent p-4 text-sm">
            <p>
              Horas facturables (55% por defecto): <span className="font-medium">{resultado.horasFacturables}</span>
            </p>
            <p className="mt-1 text-lg font-semibold text-primary">
              Tarifa hora objetivo:{" "}
              {resultado.tarifaHoraObjetivo.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
