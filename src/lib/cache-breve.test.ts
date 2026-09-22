import assert from "node:assert/strict";
import test from "node:test";
import { breve, limpiar, olvidar, VIDA_MS } from "./cache-breve.ts";

test("una lectura repetida no vuelve a consultar durante unos segundos", async () => {
  limpiar();
  let veces = 0;
  const leer = async () => { veces += 1; return "datos"; };
  const t = 1_000_000;
  for (let i = 0; i < 500; i++) await breve("k", leer, t + i);
  assert.equal(veces, 1, "500 peticiones idénticas deberían costar una sola consulta");
});

test("pasada la vida, vuelve a consultar", async () => {
  limpiar();
  let veces = 0;
  const leer = async () => { veces += 1; return veces; };
  const t = 2_000_000;
  await breve("k", leer, t);
  await breve("k", leer, t + VIDA_MS - 1);
  assert.equal(veces, 1, "todavía dentro de la ventana");
  await breve("k", leer, t + VIDA_MS + 1);
  assert.equal(veces, 2, "fuera de la ventana debe refrescar");
});

test("las peticiones simultáneas comparten una sola ida a la base", async () => {
  limpiar();
  let veces = 0;
  const leer = async () => {
    veces += 1;
    await new Promise((r) => setTimeout(r, 20));
    return "x";
  };
  // Cien a la vez, como cuando una pestaña desbocada solapa peticiones.
  const todas = await Promise.all(Array.from({ length: 100 }, () => breve("k", leer, 3_000_000)));
  assert.equal(veces, 1);
  assert.deepEqual(new Set(todas), new Set(["x"]));
});

test("cada clave se guarda por separado", async () => {
  limpiar();
  let veces = 0;
  const leer = async () => { veces += 1; return veces; };
  await breve("a", leer, 4_000_000);
  await breve("b", leer, 4_000_000);
  assert.equal(veces, 2);
});

test("olvidar borra lo guardado, también por prefijo", async () => {
  limpiar();
  let veces = 0;
  const leer = async () => { veces += 1; return veces; };
  await breve("ficha:1", leer, 5_000_000);
  await breve("ficha:2", leer, 5_000_000);
  assert.equal(veces, 2);
  olvidar("ficha:");
  await breve("ficha:1", leer, 5_000_000);
  assert.equal(veces, 3, "tras olvidar, la siguiente lectura vuelve a la base");
});

test("un error no se queda pegado: el siguiente intento reintenta", async () => {
  limpiar();
  let veces = 0;
  const leer = async () => {
    veces += 1;
    if (veces === 1) throw new Error("la base no respondió");
    return "bien";
  };
  await assert.rejects(() => breve("k", leer, 6_000_000));
  // Mismo instante: si el fallo se hubiera guardado, esto fallaría también, y
  // un tropiezo de un segundo dejaría el panel roto durante cinco.
  assert.equal(await breve("k", leer, 6_000_000), "bien");
  assert.equal(veces, 2);
});

test("guardar una escritura no deja ver datos viejos", async () => {
  limpiar();
  let valor = "antes";
  const leer = async () => valor;
  const t = 7_000_000;
  assert.equal(await breve("ficha:9", leer, t), "antes");
  valor = "despues";
  // Sin olvidar, seguiría mostrando lo de antes dentro de la ventana.
  assert.equal(await breve("ficha:9", leer, t + 1), "antes");
  olvidar("ficha:9");
  assert.equal(await breve("ficha:9", leer, t + 2), "despues");
});
