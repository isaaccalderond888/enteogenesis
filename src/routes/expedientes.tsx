import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/site-chrome";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { inviteStaff, listFichas, listStaff, STATUSES, type FichaListItem } from "@/lib/fichas";

/**
 * Aviso que la persona autorizada necesita recibir. No hay envío de correo en el
 * proyecto, así que autorizar solo abre la puerta: sin este mensaje, quien fue
 * autorizada nunca se entera. Incluye la advertencia del correo exacto, que es
 * el motivo por el que un acceso rebota.
 */
function mensajeInvitacion(email: string): string {
  return [
    "Ya tienes acceso al archivo de admisión de Enteogénesis.",
    "",
    "1. Entra a https://enteogenesis.app/adminlogin",
    '2. Dale a "Primera vez: crear acceso"',
    "3. Llena tu nombre, tu correo y una contraseña que inventes",
    "",
    `Usa exactamente este correo: ${email}`,
    "Con cualquier otro no te va a dejar entrar.",
  ].join("\n");
}

export const Route = createFileRoute("/expedientes")({
  head: () => ({
    meta: [
      { title: "Expedientes · Terrasana" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ExpedientesPage,
});

function statusLabel(id: string) {
  return STATUSES.find((s) => s.id === id)?.label ?? id;
}

function when(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function ExpedientesPage() {
  const { user, isPending } = useCurrentUserState();
  const [rows, setRows] = useState<FichaListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("todas");
  const [invite, setInvite] = useState("");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [autorizado, setAutorizado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [staffInfo, setStaffInfo] = useState<{ staff: string[]; invites: string[] } | null>(null);

  // Depende del identificador, no del objeto del usuario. Un objeto nuevo en
  // cada render volvería a disparar este efecto, que al guardar lo que trae
  // provoca otro render: la pestaña se queda consultando sola, sin parar.
  const userId = user?.id ?? null;

  useEffect(() => {
    if (isPending || !userId) return;
    let cancelled = false;
    listFichas()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "No se pudieron cargar.";
        setError(message === "Unauthorized" ? "Este acceso no está autorizado para el panel." : message);
        setRows([]);
      });
    listStaff()
      .then((s) => {
        if (!cancelled) setStaffInfo(s);
      })
      .catch(() => {
        /* listFichas already surfaces auth errors */
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, userId]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "todas" && r.status !== status) return false;
      if (!needle) return true;
      return (
        r.nombre.toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle) ||
        r.telefono.includes(needle) ||
        r.ocupacion.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, status]);

  if (isPending) {
    return (
      <PageShell internal footer={false}>
        <div className="mx-auto max-w-3xl px-4 py-24 text-sm text-muted">Cargando…</div>
      </PageShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const holds = rows?.filter((r) => r.holdCount > 0).length ?? 0;

  return (
    <PageShell internal footer={false}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Expedientes</p>
            <h1 className="mt-2 text-3xl font-normal">Admisión</h1>
            <p className="mt-2 text-sm text-ink-soft">
              {rows
                ? `${rows.length} ficha${rows.length === 1 ? "" : "s"}${holds ? ` · ${holds} con pausa` : ""}`
                : "Cargando el archivo…"}
            </p>
          </div>
          <UserButton />
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-hold/30 bg-hold/5 px-4 py-3 text-sm text-hold">{error}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono"
            className="h-12 flex-1 rounded-full border border-line bg-paper px-5 text-sm outline-none focus:border-clay"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-12 rounded-full border border-line bg-paper px-4 text-sm"
          >
            <option value="todas">Todas</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <ul className="mt-6 divide-y divide-line rounded-3xl border border-line bg-paper">
          {rows === null ? (
            <li className="px-5 py-8 text-sm text-muted">Abriendo el archivo…</li>
          ) : filtered.length === 0 ? (
            <li className="px-5 py-8 text-sm text-muted">
              {rows.length === 0
                ? "Aún no llega ninguna ficha. Cuando alguien cierre el cuestionario, aparece aquí."
                : "Nada coincide con esa búsqueda."}
            </li>
          ) : (
            filtered.map((r) => (
              <li key={r.id}>
                <Link
                  to="/expedientes/$id"
                  params={{ id: r.id }}
                  className="block px-5 py-4 hover:bg-sand/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-ink">{r.nombre}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {r.edad ? `${r.edad} años` : ""}
                        {r.edad && r.ocupacion ? " · " : ""}
                        {r.ocupacion}
                        {(r.edad || r.ocupacion) && r.retiro ? " · " : ""}
                        {r.retiro}
                      </p>
                    </div>
                    <span className="shrink-0 text-right text-[11px] tracking-[0.12em] text-clay">
                      {statusLabel(r.status)}
                      {r.createdAt ? (
                        <span className="mt-1 block tracking-normal text-muted">{when(r.createdAt)}</span>
                      ) : null}
                    </span>
                  </div>
                  {r.lectura ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">{r.lectura}</p>
                  ) : null}
                  {r.flags.length ? (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {r.flags.map((f) => (
                        <span
                          key={`${f.level}-${f.label}`}
                          className={
                            f.level === "hold"
                              ? "rounded-full bg-hold/10 px-2 py-0.5 text-[11px] tracking-wide text-hold"
                              : "rounded-full bg-review/10 px-2 py-0.5 text-[11px] tracking-wide text-review"
                          }
                        >
                          {f.label}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))
          )}
        </ul>

        <section className="mt-12 rounded-3xl border border-line bg-paper p-5">
          <p className="eyebrow">Quién lee</p>
          <p className="mt-3 text-sm text-ink-soft">
            {(staffInfo?.staff.length ? staffInfo.staff.join(" · ") : user.primaryEmail) || "Tu cuenta"}
          </p>
          {staffInfo?.invites.length ? (
            <p className="mt-2 text-xs text-muted">
              Autorizadas, sin entrar todavía: {staffInfo.invites.join(", ")}
            </p>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Autorizar abre la puerta a ese correo. El sitio no manda ningún aviso: el mensaje se
            lo envías tú por WhatsApp o correo.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const email = invite.trim();
              if (!email) return;
              setInviteMsg(null);
              void inviteStaff({ data: email })
                .then(() => {
                  setInvite("");
                  setInviteMsg(null);
                  setAutorizado(email);
                  setCopiado(false);
                  return listStaff().then(setStaffInfo);
                })
                .catch((err: unknown) => {
                  setInviteMsg(err instanceof Error ? err.message : "No se pudo autorizar.");
                });
            }}
          >
            <input
              type="email"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              placeholder="Correo de quien va a leer"
              className="h-11 flex-1 rounded-full border border-line bg-cream px-4 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full border border-ink px-5 text-sm"
            >
              Autorizar
            </button>
          </form>
          {inviteMsg ? <p className="mt-2 text-xs text-clay">{inviteMsg}</p> : null}
          {autorizado ? (
            <div className="mt-4 rounded-2xl border border-line bg-cream p-4">
              <p className="text-xs font-bold tracking-[0.18em] text-clay">
                FALTA AVISARLE A {autorizado.toUpperCase()}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {mensajeInvitacion(autorizado)}
              </p>
              <button
                type="button"
                className="mt-3 inline-flex h-10 items-center rounded-full border border-ink px-4 text-sm"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(mensajeInvitacion(autorizado))
                    .then(() => setCopiado(true))
                    .catch(() => setCopiado(false));
                }}
              >
                {copiado ? "Copiado" : "Copiar mensaje"}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </PageShell>
  );
}
