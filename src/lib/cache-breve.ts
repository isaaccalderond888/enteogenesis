/**
 * Memoria de segundos para lecturas repetidas, del lado del servidor.
 *
 * Nació de una noche concreta: una pestaña con código viejo pedía la lista de
 * expedientes unas 140 veces por segundo. El defecto del navegador ya está
 * corregido, pero una pestaña que quedó abierta antes del despliegue sigue
 * ejecutando el código viejo hasta que alguien la recargue, y nadie puede
 * recargar la pestaña de otra persona.
 *
 * Esto no la detiene —no hay forma desde aquí—, pero hace que deje de costar:
 * mil peticiones idénticas se convierten en una sola consulta a la base.
 *
 * No es un límite ni un candado: nadie recibe un error, nadie nota nada. Lo
 * único que cambia es que la respuesta puede venir de hace unos segundos.
 *
 * Se guarda la PROMESA, no el resultado: con peticiones solapándose, cien
 * llamadas simultáneas comparten una sola ida a la base en vez de arrancar cien.
 */

type Entrada = { expira: number; valor: Promise<unknown> };

const almacen = new Map<string, Entrada>();

/**
 * Cuánto vale una lectura antes de volver a preguntar.
 *
 * Cinco segundos: invisible para quien usa el panel —nadie percibe que una
 * lista tiene cinco segundos— y suficiente para que una pestaña desbocada
 * consuma una consulta en vez de setecientas.
 */
export const VIDA_MS = 5_000;

/** Tope de entradas, para que un proceso largo no crezca sin freno. */
const TOPE = 500;

export function limpiar(): void {
  almacen.clear();
}

/**
 * Olvida lo guardado bajo una clave, o bajo todas las que empiecen igual.
 *
 * Se llama después de escribir. Sin esto, guardar una nota y volver a la lista
 * podría mostrar los datos de hace unos segundos, que es justo el momento en que
 * alguien mira para confirmar que su cambio quedó.
 */
export function olvidar(prefijo: string): void {
  for (const clave of [...almacen.keys()]) {
    if (clave === prefijo || clave.startsWith(prefijo)) almacen.delete(clave);
  }
}

export async function breve<T>(
  clave: string,
  producir: () => Promise<T>,
  ahora: number = Date.now(),
  vidaMs: number = VIDA_MS,
): Promise<T> {
  const guardada = almacen.get(clave);
  if (guardada && guardada.expira > ahora) return guardada.valor as Promise<T>;

  const valor = producir();
  almacen.set(clave, { expira: ahora + vidaMs, valor });

  // Un fallo no se queda pegado cinco segundos: el siguiente intento reintenta.
  void valor.catch(() => {
    const actual = almacen.get(clave);
    if (actual?.valor === valor) almacen.delete(clave);
  });

  if (almacen.size > TOPE) {
    for (const [k, v] of almacen) {
      if (v.expira <= ahora) almacen.delete(k);
    }
    // Si aun así sigue lleno, se tira lo más viejo primero.
    while (almacen.size > TOPE) {
      const primera = almacen.keys().next();
      if (primera.done) break;
      almacen.delete(primera.value);
    }
  }
  return valor;
}
