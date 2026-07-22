// Descriptores del Modelo PEMM (Process and Enterprise Maturity Model, Hammer)
// 5 habilitadores de proceso (P) + 4 capacidades de empresa (E), cada uno en escala 1-4.
// El nivel de un proceso es el MÍNIMO de sus habilitadores (criterio de Hammer, no el promedio).

export type DimensionProceso = "diseno" | "ejecutores" | "responsable" | "infraestructura" | "indicadores";
export type DimensionEmpresa = "liderazgo" | "cultura" | "experiencia" | "gobierno";
export type Dimension = DimensionProceso | DimensionEmpresa;

export const DIMENSIONES_PROCESO: DimensionProceso[] = [
  "diseno",
  "ejecutores",
  "responsable",
  "infraestructura",
  "indicadores",
];

export const DIMENSIONES_EMPRESA: DimensionEmpresa[] = ["liderazgo", "cultura", "experiencia", "gobierno"];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  diseno: "Diseño",
  ejecutores: "Ejecutores",
  responsable: "Responsable",
  infraestructura: "Infraestructura",
  indicadores: "Indicadores",
  liderazgo: "Liderazgo",
  cultura: "Cultura",
  experiencia: "Experiencia",
  gobierno: "Gobierno",
};

export const DIMENSION_PREGUNTA: Record<Dimension, string> = {
  diseno: "¿Qué tan completo y adaptado al contexto real está el diseño documentado del proceso?",
  ejecutores: "¿Los ejecutores del proceso tienen las habilidades y el conocimiento necesarios?",
  responsable: "¿Existe un dueño de proceso con autoridad real sobre el diseño y el desempeño?",
  infraestructura: "¿Los sistemas de información y de gestión de personas soportan el proceso end-to-end?",
  indicadores: "¿El proceso se mide con indicadores válidos, usados para decidir y mejorar?",
  liderazgo: "¿La alta dirección patrocina activamente la gestión por procesos?",
  cultura: "¿La organización tiene cultura de trabajo en equipo, enfoque en el cliente y responsabilidad por resultados?",
  experiencia: "¿Existe experiencia interna instalada en metodologías de gestión de procesos?",
  gobierno: "¿Existen mecanismos formales para gestionar el desempeño de los procesos a nivel corporativo?",
};

// Descriptor concreto por nivel (1 = más bajo, 4 = más alto). Se muestra al consultor/respondiente
// en vez de una escala abstracta, para forzar una calificación basada en evidencia observable.
export const DESCRIPTORES: Record<Dimension, [string, string, string, string]> = {
  diseno: [
    "El proceso no está documentado, o el documento existente no refleja cómo se trabaja realmente.",
    "Existe un diseño documentado, pero fragmentado o desactualizado; cada área lo interpreta distinto.",
    "El diseño está documentado, es coherente end-to-end y se usa como referencia en el trabajo diario.",
    "El diseño está documentado, se revisa periódicamente y se ajusta con base en resultados y cambios del entorno.",
  ],
  ejecutores: [
    "Los ejecutores no conocen el proceso completo, solo su tarea aislada; no hay entrenamiento formal.",
    "Los ejecutores conocen su parte del proceso pero no cómo conecta con el resto; entrenamiento informal.",
    "Los ejecutores entienden el proceso end-to-end y reciben entrenamiento formal periódico.",
    "Los ejecutores dominan el proceso, entienden su impacto en el cliente y participan activamente en mejorarlo.",
  ],
  responsable: [
    "Nadie es responsable formalmente del proceso completo; las decisiones se toman por área, sin visión global.",
    "Existe un responsable nombrado, pero sin autoridad real para exigir cambios fuera de su área.",
    "El dueño de proceso tiene autoridad reconocida sobre el diseño y el desempeño en todas las áreas involucradas.",
    "El dueño de proceso tiene autoridad, presupuesto propio y rinde cuentas directamente por los resultados del proceso.",
  ],
  infraestructura: [
    "Los sistemas de información están fragmentados por área; no hay trazabilidad end-to-end del proceso.",
    "Existen sistemas que cubren partes del proceso, con integraciones manuales o reprocesos entre ellos.",
    "Los sistemas soportan el proceso completo con datos consistentes y trazabilidad de principio a fin.",
    "Los sistemas soportan el proceso completo, están integrados con analítica, y la gestión de personas está alineada al proceso (metas, incentivos, competencias).",
  ],
  indicadores: [
    "No existen indicadores del proceso, o los que existen miden actividades sueltas sin relación con el resultado.",
    "Existen indicadores pero no se usan para decidir; se reportan pero no generan acción.",
    "Existen indicadores de eficacia, eficiencia y calidad, revisados periódicamente y usados para ajustar el proceso.",
    "Los indicadores del proceso están conectados a los indicadores estratégicos de la empresa y se usan proactivamente para anticipar problemas.",
  ],
  liderazgo: [
    "La alta dirección no conoce ni patrocina la gestión por procesos; las iniciativas dependen de mandos medios aislados.",
    "Existe patrocinio verbal de la dirección, pero sin asignación real de tiempo, presupuesto o seguimiento.",
    "La dirección patrocina activamente: asigna recursos, hace seguimiento y modela el comportamiento esperado.",
    "La gestión por procesos es parte explícita de la estrategia; la dirección la usa como criterio central de decisión.",
  ],
  cultura: [
    "La cultura es de silos: cada área optimiza su propio resultado incluso a costa del proceso completo.",
    "Hay conciencia de que existen otras áreas en el proceso, pero la colaboración cruzada es esporádica.",
    "Existe colaboración habitual entre áreas con foco explícito en el resultado para el cliente final.",
    "La organización piensa y se organiza por proceso de forma natural; el cliente final es el criterio compartido de éxito.",
  ],
  experiencia: [
    "Nadie en la organización tiene formación o experiencia previa en gestión de procesos.",
    "Existen una o pocas personas con conocimiento de metodologías de procesos, sin método compartido.",
    "Existe un método de gestión de procesos adoptado y una masa crítica de personas formadas en él.",
    "La organización tiene una función o equipo dedicado a gestión de procesos con metodología madura y probada.",
  ],
  gobierno: [
    "No existe ninguna instancia que gestione el desempeño de los procesos a nivel corporativo; las decisiones de estructura son difusas.",
    "Existe alguna instancia de gobierno, pero informal o sin autoridad real para resolver conflictos entre áreas.",
    "Existe un comité o instancia formal de gobierno de procesos con autoridad para resolver conflictos y priorizar inversión.",
    "El gobierno de procesos está integrado al gobierno corporativo general, con revisión periódica y consecuencias reales.",
  ],
};
