import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, PageNumber } from "docx";
import type { Database } from "@/lib/supabase/types";

type Consultor = Database["public"]["Tables"]["consultores"]["Row"];
type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
type Proyecto = Database["public"]["Tables"]["proyectos"]["Row"];
type Auditoria = Database["public"]["Tables"]["auditorias_adopcion"]["Row"];

export interface DatosInformeAdopcion {
  consultor: Consultor;
  cliente: Cliente;
  proyecto: Proyecto;
  proceso: { nombre: string };
  auditoria: Auditoria;
}

const HOY = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

export function generarInformeAdopcion(datos: DatosInformeAdopcion): Document {
  const { consultor, cliente, proyecto, proceso, auditoria } = datos;
  const colorPrimario = (consultor.color_primario || "#1A4731").replace("#", "");

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
          new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Informe de Adopción", bold: true, size: 40, color: colorPrimario })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: cliente.razon_social, size: 28 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: `${proyecto.nombre} — ${proceso.nombre}`, size: 22, color: "6B7268" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: HOY, size: 20 })] }),
          new Paragraph({ pageBreakBefore: true, children: [] }),

          heading("Resultado de la auditoría"),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: `Porcentaje de adopción: ${auditoria.porcentaje_adopcion}% (${auditoria.casos_conformes} de ${auditoria.casos_revisados} casos revisados fueron conformes con el proceso diseñado).`,
              }),
            ],
          }),

          ...(auditoria.desviaciones && auditoria.desviaciones.length > 0
            ? [
                heading("Desviaciones observadas"),
                ...auditoria.desviaciones.map(
                  (d) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun(d)] })
                ),
              ]
            : []),

          ...(auditoria.causas_identificadas
            ? [heading("Hipótesis de causa raíz"), new Paragraph({ spacing: { after: 150 }, children: [new TextRun(auditoria.causas_identificadas)] })]
            : []),
        ],
      },
    ],
  });
}
