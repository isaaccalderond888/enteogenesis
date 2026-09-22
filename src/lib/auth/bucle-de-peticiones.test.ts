import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Guarda contra el bucle que agotó la cuota de Vercel y de Neon.
 *
 * `useCurrentUserState()` devolvía un objeto nuevo en cada render. Los efectos
 * de Expedientes dependían de ese objeto, así que se disparaban de nuevo cada
 * vez; y como guardan lo que traen, provocaban otro render. Una pestaña abierta
 * pedía ~140 veces por segundo sin que nadie tocara nada: 852 peticiones en 12
 * segundos, medidas en el navegador.
 *
 * Son dos barreras, y las dos se prueban aquí, porque cualquiera de las dos
 * sola vuelve a abrir la puerta.
 */

const RAIZ = new URL("../../", import.meta.url).pathname;

function fuentes(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(join(RAIZ, dir), { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...fuentes(ruta));
    else if (/\.tsx?$/.test(entrada.name) && !entrada.name.includes(".test."))
      salida.push(ruta);
  }
  return salida;
}

test("el objeto del usuario se memoiza y no nace de nuevo en cada render", async () => {
  const src = readFileSync(join(RAIZ, "lib/auth/use-current-user.ts"), "utf8");
  assert.match(
    src,
    /useMemo\(/,
    "sin useMemo, cada render entrega un usuario distinto y los efectos se reanudan solos",
  );
  // Las dependencias tienen que ser primitivas. `[user]` memoiza contra el
  // mismo objeto inestable y no memoiza nada.
  const deps = src.match(/\[\s*user\?\.\w+[\s\S]*?\]/);
  assert.ok(deps, "las dependencias del useMemo deberían ser los campos, no el objeto");
});

test("ningún efecto depende del objeto del usuario, sólo de su identificador", async () => {
  const ofensores: string[] = [];
  for (const archivo of [...fuentes("routes"), ...fuentes("components")]) {
    const src = readFileSync(join(RAIZ, archivo), "utf8");
    // Arreglos de dependencias que incluyen `user` pelado (no `user?.id`,
    // no `userId`).
    for (const m of src.matchAll(/\}\s*,\s*\[([^\]]*)\]\s*\)/g)) {
      const partes = m[1].split(",").map((d) => d.trim());
      if (partes.includes("user")) ofensores.push(`${archivo}: [${m[1].trim()}]`);
    }
  }
  assert.deepEqual(
    ofensores,
    [],
    "depender del objeto `user` reabre el bucle: usa `user?.id`",
  );
});
