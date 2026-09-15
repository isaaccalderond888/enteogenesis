import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { SITE } from "./site.ts";

/**
 * Los nombres del equipo no se escriben a mano en la interfaz.
 *
 * Se decidió hablar de «los facilitadores» porque nombrar a Isaac y a Claudia
 * creaba la expectativa de que ellos dos hacen todas las entrevistas, y también
 * las hace Isaura. Cambiar la constante no bastó: quedaron once menciones
 * sueltas repartidas por las pantallas, escritas a mano en su momento. Esta
 * prueba existe para que la próxima vez se note sola.
 */
const NOMBRES = ["Isaac", "Claudia", "Isaura", "Calderón", "Saviñón", "Madinabeita"];

/** Archivos donde el nombre propio sí tiene razón de ser. */
const PERMITIDOS = new Set([
  // La única fuente: aquí viven los contactos y la lista de acceso.
  "lib/site.ts",
  // El marco clínico es de Isaac y se le dice al modelo de quién es.
  "lib/clinica/lectura-ficha.ts",
  // Quien administra la lista de acceso es Isaac: decirlo ayuda a quien se topa
  // con el mensaje.
  "lib/auth/server.ts",
]);

/**
 * Frases donde el nombre es una atribución de autoría, no un «quién te
 * acompaña».
 *
 * Los marcos clínicos son de Isaac y decirlo es correcto: nombra de quién es el
 * criterio con el que está leída la ficha. Es distinto de prometerle a alguien
 * que Isaac hará su entrevista.
 */
const ATRIBUCIONES = ["marcos terapéuticos de Isaac"];

function archivosDeInterfaz(dir: string, base = ""): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = `${dir}/${nombre}`;
    const relativa = base ? `${base}/${nombre}` : nombre;
    if (statSync(ruta).isDirectory()) {
      salida.push(...archivosDeInterfaz(ruta, relativa));
    } else if (/\.tsx?$/.test(nombre) && !/\.test\.tsx?$/.test(nombre)) {
      salida.push(relativa);
    }
  }
  return salida;
}

test("ninguna pantalla nombra a una persona del equipo a mano", async () => {
  const raiz = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
  const sueltos: string[] = [];
  for (const relativa of archivosDeInterfaz(raiz)) {
    if (PERMITIDOS.has(relativa)) continue;
    const fuente = readFileSync(`${raiz}/${relativa}`, "utf8");
    for (const [i, linea] of fuente.split("\n").entries()) {
      // Un comentario puede nombrarlos: explica una decisión, no se muestra.
      let codigo = linea.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
      if (/^\s*\*/.test(linea)) continue;
      for (const frase of ATRIBUCIONES) codigo = codigo.replace(frase, "");
      for (const nombre of NOMBRES) {
        if (codigo.includes(nombre)) {
          sueltos.push(`${relativa}:${i + 1} · ${linea.trim().slice(0, 80)}`);
        }
      }
    }
  }
  assert.deepEqual(
    sueltos,
    [],
    `usa SITE.facilitators o SITE.facilitatorsTitle en vez del nombre:\n  ${sueltos.join("\n  ")}`,
  );
});

test("hay una forma para media frase y otra para empezarla", async () => {
  // Sin la segunda, la frase que abre una oración se acaba escribiendo a mano,
  // que es exactamente como se colaron las menciones sueltas.
  assert.equal(SITE.facilitators, "los facilitadores");
  assert.match(SITE.facilitatorsTitle, /^El equipo/);
});
