import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * El token va aleatorio y en la base sólo su hash, en vez de ir firmado.
 *
 * Un token firmado se valida sin tocar la base, pero no se puede invalidar: una
 * vez emitido vale hasta que caduque, aunque la persona ya haya guardado o
 * aunque el enlace se reenvíe a quien no debe. Como aquí hace falta invalidarlo
 * al primer guardado, el estado tiene que vivir en la base de todos modos — y
 * entonces guardar el hash sale gratis y protege de una fuga: quien lea la tabla
 * tiene hashes, no enlaces que abren fichas clínicas.
 *
 * Sólo servidor: `node:crypto` no existe en el navegador.
 */
export function nuevoToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashDeToken(token) };
}

export function hashDeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Compara dos hashes sin que el tiempo de respuesta revele cuánto coincidían. */
export function mismoHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}
