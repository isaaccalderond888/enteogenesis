import { createServerFn } from "@tanstack/react-start";
import {
  ageFromIso,
  emptyApplication,
  lectura,
  retreatLabel,
  safetyFlags,
  validateApplication,
  type Application,
  type SafetyFlag,
} from "@/lib/application";
import { authMiddleware } from "@/lib/auth/middleware";
import { breve, olvidar } from "@/lib/cache-breve";
import { getSql } from "@/lib/db";
import { SITE } from "@/lib/site";
import type { LecturaFicha } from "@/lib/clinica/lectura-ficha";
import { lecturaCompleta } from "@/lib/clinica/esquema";

export const STATUSES = [
  { id: "nueva", label: "Nueva" },
  { id: "entrevista", label: "En entrevista" },
  { id: "pausa", label: "En pausa" },
  { id: "confirmada", label: "Confirmada" },
  { id: "no", label: "No procede" },
] as const;

export type FichaStatus = (typeof STATUSES)[number]["id"];

export type FlagChip = { level: SafetyFlag["level"]; label: string; detail: string };

export type FichaListItem = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  retiro: string;
  ocupacion: string;
  holdCount: number;
  reviewCount: number;
  status: FichaStatus;
  createdAt: string;
  /** Cuándo la completó la propia persona por enlace, si lo hizo. */
  editadaAt: string | null;
  editadaVeces: number;
  flags: FlagChip[];
  edad: number | null;
  lectura: string;
};

export type FichaDetail = FichaListItem & {
  notes: string;
  payload: Application;
};

type FichaRow = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  retiro: string;
  payload: string;
  flags: string;
  hold_count: number;
  lectura: string;
  status: string;
  notes: string;
  created_at: string;
  editada_at: string | null;
  editada_veces: number;
};

/**
 * Lo que la lista necesita de cada ficha, y nada más.
 *
 * El expediente completo pesa: el payload entero (todas las respuestas) más la
 * lectura clínica de cada persona. La lista sólo pinta dos datos del payload
 * —ocupación y edad— y dos renglones de la lectura. Traerlo todo hacía salir de
 * la base veinte veces más datos de los que se muestran, cada vez que alguien
 * abre Expedientes.
 */
type FichaListRow = Omit<FichaRow, "payload" | "notes" | "lectura"> & {
  ocupacion: string | null;
  fecha_nacimiento: string | null;
  lectura: string | null;
};

/** Lo que caben en los dos renglones que la lista muestra de la lectura. */
const ASOMO_LECTURA = 240;

function isStatus(v: string): v is FichaStatus {
  return STATUSES.some((s) => s.id === v);
}

function parseFlags(raw: string): SafetyFlag[] {
  try {
    const parsed = JSON.parse(raw) as SafetyFlag[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parsePayload(raw: string): Application {
  try {
    return { ...emptyApplication(), ...(JSON.parse(raw) as Application) };
  } catch {
    return emptyApplication();
  }
}

function toListItem(row: FichaListRow): FichaListItem {
  const flags = parseFlags(row.flags);
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono,
    retiro: row.retiro,
    ocupacion: row.ocupacion ?? "",
    holdCount: Number(row.hold_count) || flags.filter((f) => f.level === "hold").length,
    reviewCount: flags.filter((f) => f.level === "review").length,
    status: isStatus(row.status) ? row.status : "nueva",
    createdAt: String(row.created_at),
    editadaAt: row.editada_at ? String(row.editada_at) : null,
    editadaVeces: row.editada_veces ?? 0,
    flags: flags
      .map((f) => ({ level: f.level, label: f.label, detail: f.detail }))
      .sort((a, b) => Number(b.level === "hold") - Number(a.level === "hold")),
    edad: ageFromIso(row.fecha_nacimiento ?? ""),
    lectura: row.lectura ?? "",
  };
}

/**
 * Staff gate: invited email, allow-list, or first signer if the table is empty.
 * Public applicants never hit this — they only INSERT via submitFicha.
 */
export async function requireStaff(userId: string) {
  // La comprobación se repite en cada llamada y consulta la base dos veces.
  // Guardarla unos segundos no afloja el candado: quitarle el acceso a alguien
  // tarda, como mucho, esos segundos en surtir efecto.
  return breve(`staff:${userId}`, () => comprobarStaff(userId));
}

async function comprobarStaff(userId: string) {
  const sql = await getSql();
  const { getSessionUser, UnauthorizedError } = await import("@/lib/auth/verify.server");
  const session = await getSessionUser();
  const email = (session?.email ?? "").trim().toLowerCase();

  const mine = await sql`select user_id from staff where user_id = ${userId} limit 1`;
  if (mine.length) return;

  if (email) {
    const invited = await sql`select email from staff_invites where email = ${email} limit 1`;
    if (invited.length) {
      await sql`insert into staff (user_id, email) values (${userId}, ${email}) on conflict (user_id) do nothing`;
      await sql`delete from staff_invites where email = ${email}`;
      return;
    }
    const allow = SITE.adminEmails.map((e) => e.toLowerCase());
    if (allow.includes(email)) {
      await sql`insert into staff (user_id, email) values (${userId}, ${email}) on conflict (user_id) do nothing`;
      return;
    }
  }

  // Sin regla de arranque: una tabla staff vacía significa que nadie entra, no
  // que entre quien llegue primero. Ese atajo convirtió en staff a la primera
  // cuenta que abrió el panel cuando la base se creó de cero al conectar Neon.
  throw new UnauthorizedError();
}

/** Public write: anyone who closes the ficha. No SELECT of other people's rows. */
export const submitFicha = createServerFn({ method: "POST" })
  .validator((data: Application) => data)
  .handler(async ({ data }) => {
    const message = validateApplication(data);
    if (message) throw new Error(message);

    const flags = safetyFlags(data);
    const id = crypto.randomUUID();
    const sql = await getSql();
    await sql`
      insert into fichas (
        id, nombre, email, telefono, retiro, payload, flags, hold_count, lectura, status
      ) values (
        ${id},
        ${data.nombreCompleto.trim()},
        ${data.email.trim().toLowerCase()},
        ${data.telefono.trim()},
        ${retreatLabel(data)},
        ${JSON.stringify(data)},
        ${JSON.stringify(flags)},
        ${flags.filter((f) => f.level === "hold").length},
        ${lectura(data, flags)},
        ${"nueva"}
      )
    `;
    olvidar("fichas:lista");
    return { id };
  });

/**
 * Los nombres de estas cuatro funciones son parte de la contención, no un
 * capricho.
 *
 * La dirección con la que el navegador llama a una función de servidor sale del
 * archivo y del nombre exportado —nada más—, así que NO cambia entre
 * despliegues. Cuando una pestaña vieja quedó pidiendo sin parar, la única
 * forma de bloquearla en el firewall sin bloquear también al sitio corregido es
 * que el sitio corregido llame a otra dirección. Por eso se renombraron:
 *
 *   listFichas -> fichasDelPanel      listStaff  -> equipoDelPanel
 *   getFicha   -> fichaDelPanel       getLectura -> lecturaDelPanel
 *
 * Las direcciones viejas quedan bloqueadas para siempre y no cuestan nada.
 * Si alguna vez hay que repetir la maniobra, basta con volver a renombrar.
 */
export const fichasDelPanel = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    return breve("fichas:lista", () => leerLista());
  });

async function leerLista(): Promise<FichaListItem[]> {
    const sql = await getSql();
    try {
      // `payload` se guarda como texto, así que el cast a jsonb es lo que
      // permite sacar dos campos sin traerse el expediente entero.
      const rows = await sql<FichaListRow>`
        select id, nombre, email, telefono, retiro,
               payload::jsonb->>'ocupacion' as ocupacion,
               payload::jsonb->>'fechaNacimiento' as fecha_nacimiento,
               flags, hold_count,
               left(lectura, ${ASOMO_LECTURA}) as lectura,
               status, created_at, editada_at, editada_veces
        from fichas
        order by created_at desc
      `;
      return rows.map(toListItem);
    } catch (err) {
      // Un payload que no sea JSON válido hace fallar el cast y se llevaría la
      // lista entera por delante. No debería pasar —lo escribimos nosotros con
      // JSON.stringify— pero quedarse sin Expedientes por una ficha corrupta
      // sería peor que gastar unos kilobytes de más.
      console.error("[fichas] lista ligera falló, leyendo el payload completo", err);
      const rows = await sql<FichaRow>`
        select id, nombre, email, telefono, retiro, payload, flags, hold_count,
               lectura, status, created_at, editada_at, editada_veces
        from fichas
        order by created_at desc
      `;
      return rows.map((row) => {
        const payload = parsePayload(row.payload);
        return toListItem({
          ...row,
          ocupacion: payload.ocupacion,
          fecha_nacimiento: payload.fechaNacimiento,
        });
      });
    }
}

export const fichaDelPanel = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await requireStaff(context.userId);
    return breve(`ficha:${id}`, () => leerFichaCompleta(id));
  });

async function leerFichaCompleta(id: string): Promise<FichaDetail | null> {
    const sql = await getSql();
    const rows = await sql<FichaRow>`
      select id, nombre, email, telefono, retiro, payload, flags, hold_count, lectura, status, notes, created_at, editada_at, editada_veces
      from fichas where id = ${id} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    // Aquí sí hace falta el payload entero, así que los dos campos que la lista
    // recibe ya extraídos se sacan de él en vez de pedirlos otra vez.
    const payload = parsePayload(row.payload);
    return {
      ...toListItem({
        ...row,
        ocupacion: payload.ocupacion,
        fecha_nacimiento: payload.fechaNacimiento,
      }),
      notes: row.notes,
      payload,
    } satisfies FichaDetail;
}

export const updateFichaStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: FichaStatus }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    if (!isStatus(data.status)) throw new Error("Estado inválido.");
    const sql = await getSql();
    await sql`update fichas set status = ${data.status} where id = ${data.id}`;
    olvidar(`ficha:${data.id}`);
    olvidar("fichas:lista");
    return { ok: true };
  });

export const updateFichaNotes = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; notes: string }) => ({
    id: input.id,
    notes: input.notes.slice(0, 8000),
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql`update fichas set notes = ${data.notes} where id = ${data.id}`;
    olvidar(`ficha:${data.id}`);
    olvidar("fichas:lista");
    return { ok: true };
  });

export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((email: string) => email.trim().toLowerCase())
  .handler(async ({ context, data: email }) => {
    await requireStaff(context.userId);
    if (!email.includes("@")) throw new Error("Correo inválido.");
    const sql = await getSql();
    await sql`insert into staff_invites (email) values (${email}) on conflict (email) do nothing`;
    olvidar("staff:");
    return { ok: true, email };
  });

export const equipoDelPanel = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    return breve("staff:lista", async () => {
      const sql = await getSql();
      const people = await sql<{ email: string }>`select email from staff order by created_at`;
      const invites = await sql<{ email: string }>`select email from staff_invites`;
      return {
        staff: people.map((p) => p.email).filter(Boolean),
        invites: invites.map((p) => p.email),
      };
    });
  });

export type LecturaGuardada = {
  contenido: LecturaFicha;
  modelo: string;
  marcoVersion: string;
  creadaAt: string;
};

/** La lectura vigente de una ficha, si ya se generó. */
export const lecturaDelPanel = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<LecturaGuardada | null> => {
    await requireStaff(context.userId);
    return breve(`lectura:${id}`, () => leerLectura(id));
  });

async function leerLectura(id: string): Promise<LecturaGuardada | null> {
    const sql = await getSql();
    const filas = await sql<{
      contenido: string;
      modelo: string;
      marco_version: string;
      creada_at: string;
    }>`select contenido, modelo, marco_version, creada_at from lecturas where ficha_id = ${id} limit 1`;
    const fila = filas[0];
    if (!fila) return null;
    let crudo: unknown;
    try {
      crudo = JSON.parse(fila.contenido);
    } catch {
      // Una lectura ilegible equivale a no tenerla: se regenera.
      return null;
    }
    // Y una lectura guardada con una forma anterior del marco, también: antes de
    // esto la pantalla se caía al leer un campo que esa lectura no tenía.
    const contenido = lecturaCompleta(crudo);
    if (!contenido) return null;
    return {
      contenido,
      modelo: fila.modelo,
      marcoVersion: fila.marco_version,
      creadaAt: String(fila.creada_at),
    };
}

/**
 * Genera la lectura clínica de una ficha y la guarda, reemplazando la anterior.
 *
 * Sólo staff, y nunca automático al cerrar la ficha: cuesta dinero y es una
 * decisión de quien va a leerla, no del formulario.
 */
export const generarLectura = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<LecturaGuardada> => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const filas = await sql<{ payload: string }>`select payload from fichas where id = ${id} limit 1`;
    if (!filas[0]) throw new Error("No existe esa ficha.");

    const { leerFicha, MODELO, MARCO_VERSION } = await import("@/lib/clinica/lectura.server");
    const contenido = await leerFicha(parsePayload(filas[0].payload));
    const texto = JSON.stringify(contenido);

    await sql`
      insert into lecturas (ficha_id, contenido, modelo, marco_version, creada_at)
      values (${id}, ${texto}, ${MODELO}, ${MARCO_VERSION}, now())
      on conflict (ficha_id) do update
        set contenido = excluded.contenido,
            modelo = excluded.modelo,
            marco_version = excluded.marco_version,
            creada_at = excluded.creada_at
    `;
    olvidar(`lectura:${id}`);
    return {
      contenido,
      modelo: MODELO,
      marcoVersion: MARCO_VERSION,
      creadaAt: new Date().toISOString(),
    };
  });
