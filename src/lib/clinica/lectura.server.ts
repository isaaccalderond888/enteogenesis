import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { formatFicha, type Application } from "../application.ts";
import { MARCO_LECTURA_FICHA, type LecturaFicha } from "./lectura-ficha.ts";
import { EsquemaLectura } from "./esquema.ts";

/**
 * Modelo y versión del marco quedan guardados junto a cada lectura: una lectura
 * clínica envejece cuando cambia cualquiera de los dos, y sin registrarlos no
 * hay forma de saber cuáles hay que rehacer.
 */
export const MODELO = "claude-opus-5";
export const MARCO_VERSION = "1";

/** Lo mínimo que necesita la función para hablar con la API. Facilita probarla. */
export type ClienteLectura = {
  messages: {
    parse: (args: unknown) => Promise<{ parsed_output: unknown; stop_reason?: string | null }>;
  };
};

export class LecturaNoDisponible extends Error {}

/**
 * Produce la lectura clínica de una ficha.
 *
 * El marco va como `system` y con `cache_control`: es el mismo texto en todas
 * las llamadas, así que a partir de la segunda ficha se sirve desde caché y
 * cuesta una fracción. La ficha va como mensaje, que es la parte que cambia.
 *
 * `cliente` sólo se pasa en pruebas; en producción se construye aquí para que la
 * llave nunca salga del servidor.
 */
export async function leerFicha(
  data: Application,
  cliente?: ClienteLectura,
): Promise<LecturaFicha> {
  const api = cliente ?? (crearCliente() as unknown as ClienteLectura);

  const respuesta = await api.messages.parse({
    model: MODELO,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: [
      { type: "text", text: MARCO_LECTURA_FICHA, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `Ficha de admisión a leer:\n\n${formatFicha(data)}`,
      },
    ],
    output_config: { format: zodOutputFormat(EsquemaLectura) },
  });

  // Una negativa del modelo llega con HTTP 200, no como excepción.
  if (respuesta.stop_reason === "refusal") {
    throw new LecturaNoDisponible("El modelo declinó producir la lectura de esta ficha.");
  }
  const salida = EsquemaLectura.safeParse(respuesta.parsed_output);
  if (!salida.success) {
    throw new LecturaNoDisponible("La respuesta no tuvo la forma esperada.");
  }
  return salida.data;
}

function crearCliente(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new LecturaNoDisponible(
      "Falta ANTHROPIC_API_KEY en el entorno: la lectura clínica está apagada.",
    );
  }
  return new Anthropic();
}

/** Si la lectura puede generarse en este despliegue. */
export function lecturaDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
