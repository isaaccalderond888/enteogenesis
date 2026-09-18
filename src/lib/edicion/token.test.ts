import assert from "node:assert/strict";
import test from "node:test";
import {
  AVISOS,
  VIDA_DEL_ENLACE_HORAS,
  estadoDelEnlace,
  fechaDeCaducidad,
  urlDelEnlace,
} from "./enlace.ts";
import { hashDeToken, mismoHash, nuevoToken } from "./token.server.ts";

test("cada enlace es distinto y largo", async () => {
  const vistos = new Set<string>();
  for (let i = 0; i < 200; i++) vistos.add(nuevoToken().token);
  assert.equal(vistos.size, 200, "dos enlaces iguales abrirían la ficha de otra persona");
  assert.ok(nuevoToken().token.length >= 40, "32 bytes en base64url");
});

test("el token no se puede deducir de lo que queda en la base", async () => {
  // En la tabla vive el hash. Si la base se filtra, quien la lea tiene hashes,
  // no enlaces que abren fichas clínicas.
  const { token, hash } = nuevoToken();
  assert.notEqual(hash, token);
  assert.ok(!hash.includes(token));
  assert.match(hash, /^[0-9a-f]{64}$/, "sha-256 en hexadecimal");
});

test("el mismo token siempre da el mismo hash, y otro no", async () => {
  const { token, hash } = nuevoToken();
  assert.equal(hashDeToken(token), hash);
  assert.notEqual(hashDeToken(token + "x"), hash);
});

test("comparar hashes no delata cuánto coincidían", async () => {
  const a = hashDeToken("uno");
  assert.equal(mismoHash(a, a), true);
  assert.equal(mismoHash(a, hashDeToken("dos")), false);
  assert.equal(mismoHash(a, "corto"), false);
});

test("el enlace vive las horas que dice vivir", async () => {
  const ahora = new Date("2026-09-18T10:00:00Z");
  const hasta = fechaDeCaducidad(ahora);
  assert.equal((hasta.getTime() - ahora.getTime()) / 3_600_000, VIDA_DEL_ENLACE_HORAS);
  assert.equal(VIDA_DEL_ENLACE_HORAS, 72);
});

const ahora = new Date("2026-09-18T10:00:00Z");
const enUnaHora = new Date("2026-09-18T11:00:00Z").toISOString();
const haceUnaHora = new Date("2026-09-18T09:00:00Z").toISOString();

test("un enlace vigente abre", async () => {
  assert.equal(
    estadoDelEnlace({ expira_at: enUnaHora, usado_at: null }, ahora),
    "vigente",
  );
});

test("un enlace caducado no abre", async () => {
  assert.equal(
    estadoDelEnlace({ expira_at: haceUnaHora, usado_at: null }, ahora),
    "caducado",
  );
});

test("un enlace ya usado no abre, aunque no haya caducado", async () => {
  assert.equal(
    estadoDelEnlace({ expira_at: enUnaHora, usado_at: haceUnaHora }, ahora),
    "usado",
  );
});

test("un token que no existe no abre", async () => {
  assert.equal(estadoDelEnlace(undefined, ahora), "desconocido");
});

test("justo en el segundo de caducar, ya no abre", async () => {
  assert.equal(
    estadoDelEnlace({ expira_at: ahora.toISOString(), usado_at: null }, ahora),
    "caducado",
  );
});

test("cada motivo tiene una frase que se entiende y dice qué hacer", async () => {
  for (const [motivo, aviso] of Object.entries(AVISOS)) {
    assert.ok(aviso.length > 40, `${motivo}: el aviso debería explicar, no sólo negar`);
    assert.doesNotMatch(aviso, /token|hash|inválido el JWT|error 4\d\d/i, `${motivo}: sin jerga`);
    assert.match(aviso, /pide|escríbele|pídeles/i, `${motivo}: debería decir cómo seguir`);
  }
  // Que no cunda el pánico: lo contestado sigue ahí.
  assert.match(AVISOS.caducado, /sigue guardado/i);
});

test("la dirección del enlace se arma igual con y sin barra final", async () => {
  assert.equal(
    urlDelEnlace("https://enteogenesis.app", "abc"),
    "https://enteogenesis.app/completar/abc",
  );
  assert.equal(
    urlDelEnlace("https://enteogenesis.app/", "abc"),
    "https://enteogenesis.app/completar/abc",
  );
});
