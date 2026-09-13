import assert from "node:assert/strict";
import test from "node:test";
import { emptyApplication, type Application } from "../application.ts";
import { MARCO_LECTURA_FICHA } from "./lectura-ficha.ts";
import { readFileSync } from "node:fs";
import {
  LecturaNoDisponible,
  MARCO_VERSION,
  leerFicha,
  type ClienteLectura,
} from "./lectura.server.ts";
import { EsquemaLectura, TOPES, lecturaCompleta } from "./esquema.ts";

const RESPUESTA = {
  riesgo: "alto" as const,
  alertaPrincipal: "Firmó no usar antidepresivos y reporta sertralina diaria.",
  contradicciones: [
    {
      declaro: "no estoy utilizando antidepresivos del tipo ISRS",
      reporta: "sertralina 25 mg diarios",
      porQue: "No es que mienta: no sabe que su medicamento entra en esa lista.",
    },
  ],
  fase: "Estabilización: el duelo es reciente y el sueño no se ha restablecido.",
  lavados: [
    { sustancia: "Sertralina", ventana: "2 semanas", porQue: "Con su prescriptor." },
  ],
  sugerencia: {
    medicina: "Psilocibina",
    dosis: "Dosis moderada",
    porQue: "Primera vez con historia de disociación: entrada gradual.",
  },
  alertas: [
    {
      tema: "Ideación suicida",
      cita: "a veces pienso que estarían mejor sin mí",
      porQue: "Dicho de paso al describir el duelo; hay que preguntarlo directo.",
    },
  ],
  lectura: "Una persona en duelo reciente, con recursos y con una red que nombra.",
  temas: [{ tema: "Duelo reciente", cita: "murió mi padre hace dos meses", porQue: "Fase." }],
  seguridad: [{ tema: "Medicación", cita: "tomo algo para dormir desde entonces" }],
  huecos: ["No dice si hay tratamiento psiquiátrico actual."],
  preguntasAbiertas: ["¿Qué toma exactamente para dormir?"],
};

/** Cliente de mentira: captura la petición y devuelve lo que se le diga. */
function clienteFalso(salida: unknown, extra: Record<string, unknown> = {}) {
  const visto: { args?: Record<string, unknown> } = {};
  const cliente: ClienteLectura = {
    messages: {
      stream: (args: unknown) => {
        visto.args = args as Record<string, unknown>;
        return { finalMessage: async () => ({ parsed_output: salida, ...extra }) };
      },
    },
  };
  return { cliente, visto };
}

/** Cliente que revienta al cerrar el flujo, como cuando el texto vino cortado. */
function clienteQueRevienta(mensaje: string): ClienteLectura {
  return {
    messages: {
      stream: () => ({
        finalMessage: async () => {
          throw new Error(mensaje);
        },
      }),
    },
  };
}

function ficha(): Application {
  return { ...emptyApplication(), nombreCompleto: "Prueba", razones: "Cerrar un duelo" };
}

test("devuelve la lectura con la forma que espera el expediente", async () => {
  const { cliente } = clienteFalso(RESPUESTA);
  const r = await leerFicha(ficha(), cliente);
  assert.equal(r.riesgo, "alto");
  assert.match(r.alertaPrincipal, /sertralina/i);
  assert.equal(r.contradicciones.length, 1);
  assert.equal(r.sugerencia.medicina, "Psilocibina");
  assert.equal(r.lavados[0].ventana, "2 semanas");
  assert.match(r.fase, /estabilizaci/i);
  assert.equal(r.alertas.length, 1);
  assert.equal(r.alertas[0].tema, "Ideación suicida");
  assert.match(r.lectura, /duelo/);
  assert.equal(r.temas[0].cita, "murió mi padre hace dos meses");
  assert.equal(r.huecos.length, 1);
});

test("manda el marco clínico como system y lo deja cacheado", async () => {
  // El marco es idéntico en todas las llamadas: sin cache_control se paga
  // completo en cada ficha.
  const { cliente, visto } = clienteFalso(RESPUESTA);
  await leerFicha(ficha(), cliente);
  const system = visto.args?.system as { text: string; cache_control?: unknown }[];
  assert.equal(system[0].text, MARCO_LECTURA_FICHA);
  assert.deepEqual(system[0].cache_control, { type: "ephemeral" });
});

test("manda la ficha, no el objeto crudo", async () => {
  const { cliente, visto } = clienteFalso(RESPUESTA);
  await leerFicha({ ...ficha(), razones: "Una razón muy reconocible" }, cliente);
  const messages = visto.args?.messages as { role: string; content: string }[];
  assert.equal(messages[0].role, "user");
  assert.match(messages[0].content, /Una razón muy reconocible/);
});

test("usa el modelo vigente y pide pensar", async () => {
  const { cliente, visto } = clienteFalso(RESPUESTA);
  await leerFicha(ficha(), cliente);
  assert.equal(visto.args?.model, "claude-opus-5");
  assert.deepEqual(visto.args?.thinking, { type: "adaptive" });
});

test("una negativa del modelo no se confunde con una lectura vacía", async () => {
  // Llega con HTTP 200, así que sin este control pasaría como lectura válida.
  const { cliente } = clienteFalso(null, { stop_reason: "refusal" });
  await assert.rejects(() => leerFicha(ficha(), cliente), LecturaNoDisponible);
});

test("una respuesta con forma inesperada se rechaza en vez de guardarse a medias", async () => {
  const { cliente } = clienteFalso({ lectura: "solo texto, sin los demás campos" });
  await assert.rejects(() => leerFicha(ficha(), cliente), LecturaNoDisponible);
});

test("un riesgo fuera de los tres niveles se rechaza", async () => {
  const { cliente } = clienteFalso({ ...RESPUESTA, riesgo: "gravísimo" });
  await assert.rejects(() => leerFicha(ficha(), cliente), LecturaNoDisponible);
});

test("el marco obliga a cotejar la declaración contra lo reportado", async () => {
  // Es el hallazgo que ninguna regla de palabras encuentra y el que más veces se
  // escapa leyendo caso por caso: alguien firma que no usa ISRS y en otro campo
  // reporta uno.
  assert.match(MARCO_LECTURA_FICHA, /cotej/i);
  assert.match(MARCO_LECTURA_FICHA, /anticonvulsiv/i);
  assert.match(MARCO_LECTURA_FICHA, /sertralina/i);
  assert.match(MARCO_LECTURA_FICHA, /duloxetina/i);
});

test("el marco encuadra la dosis como punto de partida, no como indicación", async () => {
  assert.match(MARCO_LECTURA_FICHA, /punto de partida para la\s+entrevista/i);
  assert.match(MARCO_LECTURA_FICHA, /no como una indicación/i);
});

test("el marco nombra las reglas que no son negociables", async () => {
  for (const regla of [
    /no admites ni rechazas/i,
    /alertas de riesgo/i,
    /cita textual/i,
    /nunca inventes/i,
    /deseabilidad social/i,
    /esquizofrenia|bipolar/i,
    /defensas altas/i,
  ]) {
    assert.match(MARCO_LECTURA_FICHA, regla, `el marco debería decir ${regla}`);
  }
});

test("una lectura guardada con la forma vigente se relee completa", async () => {
  const releida = lecturaCompleta(JSON.parse(JSON.stringify(RESPUESTA)));
  assert.ok(releida, "la respuesta que produce el modelo debería poder releerse");
  assert.equal(releida.riesgo, "alto");
});

test("una lectura guardada antes de que el marco tuviera riesgo se descarta, no rompe", async () => {
  // Esto ocurrió de verdad: se generaron lecturas con la primera versión del
  // marco, el marco creció, y la pantalla del expediente se cayó al leer un
  // campo que esas lecturas no tenían. Ahora equivalen a no tener lectura.
  const vieja = { ...RESPUESTA } as Record<string, unknown>;
  delete vieja.riesgo;
  delete vieja.alertaPrincipal;
  assert.equal(lecturaCompleta(vieja), null);
});

test("cualquier campo que falte invalida la lectura guardada", async () => {
  for (const campo of Object.keys(RESPUESTA)) {
    const incompleta = { ...RESPUESTA } as Record<string, unknown>;
    delete incompleta[campo];
    assert.equal(
      lecturaCompleta(incompleta),
      null,
      `una lectura sin ${campo} debería descartarse`,
    );
  }
});

test("lo que no es una lectura se descarta sin lanzar", async () => {
  for (const basura of [null, undefined, 0, "", "texto suelto", [], {}]) {
    assert.equal(lecturaCompleta(basura), null);
  }
});

test("pide bastante presupuesto: el modelo piensa con cargo al mismo total", async () => {
  // Con 8000 una ficha larga se quedaba sin espacio y el JSON llegaba cortado.
  const { cliente, visto } = clienteFalso(RESPUESTA);
  await leerFicha(ficha(), cliente);
  assert.ok(
    (visto.args?.max_tokens as number) >= 32000,
    "el presupuesto debería dejar margen para pensar y escribir la lectura entera",
  );
});

test("usa flujo, no una sola respuesta: un presupuesto grande tarda", async () => {
  const { cliente } = clienteFalso(RESPUESTA);
  const r = await leerFicha(ficha(), cliente);
  assert.equal(r.riesgo, "alto");
});

test("una lectura cortada a media frase da un aviso legible, no jerga de JSON", async () => {
  const cliente = clienteQueRevienta(
    "Failed to parse structured output as JSON: Unterminated string in JSON at position 13462",
  );
  await assert.rejects(
    () => leerFicha(ficha(), cliente),
    (error: unknown) => {
      assert.ok(error instanceof LecturaNoDisponible);
      assert.match(error.message, /se cortó antes de terminar/i);
      assert.match(error.message, /vuelve a intentarlo/i);
      return true;
    },
  );
});

test("el aviso en pantalla no arrastra la jerga del error crudo", async () => {
  // Isaac no es programador y lee esto a media entrevista: "Unterminated string
  // in JSON at position 13462" no le dice nada. Eso va al registro del servidor.
  const cliente = clienteQueRevienta(
    "Failed to parse structured output as JSON: Unterminated string at position 13462",
  );
  await assert.rejects(
    () => leerFicha(ficha(), cliente),
    (error: unknown) => {
      assert.ok(error instanceof LecturaNoDisponible);
      assert.doesNotMatch(error.message, /JSON|position|parse|Error:/i);
      assert.ok(error.message.length < 200, "el aviso debería caber en pantalla");
      return true;
    },
  );
});

test("una respuesta que topó con el límite no se guarda a medias", async () => {
  const { cliente } = clienteFalso(RESPUESTA, { stop_reason: "max_tokens" });
  await assert.rejects(
    () => leerFicha(ficha(), cliente),
    (error: unknown) => {
      assert.ok(error instanceof LecturaNoDisponible);
      assert.match(error.message, /incompleta/i);
      return true;
    },
  );
});

test("el marco pone topes de extensión: lo que no se alcanza a leer no se lee", async () => {
  // La primera versión producía ensayos de varias pantallas. Isaac lee esto
  // minutos antes de sentarse con la persona, a veces con varias fichas seguidas.
  assert.match(MARCO_LECTURA_FICHA, /150 palabras/);
  assert.match(MARCO_LECTURA_FICHA, /un solo párrafo/i);
  assert.match(MARCO_LECTURA_FICHA, /no cambia lo que van a hacer o preguntar/i);
  assert.match(MARCO_LECTURA_FICHA, /máximo tres/i);
});

function temas(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    tema: `tema ${i}`,
    cita: "cita",
    porQue: "porque",
  }));
}

test("los topes de cada lista viajan al modelo dentro del esquema que se le pide", async () => {
  assert.equal(EsquemaLectura.safeParse({ ...RESPUESTA, temas: temas(6) }).success, false);
});

test("una lectura con un elemento de más se recorta, no se tira", async () => {
  // Los topes viajan como parte del esquema, pero la API no los impone. Si el
  // modelo se pasa por uno, la lectura está completa y ya costó dinero:
  // rechazarla sería tirar el trabajo entero por una cuota.
  const { cliente } = clienteFalso({ ...RESPUESTA, temas: temas(6) });
  const r = await leerFicha(ficha(), cliente);
  assert.equal(r.temas.length, TOPES.temas);
  assert.equal(r.riesgo, "alto");
});

test("una lectura ya guardada se muestra entera, sin recortarla por detrás", async () => {
  // Recortar al releer borraría de la pantalla material clínico ya producido.
  const guardada = lecturaCompleta({ ...RESPUESTA, temas: temas(6) });
  assert.equal(guardada?.temas.length, 6);
});

test("los lavados no se recortan por cuota: si hay cinco, son cinco", async () => {
  const lavados = Array.from({ length: 5 }, (_, i) => ({
    sustancia: `sustancia ${i}`,
    ventana: "2 semanas",
    porQue: "interacción",
  }));
  const { cliente } = clienteFalso({ ...RESPUESTA, lavados });
  const r = await leerFicha(ficha(), cliente);
  assert.equal(r.lavados.length, 5);
});

test("la versión del marco que muestra el expediente es la que se usa al generar", async () => {
  // El expediente la repite a mano para no arrastrar el SDK al navegador. Si las
  // dos se separan, la pantalla avisa de un marco viejo que en realidad es el
  // vigente, o peor, calla uno que sí quedó atrás.
  const ruta = new URL("../../routes/expedientes_.$id.tsx", import.meta.url);
  const fuente = readFileSync(ruta, "utf8");
  const encontrada = /const MARCO_VERSION_VIGENTE = "([^"]+)"/.exec(fuente)?.[1];
  assert.equal(encontrada, MARCO_VERSION);
});
