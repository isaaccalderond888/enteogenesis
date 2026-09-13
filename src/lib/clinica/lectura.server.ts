import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { formatFicha, type Application } from "../application.ts";
import { MARCO_LECTURA_FICHA, type LecturaFicha } from "./lectura-ficha.ts";
import { EsquemaLectura, lecturaCompleta, recortarLectura } from "./esquema.ts";

/**
 * Modelo y versión del marco quedan guardados junto a cada lectura: una lectura
 * clínica envejece cuando cambia cualquiera de los dos, y sin registrarlos no
 * hay forma de saber cuáles hay que rehacer.
 */
export const MODELO = "claude-opus-5";
export const MARCO_VERSION = "2";

/**
 * Presupuesto de salida de una lectura.
 *
 * El modelo piensa antes de escribir y ese razonamiento se descuenta del mismo
 * presupuesto que la respuesta. Con 8000 una ficha larga se quedaba sin espacio
 * a media frase y el JSON llegaba cortado ("Unterminated string"). 32000 deja
 * margen de sobra para lo que piensa más la lectura completa.
 */
const MAX_TOKENS = 32000;

/** Lo mínimo que necesita la función para hablar con la API. Facilita probarla. */
export type RespuestaLectura = {
  parsed_output: unknown;
  stop_reason?: string | null;
};
export type ClienteLectura = {
  messages: {
    stream: (args: unknown) => { finalMessage: () => Promise<RespuestaLectura> };
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

  const flujo = api.messages.stream({
    model: MODELO,
    max_tokens: MAX_TOKENS,
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
    output_config: { format: formatoDeSalida() },
  });

  let respuesta: RespuestaLectura;
  try {
    respuesta = await flujo.finalMessage();
  } catch (error) {
    // El SDK arma la lectura al cerrar el flujo y ahí revienta si el texto vino
    // cortado. El error crudo habla de JSON y de posiciones; quien lo va a leer
    // es Isaac o Claudia a media entrevista, no un programador: el detalle va al
    // registro del servidor y a la pantalla va una frase que se entiende.
    console.error("[lectura] falló al cerrar el flujo:", error);
    throw new LecturaNoDisponible("La lectura se cortó antes de terminar. Vuelve a intentarlo.");
  }

  // Una negativa del modelo llega con HTTP 200, no como excepción.
  if (respuesta.stop_reason === "refusal") {
    throw new LecturaNoDisponible("El modelo declinó producir la lectura de esta ficha.");
  }
  if (respuesta.stop_reason === "max_tokens") {
    throw new LecturaNoDisponible(
      "La lectura salió más larga de lo que cabe en una respuesta y quedó incompleta.",
    );
  }
  const salida = lecturaCompleta(respuesta.parsed_output);
  if (!salida) {
    throw new LecturaNoDisponible("La respuesta no tuvo la forma esperada.");
  }
  return recortarLectura(salida);
}

/**
 * El formato que se le pide al modelo: el esquema con topes, pero con la lectura
 * del resultado a cargo nuestro.
 *
 * Los topes viajan al modelo como parte del esquema, no como una regla que la
 * API imponga. Si el modelo devolviera un elemento de más, dejar que el SDK
 * validara contra esos topes tiraría la lectura entera —completa y ya pagada—
 * por una cuota. Así llega cruda y se recorta después.
 */
function formatoDeSalida() {
  return { ...zodOutputFormat(EsquemaLectura), parse: (texto: string) => JSON.parse(texto) };
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
