import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORY_LABELS, TEST_CONFIGS, type TestId } from "./tests.ts";

const IDS = Object.keys(TEST_CONFIGS) as TestId[];

/** Respuestas en el extremo pedido de la escala, para toda la prueba. */
function todas(id: TestId, extremo: "min" | "max"): number[] {
  const { scale, questions } = TEST_CONFIGS[id];
  const v = extremo === "min" ? scale[0].value : scale[scale.length - 1].value;
  return Array(questions.length).fill(v);
}

// Las escalas se portaron desde otro proyecto. Un error al copiar no rompe el
// build: produce un puntaje plausible pero equivocado, que es peor, porque nadie
// lo nota. Estas pruebas cubren la forma de las 17 a la vez.

test("las 17 escalas están presentes", () => {
  assert.equal(IDS.length, 17);
});

test("cada escala declara preguntas, opciones y bandas", () => {
  for (const id of IDS) {
    const c = TEST_CONFIGS[id];
    assert.ok(c.questions.length > 0, `${id} sin preguntas`);
    assert.ok(c.scale.length > 1, `${id} necesita al menos dos opciones`);
    assert.ok(c.bands.length > 0, `${id} sin bandas de severidad`);
    assert.ok(c.name && c.subtitle && c.disclaimer, `${id} sin nombre, subtítulo o aviso`);
    assert.ok(c.category in CATEGORY_LABELS, `${id} en una categoría inexistente`);
  }
});

test("ningún patrón de respuestas se sale del rango declarado", () => {
  // Sin exigir que el puntaje crezca: escalas como AQ-10 tienen ítems invertidos,
  // donde contestar todo al máximo NO da el máximo, y eso es correcto.
  for (const id of IDS) {
    const c = TEST_CONFIGS[id];
    const alterna = c.questions.map(
      (_, i) => c.scale[i % c.scale.length].value,
    );
    for (const [nombre, respuestas] of [
      ["mínimo", todas(id, "min")],
      ["máximo", todas(id, "max")],
      ["alternado", alterna],
    ] as const) {
      const s = c.computeScore(respuestas);
      assert.ok(Number.isFinite(s), `${id} (${nombre}): puntaje no numérico`);
      assert.ok(
        s >= c.minScore && s <= c.maxScore,
        `${id} (${nombre}): ${s} fuera de [${c.minScore}, ${c.maxScore}]`,
      );
    }
  }
});

test("la última banda alcanza el puntaje máximo", () => {
  // Si no, una persona en el extremo se queda sin lectura.
  for (const id of IDS) {
    const c = TEST_CONFIGS[id];
    const ultima = c.bands[c.bands.length - 1];
    assert.ok(
      ultima.max >= c.computeScore(todas(id, "max")),
      `${id}: el máximo queda fuera de toda banda`,
    );
  }
});

test("cada puntaje posible encuentra una banda", () => {
  for (const id of IDS) {
    const c = TEST_CONFIGS[id];
    for (let s = c.minScore; s <= c.maxScore; s++) {
      assert.ok(c.bands.some((b) => s <= b.max), `${id}: el puntaje ${s} no cae en ninguna banda`);
    }
  }
});

test("las bandas van de menor a mayor", () => {
  for (const id of IDS) {
    const tops = TEST_CONFIGS[id].bands.map((b) => b.max);
    assert.deepEqual(tops, [...tops].sort((a, b) => a - b), `${id}: bandas desordenadas`);
  }
});

test("shortLabels etiqueta las opciones o las preguntas, nunca a medias", () => {
  // El campo se usa de dos maneras en el proyecto original: en AQ-10 y CBI
  // abrevia las OPCIONES; en SDS, SWLS, MEQ-30, PERMA, EBI y CEQ etiqueta las
  // PREGUNTAS. La interfaz de Enteogénesis no lo lee, así que la inconsistencia
  // es inofensiva — pero una cuenta que no coincide con ninguna de las dos sí
  // sería un error al copiar la escala.
  for (const id of IDS) {
    const c = TEST_CONFIGS[id];
    if (!c.shortLabels?.length) continue;
    assert.ok(
      c.shortLabels.length === c.scale.length ||
        c.shortLabels.length === c.questions.length,
      `${id}: ${c.shortLabels.length} etiquetas no cuadran ni con ${c.scale.length} opciones ni con ${c.questions.length} preguntas`,
    );
  }
});

test("las subescalas apuntan a preguntas que existen", () => {
  for (const id of IDS) {
    const c = TEST_CONFIGS[id];
    for (const sub of c.subScales ?? []) {
      assert.ok(sub.indices.length > 0, `${id}/${sub.label} sin ítems`);
      for (const i of sub.indices) {
        assert.ok(
          i >= 0 && i < c.questions.length,
          `${id}/${sub.label}: el ítem ${i} no existe`,
        );
      }
      assert.ok(sub.bands.length > 0, `${id}/${sub.label} sin bandas`);
    }
  }
});

test("PHQ-9 respondido al máximo da 27 y cae en la banda más alta", () => {
  // Anclaje contra la escala publicada: 9 ítems de 0 a 3.
  const c = TEST_CONFIGS.PHQ9;
  assert.equal(c.questions.length, 9);
  assert.equal(c.computeScore(todas("PHQ9", "max")), 27);
  assert.equal(c.computeScore(todas("PHQ9", "min")), 0);
});

test("GAD-7 respondido al máximo da 21", () => {
  const c = TEST_CONFIGS.GAD7;
  assert.equal(c.questions.length, 7);
  assert.equal(c.computeScore(todas("GAD7", "max")), 21);
});

test("DASS-21 reparte sus 21 ítems en tres subescalas sin repetirlos", () => {
  const c = TEST_CONFIGS.DASS21;
  assert.equal(c.questions.length, 21);
  const usados = (c.subScales ?? []).flatMap((s) => s.indices);
  assert.equal(usados.length, 21, "cada ítem pertenece a una subescala");
  assert.equal(new Set(usados).size, 21, "ningún ítem cuenta dos veces");
});
