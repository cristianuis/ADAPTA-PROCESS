/**
 * Tokens de diseño de ADAPTA OS (Bloque 2.1).
 *
 * Color: se reutiliza la paleta ya definida en app/globals.css (--primary, --secondary,
 * --success, --destructive, --muted, etc.) — es la identidad propia de la herramienta,
 * configurable por consultor en /perfil, y siempre distinta de la marca de cualquier
 * cliente. No se agregan colores nuevos aquí.
 *
 * Tipografía y espaciado: antes de este bloque, cada pantalla usaba tamaños y gaps
 * sueltos (text-2xl, text-lg, gap-6, gap-3...) elegidos ad hoc por componente. Estas
 * constantes fijan una escala única — 4 tamaños tipográficos, una escala de espaciado —
 * para que toda pantalla nueva la importe en vez de inventar valores.
 */

export const TYPE_SCALE = {
  /** Título de página (nombre de proyecto, "Resultado — ..."). */
  h1: "text-2xl font-semibold tracking-tight",
  /** Encabezado de sección dentro de una pantalla. */
  h2: "text-base font-semibold tracking-tight",
  /** Texto de cuerpo por defecto. */
  body: "text-sm",
  /** Etiquetas, metadatos, captions — el tamaño más chico de la escala. */
  meta: "text-xs text-muted-foreground",
} as const;

export const SPACING_SCALE = {
  /** 4px — separación mínima entre elementos muy relacionados (ícono + texto). */
  xs: "gap-1",
  /** 8px — separación dentro de un grupo compacto (badges, controles en línea). */
  sm: "gap-2",
  /** 12px — separación entre filas de una lista densa. */
  md: "gap-3",
  /** 16px — separación por defecto entre bloques de una misma sección. */
  lg: "gap-4",
  /** 24px — separación entre secciones distintas de una pantalla. */
  xl: "gap-6",
  /** 32px — separación entre columnas de un layout de dashboard. */
  "2xl": "gap-8",
} as const;
