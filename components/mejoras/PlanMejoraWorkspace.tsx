"use client";

import { useMemo, useState, useTransition } from "react";
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
import { calcularAvanceBeneficio, calcularImpactoAnual } from "@/lib/mejoras/calcular-impacto";
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

function IniciativaForm({ proyectoId, hallazgos, impactoTotal }: { proyectoId: string; hallazgos: Hallazgo[]; impactoTotal: number }) {
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
  const [inversion, setInversion] = useState("0");
  const [beneficio, setBeneficio] = useState(String(Math.round(impactoTotal)));

  function alternar(id: string) {
    setSeleccionados((actual) => actual.includes(id) ? actual.filter((valor) => valor !== id) : [...actual, id]);
  }

  function guardar() {
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
        inversionEstimada: numero(inversion),
        beneficioAnualObjetivo: numero(beneficio),
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
          <div className="space-y-2"><Label>Inversión estimada</Label><Input type="number" min="0" value={inversion} onChange={(e) => setInversion(e.target.value)} /></div>
          <div className="space-y-2"><Label>Beneficio anual objetivo</Label><Input type="number" min="0" value={beneficio} onChange={(e) => setBeneficio(e.target.value)} /></div>
          <div />
          <div className="space-y-2"><Label>Fecha de inicio</Label><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
          <div className="space-y-2"><Label>Fecha objetivo</Label><Input type="date" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} /></div>
          <Button className="sm:col-span-2" disabled={pending} onClick={guardar}>{pending ? "Creando…" : "Crear caso de mejora"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccionForm({ proyectoId, iniciativaId }: { proyectoId: string; iniciativaId: string }) {
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

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button size="sm" variant="outline"><Plus />Acción</Button>} /><DialogContent><DialogHeader><DialogTitle>Asignar acción</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Qué se debe hacer *</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div><div className="space-y-2"><Label>Responsable *</Label><Input value={responsable} onChange={(e) => setResponsable(e.target.value)} /></div><div className="space-y-2"><Label>Fecha objetivo</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div><Button className="w-full" disabled={pending} onClick={guardar}>Guardar acción</Button></div></DialogContent></Dialog>;
}

function MedicionForm({ proyectoId, iniciativaId }: { proyectoId: string; iniciativaId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<"linea_base" | "seguimiento" | "cierre">("seguimiento");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [beneficio, setBeneficio] = useState("0");
  const [costo, setCosto] = useState("0");
  const [fuente, setFuente] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [validado, setValidado] = useState(false);

  function guardar() {
    startTransition(async () => {
      const respuesta = await crearMedicionImpacto({ proyectoId, iniciativaId, tipo, fecha, beneficioAnualRealizado: numero(beneficio), costoAcumulado: numero(costo), valorIndicador: null, unidadIndicador: "", fuenteDatos: fuente, observaciones, validadoCliente: validado });
      if (respuesta.error) { toast.error(respuesta.error); return; }
      toast.success("Resultado registrado."); setOpen(false); router.refresh();
    });
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button size="sm" variant="outline"><Target />Medir</Button>} /><DialogContent><DialogHeader><DialogTitle>Registrar resultado</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Tipo</Label><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}><option value="linea_base">Línea base</option><option value="seguimiento">Seguimiento</option><option value="cierre">Cierre</option></select></div><div className="space-y-2"><Label>Fecha</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div><div className="space-y-2"><Label>Beneficio anual realizado</Label><Input type="number" min="0" value={beneficio} onChange={(e) => setBeneficio(e.target.value)} /></div><div className="space-y-2"><Label>Costo acumulado</Label><Input type="number" min="0" value={costo} onChange={(e) => setCosto(e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label>Fuente de datos *</Label><Input value={fuente} onChange={(e) => setFuente(e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label>Observaciones</Label><Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></div><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={validado} onChange={(e) => setValidado(e.target.checked)} />Resultado validado con el cliente</label><Button className="sm:col-span-2" disabled={pending} onClick={guardar}>Guardar medición</Button></div></DialogContent></Dialog>;
}

export function PlanMejoraWorkspace(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { proyectoId, hallazgos, cuantificaciones, iniciativas, enlaces, acciones, mediciones } = props;
  const impactoTotal = cuantificaciones.reduce((total, fila) => total + Number(fila.impacto_anual), 0);
  const beneficioObjetivo = iniciativas.reduce((total, fila) => total + Number(fila.beneficio_anual_objetivo), 0);
  const inversionTotal = iniciativas.reduce((total, fila) => total + Number(fila.inversion_estimada), 0);
  const beneficioRealizado = iniciativas.reduce((total, iniciativa) => {
    const ultima = mediciones.filter((m) => m.iniciativa_id === iniciativa.id).at(-1);
    return total + Number(ultima?.beneficio_anual_realizado ?? 0);
  }, 0);
  const avance = calcularAvanceBeneficio(beneficioRealizado, beneficioObjetivo);

  const datosGrafica = useMemo(() => iniciativas.map((iniciativa) => {
    const ultima = mediciones.filter((medicion) => medicion.iniciativa_id === iniciativa.id).at(-1);
    return { nombre: iniciativa.titulo.slice(0, 24), objetivo: Number(iniciativa.beneficio_anual_objetivo), realizado: Number(ultima?.beneficio_anual_realizado ?? 0) };
  }), [iniciativas, mediciones]);

  function cambiarIniciativa(iniciativaId: string, estado: EstadoIniciativa) {
    startTransition(async () => {
      const respuesta = await actualizarEstadoIniciativa({ proyectoId, iniciativaId, estado });
      if (respuesta.error) { toast.error(respuesta.error); return; }
      router.refresh();
    });
  }

  function cambiarAccion(accionId: string, estado: EstadoAccionMejora) {
    const evidencia = estado === "completada" ? window.prompt("Describe la evidencia del resultado:") ?? "" : "";
    startTransition(async () => {
      const respuesta = await actualizarEstadoAccion({ proyectoId, accionId, estado, evidenciaResultado: evidencia });
      if (respuesta.error) { toast.error(respuesta.error); return; }
      router.refresh();
    });
  }

  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Impacto identificado", value: moneda(impactoTotal), icon: CircleDollarSign }, { label: "Beneficio objetivo", value: moneda(beneficioObjetivo), icon: Target }, { label: "Inversión estimada", value: moneda(inversionTotal), icon: ListChecks }, { label: "Beneficio realizado", value: `${moneda(beneficioRealizado)} · ${avance}%`, icon: CheckCircle2 }].map((item) => <Card key={item.label} size="sm"><CardContent><item.icon className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">{item.label}</p><p className="mt-1 text-lg font-semibold">{item.value}</p></CardContent></Card>)}
    </section>

    <Card className="border-primary/25 bg-primary/[0.03]"><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Haz esto ahora</p><p className="mt-1 font-semibold">{cuantificaciones.length === 0 ? "Cuantifica el primer problema con datos defendibles" : iniciativas.length === 0 ? "Convierte el impacto en una iniciativa" : acciones.length === 0 ? "Asigna la primera acción y responsable" : mediciones.length === 0 ? "Registra la línea base o el primer seguimiento" : "Revisa el avance y ajusta la ejecución"}</p></div>{cuantificaciones.length > 0 && <IniciativaForm proyectoId={proyectoId} hallazgos={hallazgos} impactoTotal={impactoTotal} />}</CardContent></Card>

    {datosGrafica.length > 0 && <Card><CardHeader><CardTitle>Objetivo frente a beneficio realizado</CardTitle></CardHeader><CardContent><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={datosGrafica} margin={{ left: 8, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nombre" tick={{ fontSize: 11 }} /><YAxis tickFormatter={(valor) => moneda(Number(valor))} width={75} tick={{ fontSize: 11 }} /><Tooltip formatter={(valor) => moneda(Number(valor))} /><Bar dataKey="objetivo" name="Objetivo" fill="var(--primary)" radius={[4,4,0,0]} /><Bar dataKey="realizado" name="Realizado" fill="var(--secondary)" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>}

    <section className="space-y-3"><div><h2 className="text-base font-semibold">1. Problemas e impacto económico</h2><p className="text-sm text-muted-foreground">Cada cifra conserva fórmula, fuente, supuestos y nivel de confianza.</p></div>{hallazgos.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Primero valida hallazgos del diagnóstico.</p> : <div className="grid gap-3 lg:grid-cols-2">{hallazgos.map((hallazgo) => { const filas = cuantificaciones.filter((fila) => fila.hallazgo_id === hallazgo.id); const total = filas.reduce((suma, fila) => suma + Number(fila.impacto_anual), 0); return <Card key={hallazgo.id}><CardHeader className="flex-row items-start justify-between"><div><CardTitle>{hallazgo.titulo}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Impacto {hallazgo.impacto}/5 · Esfuerzo {hallazgo.esfuerzo}/5</p></div><CuantificacionForm proyectoId={proyectoId} hallazgo={hallazgo} /></CardHeader><CardContent>{filas.length === 0 ? <p className="text-sm text-muted-foreground">Aún no tiene una cifra defendible.</p> : <div className="space-y-2"><p className="text-xl font-semibold text-primary">{moneda(total, filas[0].moneda)}</p>{filas.map((fila) => <div key={fila.id} className="rounded-lg bg-muted/50 p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-medium">{fila.nombre}</span><span>{moneda(Number(fila.impacto_anual), fila.moneda)}</span></div><p className="mt-1 text-muted-foreground">{IMPACTO_LABEL[fila.tipo]} · confianza {fila.confianza} · {fila.validado_cliente ? "validado" : "por validar"}</p></div>)}</div>}</CardContent></Card>; })}</div>}</section>

    <section className="space-y-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-semibold">2. Iniciativas y ejecución</h2><p className="text-sm text-muted-foreground">Del caso de negocio a acciones con dueño y fecha.</p></div>{cuantificaciones.length > 0 && <IniciativaForm proyectoId={proyectoId} hallazgos={hallazgos} impactoTotal={impactoTotal} />}</div>{iniciativas.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Cuantifica al menos un impacto y crea la iniciativa que lo capturará.</p> : <div className="space-y-4">{iniciativas.map((iniciativa) => { const accionesIniciativa = acciones.filter((accion) => accion.iniciativa_id === iniciativa.id); const medicionesIniciativa = mediciones.filter((medicion) => medicion.iniciativa_id === iniciativa.id); const nombresHallazgos = enlaces.filter((enlace) => enlace.iniciativa_id === iniciativa.id).map((enlace) => hallazgos.find((hallazgo) => hallazgo.id === enlace.hallazgo_id)?.titulo).filter(Boolean); const ultima = medicionesIniciativa.at(-1); return <Card key={iniciativa.id}><CardHeader className="border-b"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><CardTitle>{iniciativa.titulo}</CardTitle><Badge>{ESTADO_INICIATIVA_LABEL[iniciativa.estado]}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{iniciativa.hipotesis}</p><p className="mt-2 text-xs">Resuelve: {nombresHallazgos.join(" · ")}</p></div><select disabled={pending} className="h-9 rounded-md border bg-background px-3 text-sm" value={iniciativa.estado} onChange={(e) => cambiarIniciativa(iniciativa.id, e.target.value as EstadoIniciativa)}>{Object.entries(ESTADO_INICIATIVA_LABEL).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Inversión</p><p className="font-semibold">{moneda(Number(iniciativa.inversion_estimada), iniciativa.moneda)}</p></div><div><p className="text-xs text-muted-foreground">Beneficio objetivo</p><p className="font-semibold">{moneda(Number(iniciativa.beneficio_anual_objetivo), iniciativa.moneda)}</p></div><div><p className="text-xs text-muted-foreground">ROI · Payback</p><p className="font-semibold">{iniciativa.roi_estimado == null ? "—" : `${iniciativa.roi_estimado}%`} · {iniciativa.payback_meses == null ? "—" : `${iniciativa.payback_meses} meses`}</p></div></div><div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Acciones</p><AccionForm proyectoId={proyectoId} iniciativaId={iniciativa.id} /></div>{accionesIniciativa.length === 0 ? <p className="text-sm text-muted-foreground">Sin acciones asignadas.</p> : <div className="space-y-2">{accionesIniciativa.map((accion) => <div key={accion.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{accion.orden}. {accion.titulo}</p><p className="text-xs text-muted-foreground">{accion.responsable}{accion.fecha_objetivo ? ` · ${accion.fecha_objetivo}` : ""}</p></div><select className="h-8 rounded-md border bg-background px-2 text-xs" value={accion.estado} onChange={(e) => cambiarAccion(accion.id, e.target.value as EstadoAccionMejora)}>{Object.entries(ESTADO_ACCION_LABEL).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>)}</div>}</div><div><div className="mb-2 flex items-center justify-between"><div><p className="text-sm font-semibold">Resultados</p>{ultima && <p className="text-xs text-muted-foreground">Último: {moneda(Number(ultima.beneficio_anual_realizado), iniciativa.moneda)} · {ultima.validado_cliente ? "validado" : "por validar"}</p>}</div><MedicionForm proyectoId={proyectoId} iniciativaId={iniciativa.id} /></div>{medicionesIniciativa.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay línea base ni seguimiento.</p>}</div></CardContent></Card>; })}</div>}</section>
  </div>;
}
