import { RETREATS } from "./application.ts";

/**
 * Los retiros que aparecen en el archivo, para poder filtrar por ellos.
 *
 * La lista NO está escrita a mano: sale de las fichas que hay. Así, cuando se
 * abra un retiro nuevo, aparece solo en el filtro sin tocar código; y las fichas
 * que eligieron «otra fecha» —donde la persona escribió su propio texto— también
 * se pueden filtrar, aunque nadie las haya previsto.
 */
export type RetiroEnLista = {
  /** El texto tal como quedó guardado en la ficha. Es también el valor del filtro. */
  valor: string;
  /** Cuántas fichas lo eligieron. */
  cuantas: number;
};

/** Orden del catálogo, para que el desplegable siga el orden de los retiros. */
const ORDEN = new Map<string, number>(RETREATS.map((r, i) => [r.label as string, i]));

export function retirosDeLasFichas(fichas: { retiro: string }[]): RetiroEnLista[] {
  const cuenta = new Map<string, number>();
  for (const f of fichas) {
    const valor = f.retiro?.trim();
    if (!valor) continue;
    cuenta.set(valor, (cuenta.get(valor) ?? 0) + 1);
  }
  return [...cuenta.entries()]
    .map(([valor, cuantas]) => ({ valor, cuantas }))
    .sort((a, b) => {
      // Primero los del catálogo, en su orden; después los escritos a mano,
      // alfabéticamente, para que no bailen de posición entre recargas.
      const ia = ORDEN.get(a.valor);
      const ib = ORDEN.get(b.valor);
      if (ia !== undefined && ib !== undefined) return ia - ib;
      if (ia !== undefined) return -1;
      if (ib !== undefined) return 1;
      return a.valor.localeCompare(b.valor, "es");
    });
}

/** Valor del filtro cuando no se está filtrando por retiro. */
export const TODOS_LOS_RETIROS = "todos";

export function coincideElRetiro(fichaRetiro: string, filtro: string): boolean {
  if (filtro === TODOS_LOS_RETIROS) return true;
  return (fichaRetiro ?? "").trim() === filtro;
}

/**
 * Etiqueta corta para el desplegable.
 *
 * Las del catálogo vienen como «25 – 27 septiembre 2026 · Enteogénesis», y en un
 * desplegable angosto lo que distingue —el nombre— queda fuera de la vista. Se
 * pone el nombre delante y la fecha detrás.
 */
export function etiquetaDeRetiro(valor: string): string {
  const partes = valor.split("·").map((p) => p.trim());
  if (partes.length === 2 && partes[1]) return `${partes[1]} · ${partes[0]}`;
  return valor;
}
