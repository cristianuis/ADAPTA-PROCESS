import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
  ShadingType,
  BorderStyle,
} from "docx";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import { DIMENSION_LABEL, DIMENSIONES_PROCESO, DIMENSIONES_EMPRESA, type Dimension } from "@/lib/pemm/descriptores";
import type { Database, Arquetipo } from "@/lib/supabase/types";

type Consultor = Database["public"]["Tables"]["consultores"]["Row"];
type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
type Proyecto = Database["public"]["Tables"]["proyectos"]["Row"];
type Triage = Database["public"]["Tables"]["triage_respuestas"]["Row"];
type PemmEvaluacion = Database["public"]["Tables"]["pemm_evaluaciones"]["Row"];
type Hallazgo = Database["public"]["Tables"]["hallazgos"]["Row"];

export interface DatosInformeDiagnostico {
  consultor: Consultor;
  cliente: Cliente;
  proyecto: Proyecto;
  triage: Triage | null;
  evaluacionesPemm: PemmEvaluacion[];
  hallazgos: Hallazgo[];
  resumenEjecutivo: string;
}

const HOY = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

function heading(texto: string, color: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text: texto, color: color.replace("#", ""), bold: true })],
  });
}

function celda(texto: string, opts: { bold?: boolean; shade?: string } = {}) {
  return new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade.replace("#", "") } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text: texto, bold: opts.bold })] })],
  });
}

export function generarInformeDiagnostico(datos: DatosInformeDiagnostico): Document {
  const { consultor, cliente, proyecto, triage, evaluacionesPemm, hallazgos, resumenEjecutivo } = datos;
  const colorPrimario = consultor.color_primario || "#1A4731";

  const seccionesPemm = evaluacionesPemm
    .filter((ev) => ev.estado === "respondida")
    .flatMap((ev) => {
      const dims: Dimension[] = ev.tipo === "proceso" ? DIMENSIONES_PROCESO : DIMENSIONES_EMPRESA;
      const titulo = ev.tipo === "proceso" ? `Proceso: ${ev.proceso_evaluado ?? "sin nombre"}` : "Capacidades de empresa";
      return [
        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun(titulo)] }),
        new Paragraph({ children: [new TextRun(`Nivel resultante (mínimo de sus dimensiones): ${ev.nivel_resultante ?? "—"}`)] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [celda("Dimensión", { bold: true, shade: colorPrimario }), celda("Nivel (1-4)", { bold: true, shade: colorPrimario })] }),
            ...dims.map(
              (d) =>
                new TableRow({
                  children: [celda(DIMENSION_LABEL[d]), celda(String(ev[d] ?? "—"))],
                }),
            ),
          ],
        }),
      ];
    });

  const tablaHallazgos =
    hallazgos.length > 0
      ? [
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun("Hallazgos principales")] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  celda("Hallazgo", { bold: true, shade: colorPrimario }),
                  celda("Categoría", { bold: true, shade: colorPrimario }),
                  celda("Impacto", { bold: true, shade: colorPrimario }),
                  celda("Esfuerzo", { bold: true, shade: colorPrimario }),
                ],
              }),
              ...hallazgos.map(
                (h) =>
                  new TableRow({
                    children: [celda(h.titulo), celda(h.categoria ?? "—"), celda(String(h.impacto)), celda(String(h.esfuerzo))],
                  }),
              ),
            ],
          }),
        ]
      : [];

  const infoArquetipo = triage ? ARQUETIPO_INFO[triage.arquetipo_sugerido as Arquetipo] : null;

  return new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: consultor.empresa || consultor.nombre, size: 18, color: "6B7268" })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: ["Página ", PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES], size: 18 }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Portada
          new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Informe de Diagnóstico Organizacional", bold: true, size: 40, color: colorPrimario.replace("#", "") })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: cliente.razon_social, size: 28 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: proyecto.nombre, size: 22, color: "6B7268" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: HOY, size: 20 })] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            border: { top: { style: BorderStyle.NONE, size: 0, color: "auto" } },
            children: [new TextRun({ text: `Preparado por ${consultor.nombre}${consultor.empresa ? " — " + consultor.empresa : ""}`, size: 18, color: "6B7268" })],
          }),
          new Paragraph({ pageBreakBefore: true, children: [] }),

          // Resumen ejecutivo
          heading("Resumen ejecutivo", colorPrimario),
          ...resumenEjecutivo.split("\n\n").map((parrafo) => new Paragraph({ spacing: { after: 150 }, children: [new TextRun(parrafo)] })),

          // Arquetipo / triage
          heading("Diagnóstico de triage", colorPrimario),
          triage && infoArquetipo
            ? new Paragraph({
                spacing: { after: 150 },
                children: [
                  new TextRun({ text: `${infoArquetipo.titulo} (puntaje ${triage.puntaje_total}). `, bold: true }),
                  new TextRun(infoArquetipo.descripcion),
                ],
              })
            : new Paragraph({ children: [new TextRun("No se aplicó triage a este proyecto.")] }),
          ...(triage?.alerta_gobierno
            ? [
                new Paragraph({
                  spacing: { after: 150 },
                  children: [
                    new TextRun({
                      text: "Alerta: se detectaron señales de que el problema real podría ser de gobierno societario, no de procesos.",
                      italics: true,
                      color: "B3261E",
                    }),
                  ],
                }),
              ]
            : []),

          // PEMM
          ...(seccionesPemm.length > 0
            ? [heading("Diagnóstico de madurez (PEMM)", colorPrimario), ...seccionesPemm]
            : []),

          // Hallazgos
          ...tablaHallazgos,
        ],
      },
    ],
  });
}
