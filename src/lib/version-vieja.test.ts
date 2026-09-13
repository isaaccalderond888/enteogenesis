import assert from "node:assert/strict";
import test from "node:test";
import { VENTANA_RECARGA_MS, debeRecargar, esVersionVieja } from "./version-vieja.ts";

test("reconoce el fallo que dejó la pestaña de Isaac fuera tras un despliegue", async () => {
  // Textual, del navegador de Isaac.
  const real = new Error(
    "Failed to fetch dynamically imported module: https://enteogenesis.app/assets/expedientes-zMCE-Zpn.js",
  );
  assert.equal(esVersionVieja(real), true);
});

test("lo reconoce como lo redacta cada navegador", async () => {
  for (const texto of [
    "error loading dynamically imported module",
    "Importing a module script failed.",
    "Unable to preload CSS for /assets/x.css",
    "Failed to load module script: expected a JavaScript module",
  ]) {
    assert.equal(esVersionVieja(new Error(texto)), true, `debería reconocer: ${texto}`);
  }
});

test("no confunde cualquier otro error con una versión vieja", async () => {
  for (const otro of [
    new Error("Cannot read properties of undefined (reading 'toUpperCase')"),
    new Error("No se pudo guardar en el expediente"),
    "La lectura se cortó antes de terminar.",
    null,
    undefined,
    {},
  ]) {
    assert.equal(esVersionVieja(otro), false);
  }
});

function almacenFalso(inicial?: string) {
  let valor = inicial ?? null;
  return {
    getItem: () => valor,
    setItem: (_k: string, v: string) => {
      valor = v;
    },
    leer: () => valor,
  };
}

test("recarga una vez y deja constancia", async () => {
  const almacen = almacenFalso();
  assert.equal(debeRecargar(almacen, 1000), true);
  assert.equal(almacen.leer(), "1000");
});

test("no entra en bucle si la recarga no resolvió nada", async () => {
  // Si el archivo de verdad no está, o no hay red, insistir dejaría a quien lo
  // usa en un ciclo de recargas sin explicación.
  const almacen = almacenFalso();
  debeRecargar(almacen, 1000);
  assert.equal(debeRecargar(almacen, 1000 + VENTANA_RECARGA_MS - 1), false);
});

test("vuelve a permitir la recarga cuando el problema es de otro momento", async () => {
  const almacen = almacenFalso();
  debeRecargar(almacen, 1000);
  assert.equal(debeRecargar(almacen, 1000 + VENTANA_RECARGA_MS + 1), true);
});

test("sin almacenamiento no recarga a ciegas", async () => {
  assert.equal(debeRecargar(undefined, 1000), false);
  const bloqueado = {
    getItem: () => {
      throw new Error("acceso denegado");
    },
    setItem: () => {
      throw new Error("acceso denegado");
    },
  };
  assert.equal(debeRecargar(bloqueado, 1000), false);
});
