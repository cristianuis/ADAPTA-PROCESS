import { AlignmentType, Document, Footer, HeadingLevel, PageNumber, Paragraph, TextRun } from "docx";
import type { DatosInforme360 } from "@/lib/documentos/datos-informe-360";
import { hallazgoConSoporteRevisado } from "@/lib/evidencia/hallazgo-con-soporte";

function texto(contenido: string, opciones?: { bold?: boolean; color?: string }) {
  return new Paragraph({ spacing: { after: 110 }, children: [new TextRun({ text: contenido, ...opciones })] });
}

function titulo(contenido: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 130 }, children: [new TextRun(contenido)] });
}

function subtitulo(contenido: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 180, after: 90 }, children: [new TextRun(contenido)] });
}

function linea(etiqueta: string, valor: string) {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `${etiqueta}: `, bold: true }), new TextRun(valor)] });
}

export function generarInforme360(datos: DatosInforme360, sintesisConsultor: string): Document {
  const revisados = datos.hallazgos.filter(hallazgoConSoporteRevisado);
  const pendientes = datos.hallazgos.length - revisados.length;
  const disenosValidados = datos.disenos.filter((d) => d.estado === "validado");
  const nombreHallazgo = new Map(datos.hallazgos.map((h) => [h.id, h.titulo]));
  const fecha = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

  const contenido: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 220 }, children: [new TextRun({ text: "INFORME 360° DE INTERVENCIÓN", bold: true, size: 38, color: "18447A" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: datos.cliente.razon_social, size: 26 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(datos.proyecto.nombre)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 320 }, children: [new TextRun(fecha)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun(`Preparado por ${datos.consultor.nombre} · NEXUS IA PROCESS`)] }),
    new Paragraph({ pageBreakBefore: true, children: [] }),

    titulo("1. Síntesis revisada por el consultor"),
    ...sintesisConsultor.split(/\n\s*\n/).filter(Boolean).map((p) => texto(p)),
    texto("Este informe distingue observación, propuesta y resultado. La validación del diseño corresponde al consultor; no equivale por sí sola a aprobación del cliente.", { color: "555555" }),

    titulo("2. Alcance y fuentes"),
    linea("Empresa", datos.cliente.razon_social),
    linea("Intervención", datos.proyecto.nombre),
    linea("Entrevistas registradas", String(datos.entrevistas.length)),
    linea("Evaluaciones PEMM respondidas", String(datos.cobertura.evaluacionesPemmRespondidas)),
    linea("Hallazgos revisados / pendientes", `${revisados.length} / ${pendientes}`),
    linea("Procesos AS-IS con actividades", String(datos.cobertura.procesosConActividades)),
    linea("Diseños TO-BE validados", String(datos.cobertura.disenosTobeValidados)),
    ...datos.entrevistas.map((e) => texto(`Entrevista: ${e.entrevistado_cargo ?? "rol no informado"} · ${e.fecha ?? "fecha no registrada"} · ${e.estado}`)),

    titulo("3. Diagnóstico y madurez"),
    texto(datos.triage
      ? `Triage: arquetipo ${datos.triage.arquetipo_sugerido}; puntaje interno ${datos.triage.puntaje_total}. Es una clasificación de entrada, no una medida global de madurez.`
      : "No existe triage registrado."),
    ...datos.evaluacionesPemm.filter((e) => e.estado === "respondida").map((e) =>
      texto(`PEMM ${e.tipo}${e.proceso_evaluado ? ` · ${e.proceso_evaluado}` : ""}: nivel registrado ${e.nivel_resultante ?? "no concluido"}. El nivel corresponde a esta evaluación y no se promedia con otras; revisar sus evidencias antes de citarlo como conclusión.`)),

    titulo("4. Hallazgos sustentados"),
    ...revisados.flatMap((h, i) => [
      subtitulo(`${i + 1}. ${h.titulo}`),
      linea("Clasificación", `${h.categoria ?? "Sin categoría"} · impacto ${h.impacto}/5 · esfuerzo ${h.esfuerzo}/5`),
      linea("Fuente", `${h.fuente} · ${h.estado_evidencia === "cita_verificada" ? "cita cotejada" : "revisión del consultor"}`),
      texto(`Soporte: ${h.cita_soporte ?? "No localizado"}`),
      ...(h.descripcion ? [texto(h.descripcion)] : []),
    ]),
    ...(pendientes > 0 ? [texto(`${pendientes} hallazgo(s) sin revisión suficiente se excluyen de las conclusiones y requieren verificación adicional.`)] : []),

    titulo("5. Procesos AS-IS registrados por el consultor"),
    ...datos.procesos.flatMap((proceso) => {
      const actividades = datos.actividades.filter((a) => a.proceso_id === proceso.id).sort((a, b) => a.orden - b.orden);
      const sipoc = datos.sipoc.find((s) => s.proceso_id === proceso.id);
      return [
        subtitulo(proceso.nombre),
        linea("Dueño y alcance", `${proceso.dueno_nombre ?? "No asignado"}; ${proceso.alcance_inicio ?? "inicio no definido"} → ${proceso.alcance_fin ?? "fin no definido"}`),
        ...(sipoc ? [
          linea("SIPOC · proveedores", (sipoc.proveedores ?? []).join("; ") || "No registrados"),
          linea("SIPOC · entradas", (sipoc.entradas ?? []).join("; ") || "No registradas"),
          linea("SIPOC · salidas", (sipoc.salidas ?? []).join("; ") || "No registradas"),
          linea("SIPOC · clientes del proceso", (sipoc.clientes ?? []).join("; ") || "No registrados"),
        ] : []),
        ...actividades.map((a) => texto(`${a.orden}. ${a.nombre} · ${a.rol_responsable ?? "sin rol"}${a.tiempo_estimado_min ? ` · ${a.tiempo_estimado_min} min estimados` : ""}${a.descripcion ? ` — ${a.descripcion}` : ""}`)),
        ...(actividades.length ? [] : [texto("Sin actividades: proceso identificado, todavía no levantado.")]),
      ];
    }),

    titulo("6. Diseño TO-BE validado"),
    ...disenosValidados.flatMap((diseno) => {
      const nombreProceso = datos.procesos.find((p) => p.id === diseno.proceso_id)?.nombre ?? "Proceso";
      return [
        subtitulo(nombreProceso),
        linea("Objetivo", diseno.objetivo),
        linea("Criterio de piloto", diseno.criterio_validacion),
        linea("Decisiones y exclusiones", diseno.decisiones),
        ...datos.pasos.filter((p) => p.diseno_id === diseno.id).sort((a, b) => a.orden - b.orden).map((p) =>
          texto(`${p.orden}. ${p.nombre} · ${p.responsable} · ${p.tipo_cambio} · ${p.automatizacion === "candidata" ? "oportunidad de automatización (no implementada)" : p.automatizacion}. ${p.cambio}${p.hallazgo_id ? ` Soporte: ${nombreHallazgo.get(p.hallazgo_id) ?? "hallazgo vinculado"}.` : ""}`)),
      ];
    }),
    ...(datos.disenos.some((d) => d.estado === "borrador") ? [texto("Los diseños en borrador quedan excluidos de la propuesta validada.")] : []),

    titulo("7. Indicadores y método de seguimiento"),
    ...datos.indicadores.map((ind) => texto(`${ind.nombre} · ${ind.sentido.replaceAll("_", " ")} · ${ind.unidad ?? "unidad no definida"}. Fórmula: ${ind.formula ?? "pendiente"}; fuente: ${ind.fuente_datos}; captura: ${ind.mecanismo_captura}; responsable: ${ind.responsable ?? "pendiente"}.`)),

    titulo("8. Roadmap de mejora"),
    ...datos.iniciativas.flatMap((ini) => [
      subtitulo(`${ini.titulo} · prioridad ${ini.prioridad} · ${ini.estado}`),
      linea("Hipótesis", ini.hipotesis),
      linea("Éxito esperado", ini.criterio_exito),
      linea("Responsable / plazo", `${ini.responsable ?? "pendiente"} / ${ini.fecha_objetivo ?? "sin fecha"}`),
      linea("Hallazgos vinculados", datos.enlaces.filter((e) => e.iniciativa_id === ini.id).map((e) => nombreHallazgo.get(e.hallazgo_id) ?? "no disponible").join("; ") || "Ninguno"),
      ...datos.acciones.filter((a) => a.iniciativa_id === ini.id).map((a) => texto(`Acción ${a.orden}: ${a.titulo} · ${a.responsable} · ${a.estado} · ${a.fecha_objetivo ?? "sin fecha"}`)),
    ]),

    titulo("9. Resultados medidos y límites"),
    ...datos.mediciones.filter((m) => m.validado_cliente).map((m) => texto(`${m.tipo} · ${m.fecha} · valor indicador ${m.valor_indicador ?? "no informado"} ${m.unidad_indicador ?? ""} · fuente declarada: ${m.fuente_datos}. Beneficio anual registrado: ${m.beneficio_anual_realizado} (verificar atribución y moneda con la iniciativa). El consultor marcó esta medición como validada por cliente; NEXUS no conserva aún una aprobación independiente del cliente.`)),
    ...(datos.mediciones.some((m) => !m.validado_cliente) ? [texto("Existen mediciones sin marca de validación del cliente; no se presentan como resultados comprobados.")] : []),
    ...(!datos.mediciones.some((m) => m.validado_cliente) ? [texto("Aún no hay mediciones marcadas como validadas por el cliente. Las metas y proyecciones del roadmap no equivalen a beneficios realizados.")] : []),
    texto("Las oportunidades de automatización requieren análisis de datos, excepciones, control y factibilidad antes de construirse. Los tiempos declarados en AS-IS no son mediciones observadas salvo que su fuente lo indique."),
  ];

  return new Document({ sections: [{ properties: {}, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ["Página ", PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES] })] })] }) }, children: contenido }] });
}
