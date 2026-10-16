import assert from "node:assert/strict";
import test from "node:test";
import { RETREATS } from "./application.ts";
import {
  TODOS_LOS_RETIROS,
  coincideElRetiro,
  etiquetaDeRetiro,
  retirosDeLasFichas,
} from "./retiros.ts";

const ENTEO = RETREATS[0].label;
const VIVA = RETREATS[1].label;

test("la lista sale de las fichas, no de una lista escrita a mano", async () => {
  // Un retiro que nadie eligió no debería ensuciar el desplegable.
  const r = retirosDeLasFichas([{ retiro: VIVA }, { retiro: VIVA }]);
  assert.deepEqual(r.map((x) => x.valor), [VIVA]);
  assert.equal(r[0].cuantas, 2);
});

test("cuenta bien cuántas fichas tiene cada retiro", async () => {
  const r = retirosDeLasFichas([
    { retiro: ENTEO }, { retiro: VIVA }, { retiro: ENTEO }, { retiro: ENTEO },
  ]);
  assert.deepEqual(r, [{ valor: ENTEO, cuantas: 3 }, { valor: VIVA, cuantas: 1 }]);
});

test("los del catálogo salen en su orden, no alfabético", async () => {
  // Si ordenara por texto, «15 – 18 octubre» iría antes que «25 – 27 septiembre»
  // y el desplegable contradiría el orden del formulario.
  const r = retirosDeLasFichas([{ retiro: VIVA }, { retiro: ENTEO }]);
  assert.deepEqual(r.map((x) => x.valor), [ENTEO, VIVA]);
});

test("una fecha escrita a mano también se puede filtrar, y va al final", async () => {
  const r = retirosDeLasFichas([
    { retiro: "Cuando abran el siguiente" }, { retiro: ENTEO },
  ]);
  assert.deepEqual(r.map((x) => x.valor), [ENTEO, "Cuando abran el siguiente"]);
});

test("las escritas a mano no bailan de posición entre recargas", async () => {
  const fichas = [{ retiro: "Zacatecas" }, { retiro: "Abril" }, { retiro: "Marzo" }];
  const una = retirosDeLasFichas(fichas).map((x) => x.valor);
  const otra = retirosDeLasFichas([...fichas].reverse()).map((x) => x.valor);
  assert.deepEqual(una, otra, "el mismo archivo debe dar siempre el mismo orden");
  assert.deepEqual(una, ["Abril", "Marzo", "Zacatecas"]);
});

test("una ficha sin retiro no inventa una opción vacía", async () => {
  const r = retirosDeLasFichas([{ retiro: "" }, { retiro: "   " }, { retiro: ENTEO }]);
  assert.deepEqual(r.map((x) => x.valor), [ENTEO]);
});

test("«todos» no esconde ninguna ficha", async () => {
  for (const v of [ENTEO, VIVA, "lo que sea", ""]) {
    assert.equal(coincideElRetiro(v, TODOS_LOS_RETIROS), true);
  }
});

test("filtrar por un retiro deja fuera a los demás", async () => {
  assert.equal(coincideElRetiro(ENTEO, ENTEO), true);
  assert.equal(coincideElRetiro(VIVA, ENTEO), false);
});

test("un espacio de más al guardar no deja la ficha fuera de su retiro", async () => {
  assert.equal(coincideElRetiro(`  ${ENTEO}  `, ENTEO), true);
});

test("el nombre del retiro va primero, que es lo que se distingue", async () => {
  // En un desplegable angosto la fecha se ve y el nombre se corta, que es
  // justo al revés de lo que hace falta para elegir.
  assert.equal(
    etiquetaDeRetiro("25 – 27 septiembre 2026 · Enteogénesis"),
    "Enteogénesis · 25 – 27 septiembre 2026",
  );
  assert.equal(
    etiquetaDeRetiro("15 – 18 octubre 2026 · Integración Viva"),
    "Integración Viva · 15 – 18 octubre 2026",
  );
});

test("una fecha escrita a mano se muestra tal cual", async () => {
  assert.equal(etiquetaDeRetiro("Cuando abran el siguiente"), "Cuando abran el siguiente");
  assert.equal(etiquetaDeRetiro("Otra fecha / próximo proceso"), "Otra fecha / próximo proceso");
});
