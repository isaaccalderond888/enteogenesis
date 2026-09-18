import { createServerFn } from "@tanstack/react-start";
import {
  emptyApplication,
  lectura,
  retreatLabel,
  safetyFlags,
  validateApplication,
  type Application,
} from "@/lib/application";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { requireStaff } from "@/lib/fichas";
import {
  AVISOS,
  estadoDelEnlace,
  fechaDeCaducidad,
  urlDelEnlace,
  VIDA_DEL_ENLACE_HORAS,
  type EstadoEnlace,
} from "./enlace.ts";
import { hashDeToken, nuevoToken } from "./token.server.ts";

export { VIDA_DEL_ENLACE_HORAS };

type FilaEnlace = {
  ficha_id: string;
  expira_at: string;
  usado_at: string | null;
};

/**
 * Crea un enlace para que quien llenó la ficha la complete o corrija.
 *
 * Sólo staff. Devuelve el token en claro una vez: en la base queda su hash, así
 * que ni nosotros podemos recuperarlo después. Si se pierde, se genera otro.
 */
export const crearEnlaceEdicion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await requireStaff(context.userId);
    const sql = await getSql();

    const filas = await sql<{ id: string; nombre: string }>`
      select id, nombre from fichas where id = ${id} limit 1
    `;
    if (!filas[0]) throw new Error("No existe esa ficha.");

    // Los enlaces anteriores de esta ficha se caducan: si alguien pide uno
    // nuevo, el viejo ya no debería abrir nada.
    await sql`
      update ficha_links set expira_at = now()
      where ficha_id = ${id} and usado_at is null and expira_at > now()
    `;

    const { token, hash } = nuevoToken();
    const expira = fechaDeCaducidad();
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const sesion = await getSessionUser();

    await sql`
      insert into ficha_links (token_hash, ficha_id, creado_por, expira_at)
      values (${hash}, ${id}, ${(sesion?.email ?? "").trim().toLowerCase()}, ${expira.toISOString()})
    `;

    return {
      token,
      expiraAt: expira.toISOString(),
      nombre: filas[0].nombre,
      horas: VIDA_DEL_ENLACE_HORAS,
    };
  });

export type FichaParaCompletar =
  | { ok: true; data: Application; nombre: string }
  | { ok: false; estado: Exclude<EstadoEnlace, "vigente">; aviso: string };

/**
 * Abre la ficha que corresponde a un enlace, para prellenar el formulario.
 *
 * Pública a propósito: quien tiene el enlace no necesita cuenta. Abrirla no
 * consume el enlace — si lo consumiera, cerrar la pestaña dejaría a la persona
 * fuera de su propia ficha.
 */
export const fichaPorEnlace = createServerFn({ method: "GET" })
  .validator((token: string) => token)
  .handler(async ({ data: token }): Promise<FichaParaCompletar> => {
    const sql = await getSql();
    const filas = await sql<FilaEnlace>`
      select ficha_id, expira_at, usado_at
      from ficha_links where token_hash = ${hashDeToken(token)} limit 1
    `;
    const estado = estadoDelEnlace(filas[0]);
    if (estado !== "vigente") return { ok: false, estado, aviso: AVISOS[estado] };

    const fichas = await sql<{ payload: string; nombre: string }>`
      select payload, nombre from fichas where id = ${filas[0].ficha_id} limit 1
    `;
    if (!fichas[0]) {
      return { ok: false, estado: "desconocido", aviso: AVISOS.desconocido };
    }
    let data: Application;
    try {
      data = { ...emptyApplication(), ...(JSON.parse(fichas[0].payload) as Application) };
    } catch {
      return { ok: false, estado: "desconocido", aviso: AVISOS.desconocido };
    }
    return { ok: true, data, nombre: fichas[0].nombre };
  });

/**
 * Guarda los cambios de la persona sobre su propia ficha.
 *
 * Actualiza el mismo registro —no crea una ficha nueva—, archiva la versión
 * anterior y consume el enlace. Todo en una transacción: si algo falla a mitad,
 * no queda una ficha editada con el enlace todavía abierto, ni al revés.
 */
export const guardarPorEnlace = createServerFn({ method: "POST" })
  .validator((input: { token: string; data: Application }) => input)
  .handler(async ({ data: { token, data } }) => {
    const mensaje = validateApplication(data);
    if (mensaje) throw new Error(mensaje);

    const sql = await getSql();
    const hash = hashDeToken(token);

    const filas = await sql<FilaEnlace>`
      select ficha_id, expira_at, usado_at
      from ficha_links where token_hash = ${hash} limit 1
    `;
    const estado = estadoDelEnlace(filas[0]);
    if (estado !== "vigente") throw new Error(AVISOS[estado]);
    const fichaId = filas[0].ficha_id;

    const previas = await sql<{ payload: string }>`
      select payload from fichas where id = ${fichaId} limit 1
    `;
    if (!previas[0]) throw new Error(AVISOS.desconocido);

    const flags = safetyFlags(data);

    await sql`begin`;
    try {
      // El enlace se consume primero y sólo si seguía sin usar: dos pestañas
      // guardando a la vez no pueden escribir las dos.
      const consumido = await sql<{ token_hash: string }>`
        update ficha_links set usado_at = now()
        where token_hash = ${hash} and usado_at is null and expira_at > now()
        returning token_hash
      `;
      if (!consumido.length) throw new Error(AVISOS.usado);

      // La versión anterior se archiva antes de sobrescribir. Si alguien
      // corrige «ya no tomo sertralina», hay que poder ver qué decía antes.
      await sql`
        insert into ficha_versiones (id, ficha_id, payload)
        values (${crypto.randomUUID()}, ${fichaId}, ${previas[0].payload})
      `;

      await sql`
        update fichas set
          nombre = ${data.nombreCompleto.trim()},
          email = ${data.email.trim().toLowerCase()},
          telefono = ${data.telefono.trim()},
          retiro = ${retreatLabel(data)},
          payload = ${JSON.stringify(data)},
          flags = ${JSON.stringify(flags)},
          hold_count = ${flags.filter((f) => f.level === "hold").length},
          lectura = ${lectura(data, flags)},
          editada_at = now(),
          editada_veces = editada_veces + 1
        where id = ${fichaId}
      `;

      // La lectura clínica guardada se hizo sobre datos que acaban de cambiar.
      // Dejarla en pantalla sería peor que no tenerla: se leería un tablero
      // basado en información que ya no es la que la persona reporta.
      await sql`delete from lecturas where ficha_id = ${fichaId}`;

      await sql`commit`;
    } catch (error) {
      await sql`rollback`;
      throw error;
    }

    return { ok: true as const };
  });

/** Lo que el expediente muestra del enlace vigente, si lo hay. */
export const enlaceVigente = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const filas = await sql<{ expira_at: string; creado_por: string }>`
      select expira_at, creado_por from ficha_links
      where ficha_id = ${id} and usado_at is null and expira_at > now()
      order by creado_at desc limit 1
    `;
    if (!filas[0]) return null;
    return { expiraAt: String(filas[0].expira_at), creadoPor: filas[0].creado_por };
  });

export { urlDelEnlace };
