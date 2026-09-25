"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, CircleDollarSign, ListChecks, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import {
  actualizarEstadoAccion,
  actualizarEstadoIniciativa,
  crearAccionMejora,
  crearCuantificacionImpacto,
  crearIniciativaMejora,
  crearMedicionImpacto,
} from "@/lib/actions/mejoras";
import { calcularImpactoAnual } from "@/lib/mejoras/calcular-impacto";
import { prepararSeriesImpacto, ultimaMedicionAnualValidada } from "@/lib/mejoras/resumen-impacto";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database, EstadoAccionMejora, EstadoIniciativa, TipoImpacto } from "@/lib/supabase/types";

type Hallazgo = Database["public"]["Tables"]["hallazgos"]["Row"];
type Cuantificacion = Database["public"]["Tables"]["cuantificaciones_impacto"]["Row"];
type Iniciativa = Database["public"]["Tables"]["iniciativas_mejora"]["Row"];
type Enlace = Database["public"]["Tables"]["iniciativa_hallazgos"]["Row"];
type Accion = Database["public"]["Tables"]["acciones_mejora"]["Row"];
type Medicion = Database["public"]["Tables"]["mediciones_impacto"]["Row"];

interface Props {
  proyectoId: string;
  hallazgos: Hallazgo[];
  cuantificaciones: Cuantificacion[];
  iniciativas: Iniciativa[];
  enlaces: Enlace[];
  acciones: Accion[];
  mediciones: Medicion[];
}

const IMPACTO_LABEL: Record<TipoImpacto, string> = {
  ahorro: "Ahorro",
  ingreso: "Nuevo ingreso",
  costo_evitado: "Costo evitado",
  capacidad_liberada: "Capacidad liberada",
  riesgo_reducido: "Riesgo reducido",
};

const ESTADO_INICIATIVA_LABEL: Record<EstadoIniciativa, string> = {
  borrador: "Borrador",
  priorizada: "Priorizada",
  en_ejecucion: "En ejecución",
  bloqueada: "Bloqueada",
  completada: "Completada",
  descartada: "Descartada",
};

const ESTADO_ACCION_LABEL: Record<EstadoAccionMejora, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  bloqueada: "Bloqueada",
  completada: "Completada",
  cancelada: "Cancelada",
};

function moneda(valor: number, codigo = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: codigo,
    maximumFractionDigits: 0,
    notation: Math.abs(valor) >= 1_000_000 ? "compact" : "standard",
  }).format(valor);
}

function numero(valor: string) {
  const parsed = Number(valor);
  return Number.isFinite(parsed) ? parsed : 0;
}

function CuantificacionForm({ proyectoId, hallazgo }: { proyectoId: string; hallazgo: Hallazgo }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<TipoImpacto>("ahorro");
  const [nombre, setNombre] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [volumen, setVolumen] = useState("");
  const [periodos, setPeriodos] = useState("12");
  const [capturable, setCapturable] = useState("70");
  const [fuente, setFuente] = useState("");
  const [supuestos, setSupuestos] = useState("");
  const [confianza, setConfianza] = useState<"baja" | "media" | "alta">("media");
  const [validado, setValidado] = useState(false);
  const estimado = calcularImpactoAnual({
    valorUnitario: numero(valorUnitario),
    volumenPeriodo: numero(volumen),
    periodosAnio: numero(periodos),
    porcentajeCapturable: numero(capturable),
  });

  function guardar() {
    if (!valorUnitario.trim() || !volumen.trim() || !fuente.trim() || !supuestos.trim()) {
      toast.error("Completa valor, volumen, fuente y supuestos. Si un dato es cero, escríbelo explícitamente.");
      return;
    }

    startTransition(async () => {
      const resultado = await crearCuantificacionImpacto({
        proyectoId,
        hallazgoId: hallazgo.id,
        nombre,
        tipo,
        valorUnitario: numero(valorUnitario),
        volumenPeriodo: numero(volumen),
        periodosAnio: numero(periodos),
        porcentajeCapturable: numero(capturable),
        moneda: "COP",
        fuenteCalculo: fuente,
        supuestos,
        confianza,
        validadoCliente: validado,
      });
      if (resultado.error) { toast.error(resultado.error); return; }
      toast.success("Impacto anual cuantificado.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline"><CircleDollarSign />Cuantificar</Button>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Cuantificar: {hallazgo.titulo}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label>Componente de impacto *</Label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Costo de reprocesos mensuales" /></div>
          <div className="space-y-2"><Label>Tipo *</Label><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value as TipoImpacto)}>{Object.entries(IMPACTO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="space-y-2"><Label>Confianza</Label><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={confianza} onChange={(e) => setConfianza(e.target.value as typeof confianza)}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></div>
          <div className="space-y-2"><Label>Valor por evento *</Label><Input type="number" min="0" value={valorUnitario} onChange={(e) => setValorUnitario(e.target.value)} /></div>
          <div className="space-y-2"><Label>Eventos por periodo *</Label><Input type="number" min="0" value={volumen} onChange={(e) => setVolumen(e.target.value)} /></div>
          <div className="space-y-2"><Label>Periodos al año *</Label><Input type="number" min="0.01" step="any" value={periodos} onChange={(e) => setPeriodos(e.target.value)} /></div>
          <div className="space-y-2"><Label>Porcentaje capturable *</Label><Input type="number" min="0" max="100" value={capturable} onChange={(e) => setCapturable(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Fuente del cálculo *</Label><Input value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="ERP, nómina, factura, muestra observada…" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Supuestos *</Label><Textarea rows={3} value={supuestos} onChange={(e) => setSupuestos(e.target.value)} placeholder="Explica qué se incluyó, periodo observado y límites de la estimación." /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={validado} onChange={(e) => setValidado(e.target.checked)} />El cliente confirmó datos y supuestos</label>
          <div className="rounded-xl bg-primary p-4 text-primary-foreground sm:col-span-2"><p className="text-xs uppercase tracking-wider opacity-70">Impacto anual estimado</p><p className="mt-1 text-2xl font-semibold">{moneda(estimado)}</p></div>
          <Button className="sm:col-span-2" disabled={pending} onClick={guardar}>{pending ? "Guardando…" : "Guardar cálculo auditable"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IniciativaForm({ proyectoId, hallazgos }: { proyectoId: string; hallazgos: Hallazgo[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [titulo, setTitulo] = useState("");
  const [hipotesis, setHipotesis] = useState("");
  const [resultado, setResultado] = useState("");
  const [criterio, setCriterio] = useState("");
  const [responsable, setResponsable] = useState("");
  const [inicio, setInicio] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [inversion, setInversion] = useState("");
  const [beneficio, setBeneficio] = useState("");

  function alternar(id: string) {
    setSeleccionados((actual) => actual.includes(id) ? actual.filter((valor) => valor !== id) : [...actual, id]);
  }

  function guardar() {
    const inversionNumero = inversion.trim() ? Number(inversion) : Number.NaN;
    const beneficioNumero = beneficio.trim() ? Number(beneficio) : Number.NaN;
    if (!Number.isFinite(inversionNumero) || inversionNumero < 0) {
      toast.error("Registra la inversión estimada. Si no tiene costo, escribe 0.");
      return;
    }
    if (!Number.isFinite(beneficioNumero) || beneficioNumero < 0) {
      toast.error("Registra el beneficio anual objetivo. Si aún no lo sabes, cuantifica primero el caso.");
      return;
    }

    startTransition(async () => {
      const respuesta = await crearIniciativaMejora({
        proyectoId,
        hallazgoIds: seleccionados,
        titulo,
        descripcion: "",
        hipotesis,
        resultadoEsperado: resultado,
        criterioExito: criterio,
        prioridad: 1,
        responsable,
        fechaInicio: inicio,
        fechaObjetivo: objetivo,
        inversionEstimada: inversionNumero,
        beneficioAnualObjetivo: beneficioNumero,
        moneda: "COP",
      });
      if (respuesta.error) { toast.error(respuesta.error); return; }
      toast.success("Iniciativa creada y vinculada a la evidencia.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus />Crear iniciativa</Button>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Nueva iniciativa de mejora</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label>Título *</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Hallazgos que resolverá *</Label><div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">{hallazgos.map((hallazgo) => <label key={hallazgo.id} className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={seleccionados.includes(hallazgo.id)} onChange={() => alternar(hallazgo.id)} /><span>{hallazgo.titulo}</span></label>)}</div></div>
          <div className="space-y-2 sm:col-span-2"><Label>Hipótesis de intervención *</Label><Textarea rows={3} value={hipotesis} onChange={(e) => setHipotesis(e.target.value)} placeholder="Si hacemos…, entonces mejorará…, porque…" /></div>
          <div className="space-y-2"><Label>Resultado esperado *</Label><Input value={resultado} onChange={(e) => setResultado(e.target.value)} /></div>
          <div className="space-y-2"><Label>Criterio de éxito *</Label><Input value={criterio} onChange={(e) => setCriterio(e.target.value)} /></div>
          <div className="space-y-2"><Label>Responsable</Label><Input value={responsable} onChange={(e) => setResponsable(e.target.value)} /></div>
          <div className="space-y-2"><Label>Inversión estimada *</Label><Input type="number" min="0" value={inversion} onChange={(e) => setInversion(e.target.value)} /><p className="text-xs text-muted-foreground">Usa 0 solo si confirmaste que no hay inversión.</p></div>
          <div className="space-y-2"><Label>Beneficio anual objetivo *</Label><Input type="number" min="0" value={beneficio} onChange={(e) => setBeneficio(e.target.value)} /><p className="text-xs text-muted-foreground">No se copia del impacto total; define cuánto capturará esta iniciativa.</p></div>
          <div />
          <div className="space-y-2"><Label>Fecha de inicio</Label><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
          <div className="space-y-2"><Label>Fecha objetivo</Label><Input type="date" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} /></div>
          <Button className="sm:col-span-2" disabled={pending} onClick={guardar}>{pending ? "Creando…" : "Crear caso de mejora"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccionForm({ proyectoId, iniciativaId, buttonText }: { proyectoId: string; iniciativaId: string; buttonText?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");

  function guardar() {
    startTransition(async () => {
      const respuesta = await crearAccionMejora({ proyectoId, iniciativaId, titulo, descripcion: "", responsable, fechaObjetivo: fecha });
      if (respuesta.error) { toast.error(respuesta.error); return; }
      toast.success("Acción asignada."); setOpen(false); router.refresh();
    });
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button size="sm" variant={buttonText ? "default" : "outline"}><Plus />{buttonText ?? "Acción"}</Button>} /><DialogContent><DialogHeader><DialogTitle>Asignar acción</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Qué se debe hacer *</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div><div className="space-y-2"><Label>Responsable *</Label><Input value={responsable} onChange={(e) => setResponsable(e.target.value)} /></div><div className="space-y-2"><Label>Fecha objetivo</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div><Button className="w-full" disabled={pending} onClick={guardar}>Guardar acción</Button></div></DialogContent></Dialog>;
}

function MedicionForm({ proyectoId, iniciativaId, tipoInicial = "seguimiento", buttonText = "Medir" }: { proyectoId: string; iniciativaId: string; tipoInicial?: "linea_base" | "seguimiento" | "cierre"; buttonText?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<"linea_base" | "seguimiento" | "cierre">(tipoInicial);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [beneficio, setBeneficio] = useState("");
  const [costo, setCosto] = useState("");
  const [fuente, setFuente] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [validado, setValidado] = useState(false);

  function guardar() {
    if (!fecha || !beneficio.trim() || !costo.trim() || !fuente.trim()) {
      toast.error("Completa fecha, resultado, costo acumulado y fuente. Escribe 0 si el valor es cero.");
      return;
    }

    startTransition(async () => {
      const respuesta = await crearMedicionImpacto({ proyectoId, iniciativaId, tipo, fecha, beneficioAnualRealizado: numero(beneficio), costoAcumulado: numero(costo), valorIndicador: null, unidadIndicador: "", fuenteDatos: fuente, observaciones, validadoCliente: validado });
      if (respuesta.error) { toast.error(respuesta.error); return; }
      toast.success("Resultado registrado."); setOpen(false); router.refresh();
    });
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button size="sm" variant={buttonText === "Medir" ? "outline" : "default"}><Target />{buttonText}</Button>} /><DialogContent><DialogHeader><DialogTitle>Registrar resultado</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Tipo</Label><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}><option value="linea_base">Línea base</option><option value="seguimiento">Seguimiento</option><option value="cierre">Cierre</option></select></div><div className="space-y-2"><Label>Fecha</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div><div className="space-y-2"><Label>Resultado anualizado (admite pérdidas) *</Label><Input type="number" step="any" value={beneficio} onChange={(e) => setBeneficio(e.target.value)} /></div><div className="space-y-2"><Label>Costo acumulado *</Label><Input type="number" min="0" value={costo} onChange={(e) => setCosto(e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label>Fuente de datos *</Label><Input value={fuente} onChange={(e) => setFuente(e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label>Observaciones</Label><Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></div><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={validado} onChange={(e) => setValidado(e.target.checked)} />Marcar como confirmado por el cliente</label><p className="text-xs text-muted-foreground sm:col-span-2">Este registro no conserva todavía identidad ni evidencia de la aprobación; el tablero lo etiqueta según esta declaración.</p><Button className="sm:col-span-2" disabled={pending} onClick={guardar}>Guardar medición</Button></div></DialogContent></Dialog>;
}

function AccionEstadoControl({ accion, pending, onGuardar }: {
  accion: Accion;
  pending: boolean;
  onGuardar: (accionId: string, estado: EstadoAccionMejora, evidencia: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [evidencia, setEvidencia] = useState(accion.evidencia_resultado ?? "");

  function elegirEstado(nuevoEstado: EstadoAccionMejora) {
    if (nuevoEstado === "completada") {
      setOpen(true);
      return;
    }
    onGuardar(accion.id, nuevoEstado, "");
  }

  return <>
    <select aria-label={`Estado de la acción ${accion.titulo}`} disabled={pending} className="h-8 rounded-md border bg-background px-2 text-xs" value={accion.estado} onChange={(e) => elegirEstado(e.target.value as EstadoAccionMejora)}>
      {Object.entries(ESTADO_ACCION_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Evidencia para completar la acción</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{accion.titulo}</p>
        <div className="space-y-2"><Label htmlFor={`evidencia-${accion.id}`}>Qué se hizo y cómo se comprobó *</Label><Textarea id={`evidencia-${accion.id}`} rows={4} value={evidencia} onChange={(e) => setEvidencia(e.target.value)} /></div>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={pending || evidencia.trim().length < 3} onClick={() => { onGuardar(accion.id, "completada", evidencia); setOpen(false); }}>Guardar evidencia</Button></div>
      </DialogContent>
    </Dialog>
  </>;
}

export function PlanMejoraWorkspace(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { proyectoId, hallazgos, cuantificaciones, iniciativas, enlaces, acciones, mediciones } = props;
  const seriesImpacto = useMemo(
    () => prepararSeriesImpacto(iniciativas, mediciones),
    [iniciativas, mediciones],
  );
  const iniciativasActivas = iniciativas.filter(
    (iniciativa) => ["priorizada", "en_ejecucion", "bloqueada"].includes(iniciativa.estado),
  );
  const hallazgosCuantificados = new Set(cuantificaciones.map((fila) => fila.hallazgo_id)).size;
  const iniciativasConMedicionValidada = iniciativas.filter((iniciativa) =>
    ultimaMedicionAnualValidada(mediciones.filter((medicion) => medicion.iniciativa_id === iniciativa.id)),
  ).length;
  const primeraIniciativaVigente = iniciativas.find((iniciativa) => iniciativa.estado !== "descartada");
  const iniciativaSinAcciones = iniciativas.find((iniciativa) =>
    iniciativa.estado !== "descartada" && !acciones.some((accion) => accion.iniciativa_id === iniciativa.id),
  );
  const iniciativaSinMedicion = iniciativas.find((iniciativa) =>
    iniciativa.estado !== "descartada" && !mediciones.some((medicion) => medicion.iniciativa_id === iniciativa.id),
  );
  const iniciativaSinSeguimientoValidado = iniciativas.find((iniciativa) =>
    iniciativa.estado !== "descartada" && !ultimaMedicionAnualValidada(
      mediciones.filter((medicion) => medicion.iniciativa_id === iniciativa.id),
    ),
  );
  const siguienteTitulo = !hallazgos.length
    ? "Valida un hallazgo del diagnóstico para empezar."
    : !cuantificaciones.length
      ? "Cuantifica un hallazgo pendiente con fuente y supuestos."
      : !primeraIniciativaVigente
        ? "Convierte el impacto en una iniciativa específica."
        : iniciativaSinAcciones
          ? "Asigna una acción concreta y su responsable."
          : iniciativaSinMedicion
            ? "Registra la línea base antes de intervenir."
            : iniciativaSinSeguimientoValidado
              ? "Registra un seguimiento para revisar el cambio."
              : "Revisa el estado, la evidencia y el resultado del plan.";
  const siguienteBoton = !hallazgos.length
    ? <Button render={<Link href={`/proyectos/${proyectoId}/hallazgos`} />}>Abrir hallazgos</Button>
    : !cuantificaciones.length
      ? <Button render={<a href="#hallazgos" />}>Ir al primer hallazgo</Button>
      : !primeraIniciativaVigente
        ? <IniciativaForm proyectoId={proyectoId} hallazgos={hallazgos} />
        : iniciativaSinAcciones
          ? <AccionForm proyectoId={proyectoId} iniciativaId={iniciativaSinAcciones.id} buttonText="Asignar primera acción" />
          : iniciativaSinMedicion
            ? <MedicionForm key={`${iniciativaSinMedicion.id}-base`} proyectoId={proyectoId} iniciativaId={iniciativaSinMedicion.id} tipoInicial="linea_base" buttonText="Registrar línea base" />
            : iniciativaSinSeguimientoValidado
              ? <MedicionForm key={`${iniciativaSinSeguimientoValidado.id}-seguimiento`} proyectoId={proyectoId} iniciativaId={iniciativaSinSeguimientoValidado.id} tipoInicial="seguimiento" buttonText="Registrar seguimiento" />
              : <Button variant="outline" render={<a href="#iniciativas" />}>Ver iniciativas y resultados</Button>;

  function cambiarIniciativa(iniciativaId: string, estado: EstadoIniciativa) {
    startTransition(async () => {
      const respuesta = await actualizarEstadoIniciativa({ proyectoId, iniciativaId, estado });
      if (respuesta.error) { toast.error(respuesta.error); return; }
      router.refresh();
    });
  }

  function cambiarAccion(accionId: string, estado: EstadoAccionMejora, evidencia: string) {
    startTransition(async () => {
      const respuesta = await actualizarEstadoAccion({ proyectoId, accionId, estado, evidenciaResultado: evidencia });
      if (respuesta.error) { toast.error(respuesta.error); return; }
      router.refresh();
    });
  }

  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-3">
      {[
        { label: "Hallazgos con cuantificación", value: hallazgosCuantificados, icon: Target },
        { label: "Iniciativas priorizadas o en curso", value: iniciativasActivas.length, icon: ListChecks },
        { label: "Iniciativas con seguimiento marcado como validado", value: iniciativasConMedicionValidada, icon: CheckCircle2 },
      ].map((item) => <Card key={item.label} size="sm"><CardContent><item.icon className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">{item.label}</p><p className="mt-1 text-lg font-semibold">{item.value}</p></CardContent></Card>)}
    </section>

    <Card className="border-primary/25 bg-primary/[0.03]"><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Haz esto ahora</p><p className="mt-1 font-semibold">{siguienteTitulo}</p><p className="mt-1 text-xs text-muted-foreground">Los componentes de impacto e iniciativas pueden solaparse; revisa su fuente antes de atribuir resultados.</p></div>{siguienteBoton}</CardContent></Card>

    {seriesImpacto.map(({ moneda: codigoMoneda, datos }) => <Card key={codigoMoneda}><CardHeader><CardTitle>Objetivo anual frente a seguimiento registrado · {codigoMoneda}</CardTitle><p className="text-sm text-muted-foreground">No incluye borradores, iniciativas descartadas ni líneas base. Solo grafica seguimientos marcados como validados; cifras separadas por moneda.</p></CardHeader><CardContent><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={datos} margin={{ left: 8, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nombre" tick={{ fontSize: 11 }} /><YAxis tickFormatter={(valor) => moneda(Number(valor), codigoMoneda)} width={90} tick={{ fontSize: 11 }} /><Tooltip formatter={(valor) => valor == null ? "Sin medición" : moneda(Number(valor), codigoMoneda)} /><Bar dataKey="objetivo" name="Objetivo anual" fill="var(--primary)" radius={[4,4,0,0]} /><Bar dataKey="realizado" name="Seguimiento anualizado" fill="var(--secondary)" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>)}

    <section id="hallazgos" className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">1. Problemas e impacto económico</h2>
        <p className="text-sm text-muted-foreground">Cada componente conserva fórmula, fuente, supuestos y confianza. No se presenta una suma que pueda ocultar solapamientos.</p>
      </div>
      {hallazgos.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Primero valida hallazgos del diagnóstico.</p> :
        <div className="grid gap-3 lg:grid-cols-2">
          {hallazgos.map((hallazgo) => {
            const filas = cuantificaciones.filter((fila) => fila.hallazgo_id === hallazgo.id);
            return <Card key={hallazgo.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div><CardTitle>{hallazgo.titulo}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Impacto {hallazgo.impacto}/5 · Esfuerzo {hallazgo.esfuerzo}/5</p></div>
                <CuantificacionForm proyectoId={proyectoId} hallazgo={hallazgo} />
              </CardHeader>
              <CardContent>
                {filas.length === 0 ? <p className="text-sm text-muted-foreground">Aún no tiene una cifra defendible.</p> :
                  <div className="space-y-2">{filas.map((fila) => <div key={fila.id} className="rounded-lg bg-muted/50 p-3 text-xs">
                    <div className="flex justify-between gap-3"><span className="font-medium">{fila.nombre}</span><span>{moneda(Number(fila.impacto_anual), fila.moneda)}</span></div>
                    <p className="mt-1 text-muted-foreground">{IMPACTO_LABEL[fila.tipo]} · confianza {fila.confianza} · {fila.validado_cliente ? "marcado como confirmado por el cliente" : "pendiente de confirmación del cliente"}</p>
                  </div>)}</div>}
              </CardContent>
            </Card>;
          })}
        </div>}
    </section>

    <section id="iniciativas" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-base font-semibold">2. Iniciativas y ejecución</h2><p className="text-sm text-muted-foreground">Del caso de negocio a acciones con dueño y fecha.</p></div>
        {cuantificaciones.length > 0 && <IniciativaForm proyectoId={proyectoId} hallazgos={hallazgos} />}
      </div>
      <p className="text-xs text-muted-foreground">ROI y payback están ocultos porque aún no se registran costos recurrentes ni flujos comparables.</p>
      {iniciativas.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Cuantifica primero un hallazgo y define el beneficio específico de la iniciativa.</p> :
        <div className="space-y-4">{iniciativas.map((iniciativa) => {
          const accionesIniciativa = acciones.filter((accion) => accion.iniciativa_id === iniciativa.id);
          const medicionesIniciativa = mediciones.filter((medicion) => medicion.iniciativa_id === iniciativa.id);
          const nombresHallazgos = enlaces.filter((enlace) => enlace.iniciativa_id === iniciativa.id)
            .map((enlace) => hallazgos.find((hallazgo) => hallazgo.id === enlace.hallazgo_id)?.titulo)
            .filter(Boolean);
          const ultima = [...medicionesIniciativa].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.created_at.localeCompare(a.created_at))[0];
          const ultimaComparable = ultimaMedicionAnualValidada(medicionesIniciativa);
          return <Card key={iniciativa.id}>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><CardTitle>{iniciativa.titulo}</CardTitle><Badge>{ESTADO_INICIATIVA_LABEL[iniciativa.estado]}</Badge></div>
                  <p className="mt-2 text-sm text-muted-foreground">{iniciativa.hipotesis}</p>
                  <p className="mt-2 text-xs">Resuelve: {nombresHallazgos.join(" · ")}</p>
                </div>
                <select aria-label={`Estado de ${iniciativa.titulo}`} disabled={pending} className="h-9 rounded-md border bg-background px-3 text-sm" value={iniciativa.estado} onChange={(e) => cambiarIniciativa(iniciativa.id, e.target.value as EstadoIniciativa)}>
                  {Object.entries(ESTADO_INICIATIVA_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Inversión estimada</p><p className="font-semibold">{moneda(Number(iniciativa.inversion_estimada), iniciativa.moneda)}</p></div>
                <div><p className="text-xs text-muted-foreground">Beneficio anual objetivo · proyección</p><p className="font-semibold">{moneda(Number(iniciativa.beneficio_anual_objetivo), iniciativa.moneda)}</p></div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Acciones</p><AccionForm proyectoId={proyectoId} iniciativaId={iniciativa.id} /></div>
                {accionesIniciativa.length === 0 ? <p className="text-sm text-muted-foreground">Sin acciones asignadas.</p> :
                  <div className="space-y-2">{accionesIniciativa.map((accion) => <div key={accion.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-sm font-medium">{accion.orden}. {accion.titulo}</p><p className="text-xs text-muted-foreground">{accion.responsable}{accion.fecha_objetivo ? ` · ${accion.fecha_objetivo}` : ""}</p></div>
                    <AccionEstadoControl accion={accion} pending={pending} onGuardar={cambiarAccion} />
                  </div>)}</div>}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div><p className="text-sm font-semibold">Resultados</p>
                    {ultimaComparable && <p className="text-xs text-muted-foreground">Seguimiento anualizado {ultimaComparable.fecha}: {moneda(Number(ultimaComparable.beneficio_anual_realizado), iniciativa.moneda)} · marcado como confirmado por el cliente</p>}
                    {!ultimaComparable && ultima && <p className="text-xs text-muted-foreground">Último registro {ultima.fecha}: {ultima.tipo === "linea_base" ? "línea base" : "seguimiento sin marca de confirmación"}. No se presenta como beneficio logrado.</p>}
                  </div>
                  <MedicionForm proyectoId={proyectoId} iniciativaId={iniciativa.id} />
                </div>
                {medicionesIniciativa.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay línea base ni seguimiento.</p>}
              </div>
            </CardContent>
          </Card>;
        })}</div>}
    </section>
  </div>;
}
