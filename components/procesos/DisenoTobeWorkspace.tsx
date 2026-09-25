"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  agregarPasoTobe,
  cambiarEstadoDisenoTobe,
  guardarDisenoTobe,
  quitarPasoTobe,
} from "@/lib/actions/disenos-tobe";
import type { Database } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Diseno = Database["public"]["Tables"]["disenos_tobe"]["Row"];
type Paso = Database["public"]["Tables"]["pasos_tobe"]["Row"];
type Hallazgo = Pick<Database["public"]["Tables"]["hallazgos"]["Row"], "id" | "titulo" | "estado_evidencia">;

export function DisenoTobeWorkspace({
  procesoId, diseno, pasos, hallazgos,
}: {
  procesoId: string;
  diseno: Diseno | null;
  pasos: Paso[];
  hallazgos: Hallazgo[];
}) {
  const [pendiente, startTransition] = useTransition();
  const [objetivo, setObjetivo] = useState(diseno?.objetivo ?? "");
  const [criterio, setCriterio] = useState(diseno?.criterio_validacion ?? "");
  const [decisiones, setDecisiones] = useState(diseno?.decisiones ?? "");
  const [nombre, setNombre] = useState("");
  const [responsable, setResponsable] = useState("");
  const [cambio, setCambio] = useState("");
  const [tipoCambio, setTipoCambio] = useState<"conservar" | "modificar" | "nuevo">("modificar");
  const [automatizacion, setAutomatizacion] = useState<"manual" | "asistida" | "candidata">("manual");
  const [hallazgoId, setHallazgoId] = useState("");
  const bloqueado = diseno?.estado === "validado";
  const hallazgosRevisados = hallazgos.filter((h) =>
    h.estado_evidencia === "cita_verificada" || h.estado_evidencia === "validado_consultor"
  );

  function ejecutar(accion: () => Promise<{ error: string | null }>, exito: string) {
    startTransition(async () => {
      try {
        const resultado = await accion();
        if (resultado.error) toast.error(resultado.error);
        else toast.success(exito);
      } catch {
        toast.error("No se pudo completar la operación. Inténtalo de nuevo.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Diseño TO-BE · proceso futuro</CardTitle>
        <p className="text-sm text-muted-foreground">
          El AS-IS anterior no se altera. Cada cambio futuro se sustenta en un hallazgo revisado; «candidata» identifica una oportunidad, no una automatización ya implementada.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border px-3 py-1">{diseno ? (bloqueado ? "Validado por consultor" : "Borrador") : "Sin diseño"}</span>
          {diseno?.validado_at && <span className="text-muted-foreground">Validado el {new Date(diseno.validado_at).toLocaleDateString("es-CO")}</span>}
          {bloqueado && (
            <Button size="sm" variant="outline" disabled={pendiente} onClick={() => ejecutar(
              () => cambiarEstadoDisenoTobe(diseno.id, "borrador"), "Diseño reabierto para revisión."
            )}>Reabrir para corregir</Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tobe-objetivo">Resultado esperado del proceso futuro</Label>
            <Textarea id="tobe-objetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} disabled={bloqueado} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tobe-criterio">Cómo se validará en un piloto</Label>
            <Textarea id="tobe-criterio" value={criterio} onChange={(e) => setCriterio(e.target.value)} disabled={bloqueado} rows={3} placeholder="Métrica, muestra, plazo y quién revisará el resultado" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tobe-decisiones">Decisiones y pasos AS-IS que se eliminan o cambian</Label>
            <Textarea id="tobe-decisiones" value={decisiones} onChange={(e) => setDecisiones(e.target.value)} disabled={bloqueado} rows={3} />
          </div>
          {!bloqueado && (
            <Button className="w-fit" disabled={pendiente || objetivo.trim().length < 10 || criterio.trim().length < 10 || decisiones.trim().length < 10}
              onClick={() => ejecutar(() => guardarDisenoTobe({ procesoId, objetivo, criterioValidacion: criterio, decisiones }), "Diseño guardado.")}>Guardar diseño</Button>
          )}
        </div>

        {diseno && (
          <section className="space-y-4 border-t pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Pasos propuestos ({pasos.length})</h3>
              {!bloqueado && pasos.some((paso) => paso.tipo_cambio !== "conservar") && (
                <Button size="sm" disabled={pendiente} onClick={() => ejecutar(
                  () => cambiarEstadoDisenoTobe(diseno.id, "validado"), "Diseño validado con evidencia."
                )}>Validar diseño</Button>
              )}
            </div>
            {pasos.length === 0 ? <p className="text-sm text-muted-foreground">Agrega la secuencia futura. Registra también los pasos que se conservan para que el diseño sea ejecutable.</p> : (
              <ol className="space-y-2">
                {pasos.map((paso) => (
                  <li key={paso.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{paso.orden}. {paso.nombre} · {paso.responsable}</p>
                      <p className="text-muted-foreground">{paso.cambio}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{paso.tipo_cambio} · {paso.automatizacion === "candidata" ? "Oportunidad de automatización" : paso.automatizacion}</p>
                      {paso.hallazgo_id && <p className="text-xs">Soporte: {hallazgos.find((h) => h.id === paso.hallazgo_id)?.titulo ?? "Hallazgo vinculado"}</p>}
                    </div>
                    {!bloqueado && <Button size="sm" variant="ghost" disabled={pendiente} onClick={() => ejecutar(
                      () => quitarPasoTobe(paso.id), "Paso retirado."
                    )}>Quitar</Button>}
                  </li>
                ))}
              </ol>
            )}
            {!bloqueado && (
              <div className="grid gap-3 rounded-md border border-dashed p-4 sm:grid-cols-2">
                <div className="space-y-1"><Label htmlFor="tobe-paso">Paso futuro</Label><Input id="tobe-paso" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="tobe-responsable">Rol responsable</Label><Input id="tobe-responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} /></div>
                <div className="space-y-1 sm:col-span-2"><Label htmlFor="tobe-cambio">Qué cambia y por qué</Label><Textarea id="tobe-cambio" value={cambio} onChange={(e) => setCambio(e.target.value)} rows={2} /></div>
                <div className="space-y-1"><Label htmlFor="tobe-tipo">Tipo de cambio</Label><select id="tobe-tipo" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value as typeof tipoCambio)}><option value="conservar">Conservar</option><option value="modificar">Modificar</option><option value="nuevo">Nuevo</option></select></div>
                <div className="space-y-1"><Label htmlFor="tobe-automatizacion">Trabajo futuro</Label><select id="tobe-automatizacion" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={automatizacion} onChange={(e) => setAutomatizacion(e.target.value as typeof automatizacion)}><option value="manual">Manual</option><option value="asistida">Asistida por herramienta</option><option value="candidata">Candidata a automatización</option></select></div>
                <div className="space-y-1 sm:col-span-2"><Label htmlFor="tobe-hallazgo">Hallazgo que justifica el cambio</Label><select id="tobe-hallazgo" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={hallazgoId} onChange={(e) => setHallazgoId(e.target.value)}><option value="">{tipoCambio === "conservar" ? "Sin cambio; vínculo opcional" : "Selecciona un hallazgo revisado"}</option>{hallazgosRevisados.map((h) => <option key={h.id} value={h.id}>{h.titulo}</option>)}</select></div>
                <Button className="w-fit" disabled={pendiente || nombre.trim().length < 2 || responsable.trim().length < 2 || cambio.trim().length < 10 || (tipoCambio !== "conservar" && !hallazgoId)} onClick={() => ejecutar(async () => {
                  const resultado = await agregarPasoTobe({ disenoId: diseno.id, nombre, responsable, cambio, tipoCambio, automatizacion, hallazgoId: hallazgoId || null });
                  if (!resultado.error) { setNombre(""); setResponsable(""); setCambio(""); setHallazgoId(""); }
                  return resultado;
                }, "Paso futuro añadido.")}>Agregar paso</Button>
                {hallazgosRevisados.length === 0 && <p className="text-sm text-muted-foreground sm:col-span-2">Para proponer cambios, valida primero un hallazgo con evidencia en el módulo de diagnóstico.</p>}
              </div>
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}
