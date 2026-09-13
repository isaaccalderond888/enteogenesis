import { z } from "zod";
import type { LecturaFicha } from "./lectura-ficha.ts";

const Observacion = z.object({
  tema: z.string(),
  cita: z.string(),
  porQue: z.string(),
});

/**
 * La forma exacta que debe tener una lectura clínica.
 *
 * Vive aparte de la llamada a la API porque se usa en dos momentos distintos:
 * al pedirle la lectura al modelo, y al releer una lectura vieja guardada en la
 * base. Si el marco cambia de campos, una lectura guardada con la forma anterior
 * deja de pasar por aquí y se regenera, en vez de romper la página.
 */
export const EsquemaLectura = z.object({
  riesgo: z.enum(["bajo", "medio", "alto"]),
  alertaPrincipal: z.string(),
  alertas: z.array(Observacion),
  contradicciones: z.array(
    z.object({ declaro: z.string(), reporta: z.string(), porQue: z.string() }),
  ),
  lectura: z.string(),
  fase: z.string(),
  temas: z.array(Observacion),
  seguridad: z.array(z.object({ tema: z.string(), cita: z.string() })),
  lavados: z.array(
    z.object({ sustancia: z.string(), ventana: z.string(), porQue: z.string() }),
  ),
  sugerencia: z.object({ medicina: z.string(), dosis: z.string(), porQue: z.string() }),
  huecos: z.array(z.string()),
  preguntasAbiertas: z.array(z.string()),
});

/**
 * Devuelve la lectura sólo si está completa. Una lectura a medias (guardada con
 * una versión anterior del marco, o escrita a mano en la base) equivale a no
 * tenerla: la pantalla ofrece generarla de nuevo.
 */
export function lecturaCompleta(valor: unknown): LecturaFicha | null {
  const salida = EsquemaLectura.safeParse(valor);
  return salida.success ? (salida.data as LecturaFicha) : null;
}
