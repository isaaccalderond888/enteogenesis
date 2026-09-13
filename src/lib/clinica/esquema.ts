import { z } from "zod";
import { CLAVES_DOMINIO, ESTADOS, ordenarDominios, soloDominiosConocidos } from "./dominios.ts";
import type { LecturaFicha } from "./lectura-ficha.ts";

/**
 * Cuántos elementos cabe leer de un vistazo.
 *
 * Los lavados llevan un tope holgado a propósito: si hay cinco sustancias que
 * suspender, son cinco, y ninguna se cae por cumplir una cuota.
 */
export const TOPES = {
  dominios: 12,
  preguntas: 3,
  detalle: 5,
  lavados: 8,
} as const;

/**
 * Una casilla del tablero, tal como vuelve del modelo.
 *
 * `clave` y `estado` se aceptan como texto libre a propósito, aunque al modelo
 * se le pidan de una lista cerrada: si inventa una clave, lo que se pierde es
 * esa casilla —`soloDominiosConocidos` la tira— y no la lectura entera, que ya
 * está completa y ya costó dinero. La misma lección que los topes.
 */
const Dominio = z.object({
  clave: z.string(),
  estado: z.string(),
  /** Dos o tres palabras que matizan el estado: "dos choques", "sin señales". */
  etiqueta: z.string(),
  /** Una sola línea. Lo que se lee sin abrir nada. */
  linea: z.string(),
});

/** La misma casilla, con la lista cerrada, para decirle al modelo qué existe. */
const DominioPedido = Dominio.extend({
  clave: z.enum(CLAVES_DOMINIO as [string, ...string[]]),
  estado: z.enum(ESTADOS as unknown as [string, ...string[]]),
});

/**
 * Una observación con su respaldo.
 *
 * `escribio` es literal de la ficha y `leo` es interpretación: van en campos
 * distintos para que nunca se mezclen en la misma frase, que es lo que hacía
 * imposible saber dónde terminaba una y empezaba la otra.
 */
const Detalle = z.object({
  tema: z.string(),
  escribio: z.array(z.string()),
  leo: z.string(),
  /**
   * El marco terapéutico desde el que se lee, cuando de verdad viene de uno.
   * Vacío el resto de las veces: una etiqueta puesta de adorno hace que deje de
   * significar algo cuando sí aparece.
   */
  marco: z.string(),
});

const Lavado = z.object({ sustancia: z.string(), ventana: z.string(), porQue: z.string() });

/**
 * La sugerencia de punto de partida.
 *
 * `medicina` vacía significa "todavía no se sugiere", y es una salida válida:
 * cuando hay que resolver una medicación con quien la prescribió, inventar una
 * dosis es peor que decir por qué no la hay. El caso que lo enseñó terminó
 * exactamente así —el psiquiatra hizo el desmonte y autorizó— y una sugerencia
 * inventada habría estorbado esa conversación.
 */
const Sugerencia = z.object({
  medicina: z.string(),
  dosis: z.string(),
  porQue: z.string(),
});

const campos = {
  riesgo: z.enum(["bajo", "medio", "alto"]),
  alertaPrincipal: z.string(),
  dominios: z.array(Dominio),
  lectura: z.string(),
  fase: z.string(),
  sugerencia: Sugerencia,
  preguntas: z.array(z.string()),
  detalle: z.array(Detalle),
  lavados: z.array(Lavado),
};

/**
 * La forma que se le pide al modelo, con los topes puestos.
 *
 * Los topes llegan al modelo como parte del esquema, que refuerza lo que el
 * marco ya dice en prosa. No los impone la API: son una señal más, no una reja.
 */
export const EsquemaLectura = z.object({
  ...campos,
  dominios: z.array(DominioPedido).max(TOPES.dominios),
  preguntas: campos.preguntas.max(TOPES.preguntas),
  detalle: campos.detalle.max(TOPES.detalle),
  lavados: campos.lavados.max(TOPES.lavados),
});

/**
 * La forma que se acepta de vuelta, sin topes.
 *
 * Deliberadamente más permisiva que la que se pide: una lectura con un elemento
 * de más está completa y costó dinero. Rechazarla por eso sería tirar el trabajo
 * entero por una cuota; lo que se hace es recortarla al guardarla.
 *
 * Vive aparte de la llamada a la API porque se usa en dos momentos distintos: al
 * pedirle la lectura al modelo, y al releer una lectura vieja guardada en la
 * base. Si el marco cambia de campos, una lectura guardada con la forma anterior
 * deja de pasar por aquí y se regenera, en vez de romper la página.
 */
const EsquemaGuardado = z.object(campos);

/**
 * Devuelve la lectura sólo si está completa. Una lectura a medias (guardada con
 * una versión anterior del marco, o escrita a mano en la base) equivale a no
 * tenerla: la pantalla ofrece generarla de nuevo.
 *
 * No recorta: una lectura ya guardada se muestra como se guardó.
 */
export function lecturaCompleta(valor: unknown): LecturaFicha | null {
  const salida = EsquemaGuardado.safeParse(valor);
  return salida.success ? (salida.data as LecturaFicha) : null;
}

/**
 * Deja una lectura recién generada lista para guardarse: recorta a lo que cabe
 * de un vistazo, tira las casillas de clave inventada y pone el tablero en orden
 * de urgencia.
 */
export function prepararLectura(lectura: LecturaFicha): LecturaFicha {
  return {
    ...lectura,
    dominios: ordenarDominios(soloDominiosConocidos(lectura.dominios)).slice(0, TOPES.dominios),
    preguntas: lectura.preguntas.slice(0, TOPES.preguntas),
    detalle: lectura.detalle.slice(0, TOPES.detalle),
    lavados: lectura.lavados.slice(0, TOPES.lavados),
  };
}

/** Si la lectura llegó a sugerir una medicina, o dejó esa decisión para antes. */
export function haySugerencia(lectura: LecturaFicha): boolean {
  return Boolean(lectura.sugerencia.medicina.trim());
}
