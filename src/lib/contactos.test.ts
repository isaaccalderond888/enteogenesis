import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { SITE } from "./site.ts";

test("están los tres facilitadores, y la línea pública no es uno de ellos", async () => {
  assert.equal(SITE.contacts.length, 3);
  for (const c of SITE.contacts) {
    assert.ok(c.name.trim(), "cada contacto necesita nombre");
    assert.ok(c.tel.startsWith("+52"), `${c.name} debería llevar código de país`);
  }
});

test("el teléfono para marcar tiene los dígitos que se marcan hoy en México", async () => {
  // Desde 2019 se marca +52 y diez dígitos. El "1" intermedio que conserva
  // WhatsApp es el formato viejo y puede fallar al llamar.
  for (const c of SITE.contacts) {
    assert.match(c.tel, /^\+52\d{10}$/, `${c.name}: ${c.tel} no son diez dígitos tras el +52`);
  }
});

test("lo que se muestra y lo que se marca son el mismo número", async () => {
  // Es fácil corregir uno y olvidar el otro, y entonces la pantalla dice un
  // número y el enlace llama a otro.
  for (const c of SITE.contacts) {
    assert.equal(
      c.display.replace(/\s/g, ""),
      c.tel,
      `${c.name}: lo que se lee no coincide con lo que se marca`,
    );
  }
});

test("la urgencia se nombra, pero después de los facilitadores", async () => {
  // El orden es la parte clínica: un bajón después de una sesión no es una
  // crisis de riesgo vital. Ponerlos al revés patologiza algo esperable y de paso
  // enseña a no avisar; y quien sí está en riesgo necesita ver la urgencia
  // aparte, no mezclada en la misma frase.
  const fuente = readFileSync(
    new URL("../components/a-quien-avisar.tsx", import.meta.url),
    "utf8",
  );
  const contactos = fuente.indexOf("SITE.contacts.map");
  const urgencia = fuente.indexOf("peligro inmediato");
  assert.ok(contactos > 0 && urgencia > 0, "tienen que estar los dos bloques");
  assert.ok(contactos < urgencia, "la urgencia no debería ir antes que los facilitadores");
});

test("no queda ningún teléfono de crisis sin verificar en el sitio", async () => {
  // El que venía heredado nunca se pudo comprobar, y un número que no sabemos si
  // contesta es peor que ninguno: quien marca en un mal momento y no obtiene
  // respuesta aprende que pedir ayuda no sirve.
  for (const archivo of [
    "../lib/site.ts",
    "../components/a-quien-avisar.tsx",
    "../components/ficha.tsx",
    "../routes/evaluaciones_.$id.tsx",
  ]) {
    const fuente = readFileSync(new URL(archivo, import.meta.url), "utf8");
    assert.doesNotMatch(fuente, /800\s?911\s?2000|Línea de la Vida/, `${archivo} todavía la trae`);
  }
});

test("las páginas con los teléfonos no se ofrecen a los buscadores", async () => {
  // Son móviles personales: se comparten por enlace con quien ya aplicó.
  for (const ruta of ["preparacion", "integracion"]) {
    const fuente = readFileSync(new URL(`../routes/${ruta}.tsx`, import.meta.url), "utf8");
    assert.match(fuente, /noindex/, `/${ruta} debería llevar noindex`);
  }
});
