import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
} from "docx";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import type { Database, Arquetipo } from "@/lib/supabase/types";

type Consultor = Database["public"]["Tables"]["consultores"]["Row"];
type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
type Proyecto = Database["public"]["Tables"]["proyectos"]["Row"];
type Triage = Database["public"]["Tables"]["triage_respuestas"]["Row"];

export interface DatosPropuestaComercial {
  consultor: Consultor;
  cliente: Cliente;
  proyecto: Proyecto;
  triage: Triage | null;
  alcance: string;
  exclusiones: string;
  inversionMinima: number;
  inversionMaxima: number;
  justificacionMetodologica: string;
}

const HOY = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
const CLAUSULAS_PROTECCION = [
  "Control de cambios: cualquier ajuste al alcance definido en esta propuesta que implique trabajo adicional se cotiza y aprueba por separado antes de ejecutarse.",
  "Compromisos del cliente: el cliente se compromete a designar un interlocutor con disponibilidad real, facilitar acceso a la información y personas requeridas, y responder solicitudes en un plazo máximo de 5 días hábiles.",
  "Criterios de aceptación: cada entregable se considera aceptado si cumple lo descrito en el alcance de esta propuesta; observaciones de forma no bloquean la aceptación ni el pago.",
];

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function generarPropuestaComercial(datos: DatosPropuestaComercial): Document {
  const { consultor, cliente, proyecto, triage, alcance, exclusiones, inversionMinima, inversionMaxima, justificacionMetodologica } = datos;
  const colorPrimario = (consultor.color_primario || "#1A4731").replace("#", "");
  const infoArquetipo = triage ? ARQUETIPO_INFO[triage.arquetipo_sugerido as Arquetipo] : null;

  function heading(texto: string) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
      children: [new TextRun({ text: texto, color: colorPrimario, bold: true })],
    });
  }

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
          new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Propuesta Comercial", bold: true, size: 40, color: colorPrimario })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: cliente.razon_social, size: 28 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: proyecto.nombre, size: 22, color: "6B7268" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: HOY, size: 20 })] }),
          new Paragraph({ pageBreakBefore: true, children: [] }),

          heading("Contexto"),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun(
                `Esta propuesta responde a la necesidad identificada en ${cliente.razon_social} de intervenir sus procesos de negocio con un enfoque estructurado.`
              ),
            ],
          }),

          ...(infoArquetipo
            ? [
                heading("Diagnóstico preliminar"),
                new Paragraph({
                  spacing: { after: 150 },
                  children: [
                    new TextRun({ text: `${infoArquetipo.titulo}. `, bold: true }),
                    new TextRun(infoArquetipo.descripcion),
                  ],
                }),
              ]
            : []),

          heading("Justificación metodológica"),
          ...justificacionMetodologica.split("\n\n").map((p) => new Paragraph({ spacing: { after: 150 }, children: [new TextRun(p)] })),

          heading("Alcance"),
          ...alcance.split("\n\n").map((p) => new Paragraph({ spacing: { after: 150 }, children: [new TextRun(p)] })),

          heading("Exclusiones"),
          ...exclusiones.split("\n\n").map((p) => new Paragraph({ spacing: { after: 150 }, children: [new TextRun(p)] })),

          heading("Inversión"),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: `Rango estimado: ${money(inversionMinima)} — ${money(inversionMaxima)}. El valor final se ajusta según el alcance definitivo acordado.`,
              }),
            ],
          }),

          heading("Condiciones"),
          ...CLAUSULAS_PROTECCION.map(
            (c) => new Paragraph({ spacing: { after: 100 }, bullet: { level: 0 }, children: [new TextRun(c)] })
          ),
        ],
      },
    ],
  });
}
