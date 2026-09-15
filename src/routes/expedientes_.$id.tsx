import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site-chrome";
import { BODY_FIELDS, generoTexto } from "@/lib/application";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { definicion } from "@/lib/clinica/dominios";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getFicha,
  STATUSES,
  updateFichaNotes,
  updateFichaStatus,
  type FichaDetail,
  type FichaStatus,
  getLectura,
  generarLectura,
  type LecturaGuardada,
} from "@/lib/fichas";

/**
 * La versión del marco con la que se leen las fichas hoy. Duplicada a propósito:
 * el módulo que la define arrastra el SDK de Anthropic y no tiene nada que hacer
 * en el navegador. Una prueba cuida que las dos no se separen.
 */
const MARCO_VERSION_VIGENTE = "3";

/**
 * Se escriben aquí, y no con toUpperCase ni concatenando clases, para que un
 * valor inesperado guardado en la base no tumbe la pantalla del expediente a
 * media entrevista, y para que Tailwind vea las clases completas.
 */
const ETIQUETA_RIESGO: Record<string, string> = {
  bajo: "BAJO",
  medio: "MEDIO",
  alto: "ALTO",
};

const CAJA_RIESGO: Record<string, string> = {
  alto: "rounded-2xl border border-hold/40 bg-hold/5 p-5",
  medio: "rounded-2xl border border-review/40 bg-review/5 p-5",
  bajo: "rounded-2xl border border-clear/40 bg-clear/5 p-5",
};

const TEXTO_RIESGO: Record<string, string> = {
  alto: "text-xs font-bold tracking-[0.18em] text-hold",
  medio: "text-xs font-bold tracking-[0.18em] text-review",
  bajo: "text-xs font-bold tracking-[0.18em] text-clear",
};

/** El color de una casilla del tablero dice qué hacer con ella. */
const BARRA_ESTADO: Record<string, string> = {
  atender: "bg-hold",
  revisar: "bg-review",
  falta: "bg-clay",
  ok: "bg-clear",
};

const COLOR_ESTADO: Record<string, string> = {
  atender: "text-hold",
  revisar: "text-review",
  falta: "text-clay",
  ok: "text-clear",
};

/** Sólo lo que hay que atender se tiñe: si todo se tiñe, nada resalta. */
const FONDO_ESTADO: Record<string, string> = {
  atender: "bg-hold/5",
};

export const Route = createFileRoute("/expedientes_/$id")({
  head: () => ({
    meta: [
      { title: "Expediente · Terrasana" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ExpedientePage,
});

function ExpedientePage() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [row, setRow] = useState<FichaDetail | null | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [lectura, setLectura] = useState<LecturaGuardada | null | undefined>(undefined);
  const [generando, setGenerando] = useState(false);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);

  useEffect(() => {
    if (isPending || !user) return;
    let cancelled = false;
    getFicha({ data: id })
      .then((data) => {
        if (cancelled) return;
        setRow(data);
        setNotes(data?.notes ?? "");
      })
      .catch(() => {
        if (!cancelled) setRow(null);
      });
    getLectura({ data: id })
      .then((l) => {
        if (!cancelled) setLectura(l);
      })
      .catch(() => {
        if (!cancelled) setLectura(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isPending, user]);

  if (isPending) {
    return (
      <PageShell internal footer={false}>
        <div className="mx-auto max-w-2xl px-4 py-24 text-sm text-muted">Cargando expediente…</div>
      </PageShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (row === undefined) {
    return (
      <PageShell internal footer={false}>
        <div className="mx-auto max-w-2xl px-4 py-24 text-sm text-muted">Abriendo…</div>
      </PageShell>
    );
  }
  if (!row) {
    return (
      <PageShell internal footer={false}>
        <div className="mx-auto max-w-2xl px-4 py-16">
          <p className="text-sm text-muted">No hay un expediente con esa clave.</p>
          <Link to="/expedientes" className="mt-4 inline-block text-sm text-clay">
            Volver al archivo
          </Link>
        </div>
      </PageShell>
    );
  }

  const d = row.payload;
  const holds = row.flags.filter((f) => f.level === "hold");
  const reviews = row.flags.filter((f) => f.level === "review");

  return (
    <PageShell internal footer={false}>
      <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="no-print flex items-center justify-between gap-3">
          <Link to="/expedientes" className="text-sm text-muted hover:text-ink">
            ← Archivo
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-ink-soft hover:border-ink/40"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </button>
            <UserButton />
          </div>
        </div>

        <p className="eyebrow mt-8">Expediente</p>
        <h1 className="mt-2 text-3xl font-normal">{row.nombre}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {[
            row.edad ? `${row.edad} años` : null,
            generoTexto(d) || null,
            d.ocupacion || null,
            row.retiro,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {row.createdAt ? (
          <p className="mt-1 text-xs text-muted">
            Llegó {new Date(row.createdAt).toLocaleString("es-MX")}
          </p>
        ) : null}

        <section className="mt-8 rounded-3xl border border-sand bg-sand/40 px-5 py-4">
          <p className="eyebrow">Para la entrevista</p>
          <p className="mt-3 text-sm leading-relaxed text-ink">{row.lectura}</p>
          <p className="mt-2 text-xs text-muted">
            Lectura automática. No es un diagnóstico ni un rechazo — ustedes deciden en conversación.
          </p>
        </section>

        <div className="no-print mt-6 flex flex-wrap items-center gap-3">
          <label className="text-sm text-ink-soft">
            Estado
            <select
              className="ml-2 h-11 rounded-full border border-line bg-paper px-3 text-sm"
              value={row.status}
              onChange={(e) => {
                const status = e.target.value as FichaStatus;
                void updateFichaStatus({ data: { id: row.id, status } }).then(() =>
                  setRow({ ...row, status }),
                );
              }}
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {holds.length || reviews.length ? (
          <ul className="mt-6 space-y-3">
            {holds.map((f) => (
              <li key={`h-${f.label}`} className="rounded-2xl border border-hold/20 bg-hold/5 px-4 py-3">
                <p className="text-[11px] font-bold tracking-[0.16em] text-hold uppercase">Pausa · {f.label}</p>
                {f.detail ? <p className="mt-1 text-sm text-ink">{f.detail}</p> : null}
              </li>
            ))}
            {reviews.map((f) => (
              <li key={`r-${f.label}`} className="rounded-2xl border border-review/20 bg-review/5 px-4 py-3">
                <p className="text-[11px] font-bold tracking-[0.16em] text-review uppercase">
                  Revisar · {f.label}
                </p>
                {f.detail ? <p className="mt-1 text-sm text-ink">{f.detail}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-moss">Sin pausas ni banderas automáticas.</p>
        )}

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href={`tel:${d.telefono.replace(/\s+/g, "")}`}
            className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm hover:border-clay"
          >
            <p className="text-xs text-muted">Teléfono</p>
            <p className="mt-1 text-ink">{d.telefono}</p>
          </a>
          <a
            href={`mailto:${d.email}`}
            className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm hover:border-clay"
          >
            <p className="text-xs text-muted">Correo</p>
            <p className="mt-1 break-all text-ink">{d.email}</p>
          </a>
          {d.emergencia ? (
            <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm sm:col-span-2">
              <p className="text-xs text-muted">Emergencia</p>
              <p className="mt-1 text-ink">{d.emergencia}</p>
            </div>
          ) : null}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold tracking-[0.18em] text-clay">LECTURA CLÍNICA</p>
            <button
              type="button"
              disabled={generando}
              onClick={() => {
                setGenerando(true);
                setErrorLectura(null);
                void generarLectura({ data: id })
                  .then(setLectura)
                  .catch((err: unknown) =>
                    setErrorLectura(
                      err instanceof Error ? err.message : "No se pudo generar la lectura.",
                    ),
                  )
                  .finally(() => setGenerando(false));
              }}
              className="no-print inline-flex h-10 items-center rounded-full border border-line px-4 text-sm hover:border-ink/40 disabled:opacity-40"
            >
              {generando ? "Leyendo…" : lectura ? "Regenerar" : "Generar lectura"}
            </button>
          </div>

          {errorLectura ? (
            <p className="mt-3 rounded-2xl border border-hold/30 bg-hold/5 px-4 py-3 text-sm text-hold">
              {errorLectura}
            </p>
          ) : null}

          {lectura === undefined ? (
            <p className="mt-3 text-sm text-muted">Cargando…</p>
          ) : lectura === null ? (
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Todavía no se ha generado. No es automática: cuesta y es decisión de quien va a
              leer la ficha.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              <div className={CAJA_RIESGO[lectura.contenido.riesgo] ?? CAJA_RIESGO.bajo}>
                <p className={TEXTO_RIESGO[lectura.contenido.riesgo] ?? TEXTO_RIESGO.bajo}>
                  RIESGO {ETIQUETA_RIESGO[lectura.contenido.riesgo] ?? "SIN CLASIFICAR"}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">
                  {lectura.contenido.alertaPrincipal}
                </p>
              </div>

              {lectura.contenido.dominios.length ? (
                <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                  {lectura.contenido.dominios.map((dom, i, todas) => (
                    <div
                      key={dom.clave}
                      className={`flex gap-3 bg-paper px-4 py-3 ${FONDO_ESTADO[dom.estado] ?? ""} ${
                        // Con un número impar de casillas, la última se queda sola
                        // y deja un hueco gris al lado. Que ocupe la fila entera.
                        i === todas.length - 1 && todas.length % 2 === 1 ? "sm:col-span-2" : ""
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-[3px] shrink-0 rounded-sm ${BARRA_ESTADO[dom.estado] ?? "bg-line"}`}
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-bold tracking-[0.13em] text-muted">
                          {(definicion(dom.clave)?.rotulo ?? dom.clave).toUpperCase()}
                          {dom.etiqueta ? (
                            <span className={COLOR_ESTADO[dom.estado] ?? "text-muted"}>
                              · {dom.etiqueta}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-[15px] leading-snug text-ink">
                          {dom.linea}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="rounded-2xl border border-line bg-sand/30 p-5">
                <p className="text-xs font-bold tracking-[0.18em] text-clay">PUNTO DE PARTIDA</p>
                {lectura.contenido.sugerencia.medicina.trim() ? (
                  <p className="mt-3 text-[15px] leading-relaxed text-ink">
                    <span className="font-medium">{lectura.contenido.sugerencia.medicina}</span>
                    {lectura.contenido.sugerencia.dosis
                      ? ` · ${lectura.contenido.sugerencia.dosis}`
                      : ""}
                  </p>
                ) : (
                  <p className="mt-3 text-[15px] leading-relaxed text-ink">
                    <span className="font-medium">Sin sugerencia de medicina todavía</span>
                  </p>
                )}
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                  {lectura.contenido.sugerencia.porQue}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  No es una indicación. Se decide en la entrevista, en el momento y de común
                  acuerdo con quien participa.
                </p>
              </div>

              {lectura.contenido.lavados.length ? (
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-clay">
                    SUSPENDER ANTES DEL RETIRO
                  </p>
                  <div className="mt-3 space-y-3">
                    {lectura.contenido.lavados.map((l) => (
                      <div key={l.sustancia}>
                        <p className="text-[15px] leading-relaxed text-ink">
                          <span className="font-medium">{l.sustancia}</span>
                          {l.ventana ? ` — ${l.ventana}` : ""}
                        </p>
                        <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{l.porQue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {lectura.contenido.lectura}
              </p>

              {lectura.contenido.fase ? (
                <p className="text-[15px] leading-relaxed text-ink-soft">
                  <span className="text-ink">Fase:</span> {lectura.contenido.fase}
                </p>
              ) : null}

              {lectura.contenido.preguntas.length ? (
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-clay">
                    SI SOLO ALCANZAS TRES PREGUNTAS
                  </p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5">
                    {lectura.contenido.preguntas.map((q) => (
                      <li key={q} className="text-[15px] leading-relaxed text-ink">
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {lectura.contenido.detalle.length ? (
                <details className="border-t border-line pt-4">
                  <summary className="cursor-pointer text-xs font-bold tracking-[0.18em] text-clay">
                    LA FICHA DETRÁS DE CADA CASILLA
                  </summary>
                  <div className="mt-4 space-y-5">
                    {lectura.contenido.detalle.map((det) => (
                      <div key={det.tema}>
                        <p className="text-sm font-medium text-ink">{det.tema}</p>
                        {det.escribio.map((cita) => (
                          <p
                            key={cita}
                            className="mt-1 border-l-2 border-sand pl-3 text-[15px] italic leading-relaxed text-ink-soft"
                          >
                            “{cita}”
                          </p>
                        ))}
                        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                          {det.marco ? (
                            <span className="mr-2 rounded-sm border border-clay/40 px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-[0.11em] whitespace-nowrap text-clay uppercase">
                              {det.marco}
                            </span>
                          ) : null}
                          {det.leo}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}

              <p className="text-xs leading-relaxed text-muted">
                Lectura automática con los marcos terapéuticos de Isaac. No diagnostica ni decide
                admisión: orienta la conversación. Generada el{" "}
                {new Date(lectura.creadaAt).toLocaleString("es-MX")} con {lectura.modelo}, marco
                v{lectura.marcoVersion}.
                {lectura.marcoVersion !== MARCO_VERSION_VIGENTE
                  ? " Los criterios cambiaron desde entonces: regenérala para leerla con el marco de hoy."
                  : ""}
              </p>
            </div>
          )}
        </section>

        <label className="no-print mt-8 block text-sm">
          Notas del equipo
          <textarea
            className="mt-2 min-h-28 w-full rounded-2xl border border-line bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-clay"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
              setNoteError(null);
            }}
            placeholder="Lo que quieran recordar para la entrevista…"
          />
        </label>
        <button
          type="button"
          className="no-print mt-3 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm text-cream"
          onClick={() => {
            setNoteError(null);
            void updateFichaNotes({ data: { id: row.id, notes } })
              .then(() => setSaved(true))
              .catch((err: unknown) => {
                setNoteError(err instanceof Error ? err.message : "No se pudieron guardar.");
              });
          }}
        >
          {saved ? "Notas guardadas" : "Guardar notas"}
        </button>
        {noteError ? <p className="mt-2 text-xs text-hold">{noteError}</p> : null}
        {notes.trim() ? (
          <p className="mt-4 hidden whitespace-pre-wrap text-sm print:block">
            <span className="eyebrow block">Notas</span>
            {notes}
          </p>
        ) : null}

        <section className="mt-12 space-y-6 text-sm leading-relaxed">
          <Block title="Intención">
            <Row k="Quién eres" v={d.quienEres} />
            <Row k="Sombra" v={d.sombra} />
            <Row k="Miedos" v={d.miedos} />
            <Row k="Razones" v={d.razones} />
          </Block>
          <Block title="Camino">
            <Row
              k="Participación previa"
              v={
                d.participadoPsicodelicos === "si"
                  ? `Sí${d.participadoContexto ? ` — ${d.participadoContexto}` : ""}`
                  : d.participadoPsicodelicos === "no"
                    ? `No${d.participadoContexto ? ` — ${d.participadoContexto}` : ""}`
                    : d.participadoContexto
              }
            />
            <Row k="Historial de sustancias" v={d.sustanciasHistorial} />
            <Row k="Consumo recreativo" v={d.consumeRecreativo} />
            <Row k="Práctica espiritual" v={d.practicaEspiritual} />
            <Row k="Maestro o guía" v={d.maestroGuia} />
          </Block>
          <Block title="Historia interior">
            <Row k="Terapia" v={d.terapia} />
            <Row k="Mala experiencia" v={d.malaExperiencia} />
            <Row k="Emergencia espiritual" v={d.emergenciaEspiritual} />
            <Row k="Nacimiento" v={d.nacimiento} />
          </Block>
          <Block title="Salud mental">
            <Row k="Enfermedad / tratamiento" v={d.enfermedadMental} />
            <Row k="Familia" v={d.antecedentesFamiliares} />
          </Block>
          <Block title="Cuerpo">
            {BODY_FIELDS.map((f) => (
              <Row
                key={f.key}
                k={f.question}
                v={`${d[f.key].respuesta === "si" ? "Sí" : "No"}${d[f.key].detalle ? ` — ${d[f.key].detalle}` : ""}`}
              />
            ))}
            <Row k="Otro padecimiento" v={d.otroPadecimiento} />
            <Row k="Cambio o pérdida" v={d.cambioDramatico} />
            <Row k="Medicamentos" v={d.medicamentos} />
          </Block>
          <Block title="Más contacto">
            <Row k="Dirección" v={d.direccion} />
            <Row k="Cómo se enteró" v={d.comoSeEntero} />
            <Row k="Nacimiento (fecha)" v={d.fechaNacimiento} />
          </Block>
          <Block title="Declaración">
            <Row k="Acepta" v={d.declara === "si" ? "Sí" : d.declara === "no" ? "No" : d.declara} />
            <Row k="Firma" v={d.firma} />
          </Block>
        </section>
      </article>
    </PageShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="eyebrow">{title}</h2>
      <dl className="mt-3 space-y-3">{children}</dl>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v?.trim()) return null;
  return (
    <div>
      <dt className="text-xs tracking-[0.08em] text-muted">{k}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-ink">{v}</dd>
    </div>
  );
}
