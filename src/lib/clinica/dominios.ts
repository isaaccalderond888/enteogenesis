/**
 * Las casillas del tablero de la lectura clínica.
 *
 * No son una lista inventada: salieron de leer las 30 fichas reales del
 * formulario (ver `docs/barrido-fichas.md`). Cada una aparece ahí con la
 * frecuencia que le tocó, y las que no se ganaron el lugar no están.
 */

/** Qué tan urgente es una casilla. Decide color y posición en el tablero. */
export const ESTADOS = ["atender", "revisar", "falta", "ok"] as const;
export type EstadoDominio = (typeof ESTADOS)[number];

export type DefinicionDominio = {
  clave: string;
  /** Lo que se lee en la casilla. Nuestro, no del modelo. */
  rotulo: string;
  /**
   * Un dominio fijo aparece siempre, aunque esté en verde: su ausencia es la
   * información. Si desaparece cuando no hay hallazgo, quien lee no sabe si es
   * que no hay nada o si es que nadie miró.
   */
  fijo: boolean;
};

export const DOMINIOS: DefinicionDominio[] = [
  // --- Fijos: el piso de seguridad. Van siempre. ---
  { clave: "declaracion", rotulo: "Declaración", fijo: true },
  { clave: "lavados", rotulo: "Lavados", fijo: true },
  { clave: "riesgoAgudo", rotulo: "Riesgo agudo", fijo: true },
  { clave: "saludFisica", rotulo: "Salud física", fijo: true },

  // --- Variables: sólo si hay algo que decir. Ordenados por frecuencia real. ---
  { clave: "experienciaPrevia", rotulo: "Experiencia previa", fijo: false },
  { clave: "psiquiatricoPropio", rotulo: "Psiquiátrico propio", fijo: false },
  { clave: "duelo", rotulo: "Duelo o pérdida", fijo: false },
  { clave: "antecedenteFamiliar", rotulo: "Antecedente familiar", fijo: false },
  { clave: "perinatal", rotulo: "Perinatal", fijo: false },
  { clave: "emergenciaEspiritual", rotulo: "Emergencia espiritual", fijo: false },
  { clave: "violencia", rotulo: "Violencia o abuso", fijo: false },
  { clave: "suicidioFamiliar", rotulo: "Suicidio en la familia", fijo: false },
  { clave: "redSosten", rotulo: "Red y sostén", fijo: false },
  { clave: "segundaVez", rotulo: "Segunda vez", fijo: false },
];

export const CLAVES_DOMINIO = DOMINIOS.map((d) => d.clave);
export const DOMINIOS_FIJOS = DOMINIOS.filter((d) => d.fijo).map((d) => d.clave);

const POR_CLAVE = new Map(DOMINIOS.map((d) => [d.clave, d]));
export function definicion(clave: string): DefinicionDominio | undefined {
  return POR_CLAVE.get(clave);
}

const ORDEN_ESTADO: Record<string, number> = { atender: 0, revisar: 1, falta: 2, ok: 3 };
const ORDEN_CLAVE = new Map(DOMINIOS.map((d, i) => [d.clave, i]));

/**
 * Ordena el tablero: primero lo que hay que atender, luego lo que hay que
 * revisar, luego los huecos, y al final lo que está en orden.
 *
 * Con nueve casillas el tablero sigue siendo legible sólo por esto. Sin el
 * orden, lo grave puede caer en la cuarta fila y pasar desapercibido.
 *
 * Un hueco va antes que un verde a propósito: en una ficha sin banderas, lo que
 * falta es el hallazgo.
 */
export function ordenarDominios<T extends { clave: string; estado: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    const porEstado = (ORDEN_ESTADO[a.estado] ?? 9) - (ORDEN_ESTADO[b.estado] ?? 9);
    if (porEstado !== 0) return porEstado;
    return (ORDEN_CLAVE.get(a.clave) ?? 99) - (ORDEN_CLAVE.get(b.clave) ?? 99);
  });
}

/**
 * Descarta casillas de clave desconocida y quita repetidas.
 *
 * El modelo escribe la clave; si inventa una, la casilla no tiene rótulo ni
 * lugar en el orden y ensucia el tablero. Mejor perder esa observación que
 * mostrar una casilla sin nombre.
 */
export function soloDominiosConocidos<T extends { clave: string }>(lista: T[]): T[] {
  const vistos = new Set<string>();
  return lista.filter((d) => {
    if (!POR_CLAVE.has(d.clave) || vistos.has(d.clave)) return false;
    vistos.add(d.clave);
    return true;
  });
}
