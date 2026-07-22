"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { crearInvitacionPemm } from "@/lib/actions/pemm";
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
import type { NivelJerarquico, TipoPEMM } from "@/lib/supabase/types";

const NIVEL_LABEL: Record<NivelJerarquico, string> = {
  direccion: "Dirección",
  mando_medio: "Mando medio",
  operacion: "Operación",
};

export function InvitarPemmForm({ proyectoId }: { proyectoId: string }) {
  const [isPending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<TipoPEMM>("proceso");
  const [procesoEvaluado, setProcesoEvaluado] = useState("");
  const [nivel, setNivel] = useState<NivelJerarquico>("operacion");
  const [nombre, setNombre] = useState("");
  const [enlace, setEnlace] = useState<string | null>(null);

  function handleCrear() {
    startTransition(async () => {
      const result = await crearInvitacionPemm({
        proyectoId,
        tipo,
        procesoEvaluado,
        respondienteNivel: nivel,
        respondienteNombre: nombre,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const url = `${window.location.origin}/encuesta/pemm/${result.token}`;
      setEnlace(url);
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Invitar a encuesta</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar enlace de encuesta PEMM</DialogTitle>
        </DialogHeader>
        {enlace ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Comparte este enlace con la persona invitada. Es de un solo uso.
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
              <Label>Tipo de evaluación</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPEMM)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proceso">Un proceso específico</SelectItem>
                  <SelectItem value="empresa">Capacidades de empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tipo === "proceso" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="procesoEvaluado">¿Qué proceso?</Label>
                <Input
                  id="procesoEvaluado"
                  value={procesoEvaluado}
                  onChange={(e) => setProcesoEvaluado(e.target.value)}
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>Nivel jerárquico del respondiente</Label>
              <Select value={nivel} onValueChange={(v) => setNivel(v as NivelJerarquico)}>
                <SelectTrigger>
                  <SelectValue>{() => NIVEL_LABEL[nivel]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(NIVEL_LABEL) as NivelJerarquico[]).map((n) => (
                    <SelectItem key={n} value={n}>
                      {NIVEL_LABEL[n]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre (opcional)</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
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
