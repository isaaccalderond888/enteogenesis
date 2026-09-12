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
import { getSql } from "@/lib/db";
import { SITE } from "@/lib/site";

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
};

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

function toListItem(row: FichaRow): FichaListItem {
  const payload = parsePayload(row.payload);
  const flags = parseFlags(row.flags);
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono,
    retiro: row.retiro,
    ocupacion: payload.ocupacion,
    holdCount: Number(row.hold_count) || flags.filter((f) => f.level === "hold").length,
    reviewCount: flags.filter((f) => f.level === "review").length,
    status: isStatus(row.status) ? row.status : "nueva",
    createdAt: String(row.created_at),
    flags: flags
      .map((f) => ({ level: f.level, label: f.label, detail: f.detail }))
      .sort((a, b) => Number(b.level === "hold") - Number(a.level === "hold")),
    edad: ageFromIso(payload.fechaNacimiento),
    lectura: row.lectura,
  };
}

/**
 * Staff gate: invited email, allow-list, or first signer if the table is empty.
 * Public applicants never hit this — they only INSERT via submitFicha.
 */
async function requireStaff(userId: string) {
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

  const n = await sql<{ n: number }>`select count(*)::int as n from staff`;
  if (Number(n[0]?.n ?? 0) === 0) {
    await sql`insert into staff (user_id, email) values (${userId}, ${email})`;
    return;
  }

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
    return { id };
  });

export const listFichas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const rows = await sql<FichaRow>`
      select id, nombre, email, telefono, retiro, payload, flags, hold_count, lectura, status, notes, created_at
      from fichas
      order by created_at desc
    `;
    return rows.map(toListItem);
  });

export const getFicha = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const rows = await sql<FichaRow>`
      select id, nombre, email, telefono, retiro, payload, flags, hold_count, lectura, status, notes, created_at
      from fichas where id = ${id} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      ...toListItem(row),
      notes: row.notes,
      payload: parsePayload(row.payload),
    } satisfies FichaDetail;
  });

export const updateFichaStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: FichaStatus }) => input)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    if (!isStatus(data.status)) throw new Error("Estado inválido.");
    const sql = await getSql();
    await sql`update fichas set status = ${data.status} where id = ${data.id}`;
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
    return { ok: true, email };
  });

export const listStaff = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const people = await sql<{ email: string }>`select email from staff order by created_at`;
    const invites = await sql<{ email: string }>`select email from staff_invites`;
    return {
      staff: people.map((p) => p.email).filter(Boolean),
      invites: invites.map((p) => p.email),
    };
  });
