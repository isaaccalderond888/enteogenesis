import { z } from "zod";
import type { LecturaFicha } from "./lectura-ficha.ts";

const Observacion = z.object({
  tema: z.string(),
  cita: z.string(),
  porQue: z.string(),
});

/**
 * Cuántos elementos cabe leer de un vistazo en cada lista.
 *
 * Los lavados llevan un tope holgado a propósito: si hay cinco sustancias que
 * suspender, son cinco, y ninguna se cae por cumplir una cuota.
 */
export const TOPES = {
  alertas: 3,
  contradicciones: 3,
  temas: 3,
  seguridad: 4,
  lavados: 8,
  huecos: 4,
  preguntasAbiertas: 5,
} as const;

const Contradiccion = z.object({
  declaro: z.string(),
  reporta: z.string(),
  porQue: z.string(),
});
const Mencion = z.object({ tema: z.string(), cita: z.string() });
const Lavado = z.object({ sustancia: z.string(), ventana: z.string(), porQue: z.string() });

const campos = {
  riesgo: z.enum(["bajo", "medio", "alto"]),
  alertaPrincipal: z.string(),
  alertas: z.array(Observacion),
  contradicciones: z.array(Contradiccion),
  lectura: z.string(),
  fase: z.string(),
  temas: z.array(Observacion),
  seguridad: z.array(Mencion),
  lavados: z.array(Lavado),
  sugerencia: z.object({ medicina: z.string(), dosis: z.string(), porQue: z.string() }),
  huecos: z.array(z.string()),
  preguntasAbiertas: z.array(z.string()),
};

/**
 * La forma que se le pide al modelo, con los topes puestos.
 *
 * Los topes llegan al modelo como parte del esquema, que refuerza lo que el
 * marco ya dice en prosa. No los impone la API: son una señal más, no una reja.
 */
export const EsquemaLectura = z.object({
  ...campos,
  alertas: campos.alertas.max(TOPES.alertas),
  contradicciones: campos.contradicciones.max(TOPES.contradicciones),
  temas: campos.temas.max(TOPES.temas),
  seguridad: campos.seguridad.max(TOPES.seguridad),
  lavados: campos.lavados.max(TOPES.lavados),
  huecos: campos.huecos.max(TOPES.huecos),
  preguntasAbiertas: campos.preguntasAbiertas.max(TOPES.preguntasAbiertas),
});

/**
 * La forma que se acepta de vuelta, sin topes.
 *
 * Deliberadamente más permisiva que la que se pide: una lectura con un tema de
 * más está completa y costó dinero. Rechazarla por eso sería tirar el trabajo
 * entero por una cuota; lo que se hace es recortarla al guardarla.
 *
 * Vive aparte de la llamada a la API porque se usa en dos momentos distintos:
 * al pedirle la lectura al modelo, y al releer una lectura vieja guardada en la
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

/** Recorta una lectura recién generada a lo que cabe leer de un vistazo. */
export function recortarLectura(lectura: LecturaFicha): LecturaFicha {
  return {
    ...lectura,
    alertas: lectura.alertas.slice(0, TOPES.alertas),
    contradicciones: lectura.contradicciones.slice(0, TOPES.contradicciones),
    temas: lectura.temas.slice(0, TOPES.temas),
    seguridad: lectura.seguridad.slice(0, TOPES.seguridad),
    lavados: lectura.lavados.slice(0, TOPES.lavados),
    huecos: lectura.huecos.slice(0, TOPES.huecos),
    preguntasAbiertas: lectura.preguntasAbiertas.slice(0, TOPES.preguntasAbiertas),
  };
}
