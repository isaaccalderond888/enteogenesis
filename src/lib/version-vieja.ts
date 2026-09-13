/**
 * Reconoce el fallo que deja una pestaña abierta desde antes de un despliegue.
 *
 * Al publicar, los archivos del sitio cambian de nombre. Una pestaña que lleva
 * rato abierta sigue pidiendo los nombres viejos, que ya no existen, y el
 * navegador falla al cargarlos. No es un error del sitio: es una pestaña que se
 * quedó atrás, y se arregla recargando.
 *
 * Cada navegador lo redacta distinto, así que se reconocen todas las formas.
 */
const SEÑALES = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "unable to preload css",
  "failed to load module script",
];

export function esVersionVieja(error: unknown): boolean {
  const texto = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const enMinusculas = texto.toLowerCase();
  return SEÑALES.some((señal) => enMinusculas.includes(señal));
}

/** Cuánto se espera antes de dar por fallida una recarga y dejar de insistir. */
export const VENTANA_RECARGA_MS = 20_000;
const CLAVE = "enteogenesis:recarga-por-version";

/**
 * Decide si conviene recargar, dejando constancia para no entrar en bucle.
 *
 * Si la recarga no resolvió el problema —el archivo de verdad no está, o no hay
 * red— insistir dejaría a la persona en un ciclo de recargas sin explicación.
 * Se intenta una vez; la segunda muestra el aviso y para.
 */
export function debeRecargar(
  almacen: Pick<Storage, "getItem" | "setItem"> | undefined,
  ahora: number = Date.now(),
): boolean {
  if (!almacen) return false;
  let previo: string | null = null;
  try {
    previo = almacen.getItem(CLAVE);
  } catch {
    // Un navegador con el almacenamiento bloqueado: mejor no recargar a ciegas.
    return false;
  }
  const antes = previo ? Number(previo) : 0;
  if (antes && ahora - antes < VENTANA_RECARGA_MS) return false;
  try {
    almacen.setItem(CLAVE, String(ahora));
  } catch {
    return false;
  }
  return true;
}
