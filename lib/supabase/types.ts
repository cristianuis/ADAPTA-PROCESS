// Tipos escritos a mano para reflejar supabase/migrations/0001_fase1_core.sql.
// Cuando tengas la CLI de Supabase conectada a tu proyecto, reemplaza este archivo con:
//   npx supabase gen types typescript --project-id <tu-project-id> > lib/supabase/types.ts

export type Arquetipo = "A" | "B" | "C" | "D" | "E";

export type EstadoProyecto =
  | "prospecto"
  | "diagnostico"
  | "definicion"
  | "arquitectura"
  | "pilotaje"
  | "transferencia"
  | "anclaje"
  | "cerrado";

export type Disparador = "crecimiento" | "problema" | "requisito_externo";

export type NivelJerarquico = "direccion" | "mando_medio" | "operacion";
export type TipoPEMM = "proceso" | "empresa";
export type FuentePEMM = "consultor" | "encuesta_publica";
export type EstadoPEMM = "pendiente" | "respondida";
export type CategoriaHallazgo = "proceso" | "gobierno" | "tecnologia" | "cultura" | "datos";
export type FuenteHallazgo = "entrevista" | "observacion" | "documental" | "financiero";
export type OrigenHallazgo = "ia" | "manual";
export type NivelResistencia = "bajo" | "medio" | "alto";
export type TipoEntregable = "diagnostico" | "propuesta" | "manual" | "tablero" | "auditoria";
export type EstadoEntregable = "borrador" | "revision" | "entregado" | "aceptado";
export type TipoProceso = "estrategico" | "misional" | "apoyo";
export type EstadoProceso = "identificado" | "diseno" | "piloto" | "operando";
export type TipoIndicador = "eficacia" | "eficiencia" | "calidad";

export interface SipocItem {
  texto: string;
}

export type EndpointIA =
  | "analizar-entrevista"
  | "resumen-ejecutivo"
  | "justificacion-metodologica"
  | "analisis-desviaciones";

export interface Desviacion {
  descripcion: string;
}

export interface AccionAdopcion {
  descripcion: string;
  responsable?: string;
}

export interface EstructuraPlantilla {
  sipoc?: {
    proveedores: string[];
    entradas: string[];
    pasos: string[];
    salidas: string[];
    clientes: string[];
  };
  actividades?: {
    orden: number;
    nombre: string;
    rolResponsable?: string;
    rolAprobador?: string;
  }[];
  indicadoresSugeridos?: { nombre: string; tipo: TipoIndicador }[];
}

export interface HallazgoIA {
  titulo: string;
  descripcion: string;
  categoria: CategoriaHallazgo;
  impacto_estimado: number;
  cita_soporte: string;
  confianza: "alta" | "media" | "baja";
  // Habilitador PEMM (Hammer) que sustenta el hallazgo cuando categoria="proceso"; null en otro caso.
  habilitador_pemm: "diseno" | "ejecutores" | "responsable" | "infraestructura" | "indicadores" | null;
  promovido?: boolean;
  indice?: number;
  hallazgo_id?: string;
}

export interface Database {
  public: {
    Tables: {
      consultores: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          email: string;
          empresa: string | null;
          logo_url: string | null;
          color_primario: string;
          color_secundario: string;
          tarifa_hora_objetivo: number | null;
          // Bloque 1.3 — referencia de voz opcional del consultor, inyectada en prompts de
          // redacción solo si tiene contenido (ver lib/ia/estilo-consultor.ts).
          ejemplos_estilo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          email: string;
          empresa?: string | null;
          logo_url?: string | null;
          color_primario?: string;
          color_secundario?: string;
          tarifa_hora_objetivo?: number | null;
          ejemplos_estilo?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["consultores"]["Insert"]>;
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          consultor_id: string;
          razon_social: string;
          nit: string | null;
          sector: string | null;
          subsector: string | null;
          num_empleados: number | null;
          facturacion_anual: number | null;
          ciudad: string | null;
          contacto_nombre: string | null;
          contacto_cargo: string | null;
          contacto_email: string | null;
          contacto_telefono: string | null;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultor_id: string;
          razon_social: string;
          nit?: string | null;
          sector?: string | null;
          subsector?: string | null;
          num_empleados?: number | null;
          facturacion_anual?: number | null;
          ciudad?: string | null;
          contacto_nombre?: string | null;
          contacto_cargo?: string | null;
          contacto_email?: string | null;
          contacto_telefono?: string | null;
          notas?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clientes_consultor_id_fkey";
            columns: ["consultor_id"];
            isOneToOne: false;
            referencedRelation: "consultores";
            referencedColumns: ["id"];
          },
        ];
      };
      proyectos: {
        Row: {
          id: string;
          cliente_id: string;
          consultor_id: string;
          nombre: string;
          arquetipo: Arquetipo | null;
          estado: EstadoProyecto;
          fecha_inicio: string | null;
          fecha_fin_estimada: string | null;
          valor_contrato: number | null;
          modelo_cobro: string | null;
          criterios_exito: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          consultor_id: string;
          nombre: string;
          arquetipo?: Arquetipo | null;
          estado?: EstadoProyecto;
          fecha_inicio?: string | null;
          fecha_fin_estimada?: string | null;
          valor_contrato?: number | null;
          modelo_cobro?: string | null;
          criterios_exito?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["proyectos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "proyectos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyectos_consultor_id_fkey";
            columns: ["consultor_id"];
            isOneToOne: false;
            referencedRelation: "consultores";
            referencedColumns: ["id"];
          },
        ];
      };
      triage_respuestas: {
        Row: {
          id: string;
          proyecto_id: string;
          p1_documentacion_existe: 0 | 1 | 2;
          p2_documentacion_se_usa: 0 | 1 | 2;
          p3_se_mide_desempeno: 0 | 1 | 2;
          p4_duenos_proceso: 0 | 1 | 2;
          p5_disparador: Disparador;
          p6_estructura_decision: 0 | 1 | 2;
          puntaje_total: number;
          arquetipo_sugerido: Arquetipo;
          alerta_gobierno: boolean;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          p1_documentacion_existe: 0 | 1 | 2;
          p2_documentacion_se_usa: 0 | 1 | 2;
          p3_se_mide_desempeno: 0 | 1 | 2;
          p4_duenos_proceso: 0 | 1 | 2;
          p5_disparador: Disparador;
          p6_estructura_decision: 0 | 1 | 2;
          puntaje_total: number;
          arquetipo_sugerido: Arquetipo;
          alerta_gobierno: boolean;
          notas?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["triage_respuestas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "triage_respuestas_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: true;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
      pemm_evaluaciones: {
        Row: {
          id: string;
          proyecto_id: string;
          proceso_evaluado: string | null;
          tipo: TipoPEMM;
          respondiente_nivel: NivelJerarquico | null;
          respondiente_nombre: string | null;
          fuente: FuentePEMM;
          token: string | null;
          estado: EstadoPEMM;
          diseno: number | null;
          ejecutores: number | null;
          responsable: number | null;
          infraestructura: number | null;
          indicadores: number | null;
          liderazgo: number | null;
          cultura: number | null;
          experiencia: number | null;
          gobierno: number | null;
          nivel_resultante: number | null;
          evidencias: Record<string, string> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          proceso_evaluado?: string | null;
          tipo: TipoPEMM;
          respondiente_nivel?: NivelJerarquico | null;
          respondiente_nombre?: string | null;
          fuente?: FuentePEMM;
          token?: string | null;
          estado?: EstadoPEMM;
          diseno?: number | null;
          ejecutores?: number | null;
          responsable?: number | null;
          infraestructura?: number | null;
          indicadores?: number | null;
          liderazgo?: number | null;
          cultura?: number | null;
          experiencia?: number | null;
          gobierno?: number | null;
          nivel_resultante?: number | null;
          evidencias?: Record<string, string> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pemm_evaluaciones"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "pemm_evaluaciones_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
      entrevistas: {
        Row: {
          id: string;
          proyecto_id: string;
          entrevistado_nombre: string | null;
          entrevistado_cargo: string | null;
          nivel: NivelJerarquico | null;
          fecha: string | null;
          transcripcion: string | null;
          hallazgos_ia: HallazgoIA[] | null;
          hallazgos_validados: HallazgoIA[] | null;
          nivel_resistencia: NivelResistencia | null;
          senales_gobierno: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          entrevistado_nombre?: string | null;
          entrevistado_cargo?: string | null;
          nivel?: NivelJerarquico | null;
          fecha?: string | null;
          transcripcion?: string | null;
          hallazgos_ia?: HallazgoIA[] | null;
          hallazgos_validados?: HallazgoIA[] | null;
          nivel_resistencia?: NivelResistencia | null;
          senales_gobierno?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["entrevistas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "entrevistas_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
      hallazgos: {
        Row: {
          id: string;
          proyecto_id: string;
          titulo: string;
          descripcion: string | null;
          categoria: CategoriaHallazgo | null;
          impacto: number;
          esfuerzo: number;
          fuente: FuenteHallazgo;
          fuente_id: string | null;
          origen: OrigenHallazgo;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          titulo: string;
          descripcion?: string | null;
          categoria?: CategoriaHallazgo | null;
          impacto: number;
          esfuerzo: number;
          fuente: FuenteHallazgo;
          fuente_id?: string | null;
          origen?: OrigenHallazgo;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hallazgos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "hallazgos_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
      entregables: {
        Row: {
          id: string;
          proyecto_id: string;
          tipo: TipoEntregable;
          nombre: string;
          fase: string | null;
          version: number;
          estado: EstadoEntregable;
          fecha_entrega: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          tipo: TipoEntregable;
          nombre: string;
          fase?: string | null;
          version?: number;
          estado?: EstadoEntregable;
          fecha_entrega?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["entregables"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "entregables_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
      procesos: {
        Row: {
          id: string;
          proyecto_id: string;
          codigo: string | null;
          nombre: string;
          tipo: TipoProceso;
          objetivo: string | null;
          alcance_inicio: string | null;
          alcance_fin: string | null;
          dueno_nombre: string | null;
          dueno_cargo: string | null;
          prioridad: number | null;
          estado: EstadoProceso;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          codigo?: string | null;
          nombre: string;
          tipo: TipoProceso;
          objetivo?: string | null;
          alcance_inicio?: string | null;
          alcance_fin?: string | null;
          dueno_nombre?: string | null;
          dueno_cargo?: string | null;
          prioridad?: number | null;
          estado?: EstadoProceso;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["procesos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "procesos_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
      sipoc: {
        Row: {
          id: string;
          proceso_id: string;
          proveedores: string[] | null;
          entradas: string[] | null;
          pasos: string[] | null;
          salidas: string[] | null;
          clientes: string[] | null;
        };
        Insert: {
          id?: string;
          proceso_id: string;
          proveedores?: string[] | null;
          entradas?: string[] | null;
          pasos?: string[] | null;
          salidas?: string[] | null;
          clientes?: string[] | null;
        };
        Update: Partial<Database["public"]["Tables"]["sipoc"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sipoc_proceso_id_fkey";
            columns: ["proceso_id"];
            isOneToOne: true;
            referencedRelation: "procesos";
            referencedColumns: ["id"];
          },
        ];
      };
      actividades: {
        Row: {
          id: string;
          proceso_id: string;
          orden: number;
          nombre: string;
          descripcion: string | null;
          rol_responsable: string | null;
          rol_aprobador: string | null;
          roles_consultados: string[] | null;
          roles_informados: string[] | null;
          tiempo_estimado_min: number | null;
          es_valor_agregado: boolean;
          sistema_soporte: string | null;
        };
        Insert: {
          id?: string;
          proceso_id: string;
          orden: number;
          nombre: string;
          descripcion?: string | null;
          rol_responsable?: string | null;
          rol_aprobador?: string | null;
          roles_consultados?: string[] | null;
          roles_informados?: string[] | null;
          tiempo_estimado_min?: number | null;
          es_valor_agregado?: boolean;
          sistema_soporte?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["actividades"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "actividades_proceso_id_fkey";
            columns: ["proceso_id"];
            isOneToOne: false;
            referencedRelation: "procesos";
            referencedColumns: ["id"];
          },
        ];
      };
      indicadores: {
        Row: {
          id: string;
          proceso_id: string;
          nombre: string;
          tipo: TipoIndicador;
          formula: string | null;
          unidad: string | null;
          fuente_datos: string;
          mecanismo_captura: string;
          frecuencia: string | null;
          meta: number | null;
          responsable: string | null;
          activo: boolean;
        };
        Insert: {
          id?: string;
          proceso_id: string;
          nombre: string;
          tipo: TipoIndicador;
          formula?: string | null;
          unidad?: string | null;
          fuente_datos: string;
          mecanismo_captura: string;
          frecuencia?: string | null;
          meta?: number | null;
          responsable?: string | null;
          activo?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["indicadores"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "indicadores_proceso_id_fkey";
            columns: ["proceso_id"];
            isOneToOne: false;
            referencedRelation: "procesos";
            referencedColumns: ["id"];
          },
        ];
      };
      mediciones: {
        Row: {
          id: string;
          indicador_id: string;
          periodo: string;
          valor: number | null;
          observaciones: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          indicador_id: string;
          periodo: string;
          valor?: number | null;
          observaciones?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediciones"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "mediciones_indicador_id_fkey";
            columns: ["indicador_id"];
            isOneToOne: false;
            referencedRelation: "indicadores";
            referencedColumns: ["id"];
          },
        ];
      };
      auditorias_adopcion: {
        Row: {
          id: string;
          proyecto_id: string;
          proceso_id: string | null;
          fecha: string;
          casos_revisados: number;
          casos_conformes: number;
          porcentaje_adopcion: number | null;
          desviaciones: string[] | null;
          causas_identificadas: string | null;
          acciones: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proyecto_id: string;
          proceso_id?: string | null;
          fecha?: string;
          casos_revisados?: number;
          casos_conformes?: number;
          porcentaje_adopcion?: number | null;
          desviaciones?: string[] | null;
          causas_identificadas?: string | null;
          acciones?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["auditorias_adopcion"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "auditorias_adopcion_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auditorias_adopcion_proceso_id_fkey";
            columns: ["proceso_id"];
            isOneToOne: false;
            referencedRelation: "procesos";
            referencedColumns: ["id"];
          },
        ];
      };
      plantillas_proceso: {
        Row: {
          id: string;
          consultor_id: string;
          nombre: string;
          sector: string | null;
          tipo_proceso: string | null;
          descripcion: string | null;
          estructura: EstructuraPlantilla;
          veces_usada: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultor_id: string;
          nombre: string;
          sector?: string | null;
          tipo_proceso?: string | null;
          descripcion?: string | null;
          estructura?: EstructuraPlantilla;
          veces_usada?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plantillas_proceso"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "plantillas_proceso_consultor_id_fkey";
            columns: ["consultor_id"];
            isOneToOne: false;
            referencedRelation: "consultores";
            referencedColumns: ["id"];
          },
        ];
      };
      benchmarks: {
        Row: {
          id: string;
          consultor_id: string;
          sector: string;
          indicador: string;
          valor_p25: number | null;
          valor_mediana: number | null;
          valor_p75: number | null;
          num_observaciones: number;
          actualizado_at: string;
        };
        Insert: {
          id?: string;
          consultor_id: string;
          sector: string;
          indicador: string;
          valor_p25?: number | null;
          valor_mediana?: number | null;
          valor_p75?: number | null;
          num_observaciones?: number;
          actualizado_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["benchmarks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "benchmarks_consultor_id_fkey";
            columns: ["consultor_id"];
            isOneToOne: false;
            referencedRelation: "consultores";
            referencedColumns: ["id"];
          },
        ];
      };
      llamadas_ia: {
        Row: {
          id: string;
          consultor_id: string;
          proyecto_id: string | null;
          endpoint: EndpointIA;
          modelo: string;
          tokens_entrada: number | null;
          tokens_salida: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultor_id: string;
          proyecto_id?: string | null;
          endpoint: EndpointIA;
          modelo: string;
          tokens_entrada?: number | null;
          tokens_salida?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["llamadas_ia"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "llamadas_ia_consultor_id_fkey";
            columns: ["consultor_id"];
            isOneToOne: false;
            referencedRelation: "consultores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "llamadas_ia_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
