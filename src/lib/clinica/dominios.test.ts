import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  DOMINIOS,
  DOMINIOS_FIJOS,
  definicion,
  ordenarDominios,
  soloDominiosConocidos,
} from "./dominios.ts";

test("el piso fijo son las cuatro casillas de seguridad", async () => {
  // Van siempre, aunque estén en verde: si desaparecen cuando no hay hallazgo,
  // quien lee no sabe si es que no hay nada o si es que nadie miró.
  assert.deepEqual(DOMINIOS_FIJOS, ["declaracion", "lavados", "riesgoAgudo", "saludFisica"]);
});

test("suicidio en la familia es un dominio propio, aparte del antecedente familiar", async () => {
  // Cambia una pregunta de la entrevista, no sólo el color de una casilla.
  assert.ok(definicion("suicidioFamiliar"));
  assert.ok(definicion("antecedenteFamiliar"));
  assert.notEqual(
    definicion("suicidioFamiliar")?.rotulo,
    definicion("antecedenteFamiliar")?.rotulo,
  );
});

test("segunda vez está entre los dominios", async () => {
  // Se lo ganó leyendo una ficha real: alguien que ya participó, y la lectura de
  // una segunda vez se hace contra la primera.
  assert.ok(definicion("segundaVez"));
});

test("lo que hay que atender sube arriba del tablero", async () => {
  // Con nueve casillas el tablero sigue siendo legible sólo por esto: sin el
  // orden, lo grave puede caer en la cuarta fila y pasar desapercibido.
  const ordenado = ordenarDominios([
    { clave: "saludFisica", estado: "ok" },
    { clave: "segundaVez", estado: "falta" },
    { clave: "riesgoAgudo", estado: "revisar" },
    { clave: "declaracion", estado: "atender" },
  ]);
  assert.deepEqual(
    ordenado.map((d) => d.estado),
    ["atender", "revisar", "falta", "ok"],
  );
});

test("un hueco va antes que un verde", async () => {
  // En una ficha sin banderas, lo que falta es el hallazgo.
  const ordenado = ordenarDominios([
    { clave: "redSosten", estado: "ok" },
    { clave: "segundaVez", estado: "falta" },
  ]);
  assert.equal(ordenado[0].clave, "segundaVez");
});

test("a igual urgencia manda el orden del catálogo", async () => {
  const ordenado = ordenarDominios([
    { clave: "perinatal", estado: "revisar" },
    { clave: "lavados", estado: "revisar" },
  ]);
  assert.deepEqual(
    ordenado.map((d) => d.clave),
    ["lavados", "perinatal"],
  );
});

test("una casilla con clave inventada se tira en vez de salir sin nombre", async () => {
  const limpio = soloDominiosConocidos([
    { clave: "declaracion" },
    { clave: "vibraEnergetica" },
    { clave: "lavados" },
  ]);
  assert.deepEqual(
    limpio.map((d) => d.clave),
    ["declaracion", "lavados"],
  );
});

test("una clave repetida no pinta dos casillas iguales", async () => {
  const limpio = soloDominiosConocidos([{ clave: "lavados" }, { clave: "lavados" }]);
  assert.equal(limpio.length, 1);
});

test("el marco le da al modelo exactamente las claves que existen", async () => {
  // Si el marco nombra una clave que el catálogo no tiene, esa observación se
  // tira en silencio; si el catálogo tiene una que el marco no nombra, nunca se
  // usa. Las dos listas tienen que ser la misma.
  const marco = readFileSync(new URL("./lectura-ficha.ts", import.meta.url), "utf8");
  const bloque = marco.slice(
    marco.indexOf("ESTAS CUATRO CASILLAS VAN SIEMPRE"),
    marco.indexOf("No inventes claves"),
  );
  for (const d of DOMINIOS) {
    assert.match(bloque, new RegExp(`- ${d.clave} —`), `el marco debería explicar ${d.clave}`);
  }
  const nombradas = [...bloque.matchAll(/^- (\w+) —/gm)].map((m) => m[1]);
  for (const clave of nombradas) {
    assert.ok(definicion(clave), `el marco nombra "${clave}", que no está en el catálogo`);
  }
});

test("la pantalla del expediente sabe el rótulo de cada dominio", async () => {
  for (const d of DOMINIOS) {
    assert.ok(d.rotulo.trim(), `${d.clave} necesita rótulo`);
  }
});
