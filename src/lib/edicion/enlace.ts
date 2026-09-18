/**
 * Lo del enlace que también necesita el navegador.
 *
 * Vive aparte de `token.server.ts` porque aquélla usa `node:crypto`, y con un
 * solo módulo el componente del expediente arrastraba crypto al navegador y la
 * pantalla se caía entera.
 */

/**
 * Cuánto vive un enlace para completar una ficha.
 *
 * Tres días: lo que tarda alguien en ver el mensaje, sentarse con calma y
 * responder lo que faltaba. Más corto obliga a pedir otro; más largo deja una
 * puerta abierta a la ficha clínica de una persona durante semanas.
 */
export const VIDA_DEL_ENLACE_HORAS = 72;

export type EstadoEnlace = "vigente" | "caducado" | "usado" | "desconocido";

/** Por qué un enlace no sirve, para poder decirlo en una frase entendible. */
export function estadoDelEnlace(
  fila: { expira_at: string | Date; usado_at: string | Date | null } | undefined,
  ahora: Date = new Date(),
): EstadoEnlace {
  if (!fila) return "desconocido";
  if (fila.usado_at) return "usado";
  if (new Date(fila.expira_at).getTime() <= ahora.getTime()) return "caducado";
  return "vigente";
}

export const AVISOS: Record<Exclude<EstadoEnlace, "vigente">, string> = {
  caducado:
    "Este enlace ya caducó. Escríbele a quien te lo mandó y te enviamos uno nuevo; lo que ya habías contestado sigue guardado.",
  usado:
    "Este enlace ya se usó para guardar tus cambios. Si te falta algo más, pide otro y seguimos desde donde quedó.",
  desconocido:
    "Este enlace no es válido. Puede estar incompleto al copiarlo: pide uno nuevo a quien te lo mandó.",
};

export function fechaDeCaducidad(desde: Date = new Date()): Date {
  return new Date(desde.getTime() + VIDA_DEL_ENLACE_HORAS * 60 * 60 * 1000);
}

/** La dirección que se le pasa a la persona. */
export function urlDelEnlace(origen: string, token: string): string {
  return `${origen.replace(/\/$/, "")}/completar/${token}`;
}
