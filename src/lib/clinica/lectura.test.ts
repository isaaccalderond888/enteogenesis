import assert from "node:assert/strict";
import test from "node:test";
import { emptyApplication, type Application } from "../application.ts";
import { MARCO_LECTURA_FICHA } from "./lectura-ficha.ts";
import { LecturaNoDisponible, leerFicha, type ClienteLectura } from "./lectura.server.ts";

const RESPUESTA = {
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
      parse: async (args: unknown) => {
        visto.args = args as Record<string, unknown>;
        return { parsed_output: salida, ...extra };
      },
    },
  };
  return { cliente, visto };
}

function ficha(): Application {
  return { ...emptyApplication(), nombreCompleto: "Prueba", razones: "Cerrar un duelo" };
}

test("devuelve la lectura con la forma que espera el expediente", async () => {
  const { cliente } = clienteFalso(RESPUESTA);
  const r = await leerFicha(ficha(), cliente);
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

test("el marco nombra las reglas que no son negociables", async () => {
  for (const regla of [
    /no admites ni rechazas/i,
    /alertas de riesgo/i,
    /cita textual/i,
    /nunca inventes/i,
    /deseabilidad social/i,
  ]) {
    assert.match(MARCO_LECTURA_FICHA, regla, `el marco debería decir ${regla}`);
  }
});
