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
} from "docx";
import { determinarMarcoMetodologico } from "@/lib/documentos/marco-metodologico";
import type { Database } from "@/lib/supabase/types";

type Consultor = Database["public"]["Tables"]["consultores"]["Row"];
type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
type Proyecto = Database["public"]["Tables"]["proyectos"]["Row"];
type Proceso = Database["public"]["Tables"]["procesos"]["Row"];
type Sipoc = Database["public"]["Tables"]["sipoc"]["Row"];
type Actividad = Database["public"]["Tables"]["actividades"]["Row"];
type Indicador = Database["public"]["Tables"]["indicadores"]["Row"];

export interface ProcesoCompleto {
  proceso: Proceso;
  sipoc: Sipoc | null;
  actividades: Actividad[];
  indicadores: Indicador[];
}

export interface DatosManualProcesos {
  consultor: Consultor;
  cliente: Cliente;
  proyecto: Proyecto;
  procesos: ProcesoCompleto[];
}

const HOY = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

function celda(texto: string, opts: { bold?: boolean; shade?: string } = {}) {
  return new TableCell({
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade.replace("#", "") } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text: texto, bold: opts.bold })] })],
  });
}

export function generarManualProcesos(datos: DatosManualProcesos): Document {
  const { consultor, cliente, proyecto, procesos } = datos;
  const colorPrimario = consultor.color_primario || "#1A4731";

  const marcoMetodologico = determinarMarcoMetodologico({
    tienePemm: false,
    tieneSipoc: procesos.some((p) => p.sipoc !== null),
    tieneProcesosClasificados: procesos.length > 0,
    tieneIndicadores: procesos.some((p) => p.indicadores.length > 0),
    tieneHallazgoAltoImpactoProceso: false,
    tieneResistenciaCambio: false,
  });

  function heading(texto: string, nivel: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
    return new Paragraph({
      heading: nivel,
      spacing: { before: 300, after: 150 },
      children: [new TextRun({ text: texto, color: colorPrimario.replace("#", ""), bold: true })],
    });
  }

  const seccionesProcesos = procesos.flatMap(({ proceso, sipoc, actividades, indicadores }) => [
    new Paragraph({ pageBreakBefore: true, children: [] }),
    heading(`${proceso.codigo ? proceso.codigo + " — " : ""}${proceso.nombre}`),
    new Paragraph({ spacing: { after: 100 }, children: [new TextRun(`Tipo: ${proceso.tipo} · Dueño: ${proceso.dueno_nombre ?? "—"}`)] }),
    new Paragraph({ spacing: { after: 150 }, children: [new TextRun(proceso.objetivo ?? "")] }),

    ...(sipoc
      ? [
          heading("SIPOC", HeadingLevel.HEADING_2),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Proveedores", "Entradas", "Pasos", "Salidas", "Clientes"].map((h) =>
                  celda(h, { bold: true, shade: colorPrimario })
                ),
              }),
              new TableRow({
                children: [sipoc.proveedores, sipoc.entradas, sipoc.pasos, sipoc.salidas, sipoc.clientes].map((col) =>
                  celda((col ?? []).join("\n"))
                ),
              }),
            ],
          }),
        ]
      : []),

    ...(actividades.length > 0
      ? [
          heading("Actividades", HeadingLevel.HEADING_2),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["#", "Actividad", "Responsable", "Aprobador"].map((h) => celda(h, { bold: true, shade: colorPrimario })),
              }),
              ...actividades.map(
                (a) =>
                  new TableRow({
                    children: [
                      celda(String(a.orden)),
                      celda(a.nombre),
                      celda(a.rol_responsable ?? "—"),
                      celda(a.rol_aprobador ?? "—"),
                    ],
                  })
              ),
            ],
          }),
        ]
      : []),

    ...(indicadores.length > 0
      ? [
          heading("Indicadores", HeadingLevel.HEADING_2),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Nombre", "Tipo", "Fuente de datos", "Meta"].map((h) => celda(h, { bold: true, shade: colorPrimario })),
              }),
              ...indicadores.map(
                (i) =>
                  new TableRow({
                    children: [celda(i.nombre), celda(i.tipo), celda(i.fuente_datos), celda(i.meta?.toString() ?? "—")],
                  })
              ),
            ],
          }),
        ]
      : []),
  ]);

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
                children: [new TextRun({ children: ["Página ", PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES], size: 18 })],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Manual de Procesos", bold: true, size: 40, color: colorPrimario.replace("#", "") })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: cliente.razon_social, size: 28 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: proyecto.nombre, size: 22, color: "6B7268" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: HOY, size: 20 })] }),
          ...seccionesProcesos,

          // Marco metodológico aplicado (Bloque 1.2) — solo lo que efectivamente se usó en este proyecto.
          ...(marcoMetodologico.length > 0
            ? [
                new Paragraph({ pageBreakBefore: true, children: [] }),
                heading("Marco metodológico aplicado"),
                ...marcoMetodologico.flatMap((ref) => [
                  new Paragraph({
                    spacing: { before: 100 },
                    children: [new TextRun({ text: ref.framework, bold: true })],
                  }),
                  new Paragraph({ spacing: { after: 150 }, children: [new TextRun(ref.aplicacion)] }),
                ]),
              ]
            : []),
        ],
      },
    ],
  });
}
