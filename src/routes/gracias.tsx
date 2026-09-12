import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Printer } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageShell } from "@/components/site-chrome";
import {
  BODY_FIELDS,
  DRAFT_KEY,
  FICHA_KEY,
  FICHA_REMOTE_KEY,
  emptyApplication,
  formatFicha,
  recallFicha,
  retreatLabel,
  safetyFlags,
  sexoTexto,
  generoTexto,
  type Application,
} from "@/lib/application";
import { SITE, mailtoFicha } from "@/lib/site";
import { submitFicha } from "@/lib/fichas";

export const Route = createFileRoute("/gracias")({ component: GraciasPage });

function readFicha(): Application | null {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const raw = store.getItem(FICHA_KEY);
      if (raw) return { ...emptyApplication(), ...(JSON.parse(raw) as Application) };
    } catch {
      /* try next */
    }
  }
  return recallFicha();
}

function GraciasPage() {
  const [data, setData] = useState<Application | null>(null);
  const [copied, setCopied] = useState(false);
  const [arrived, setArrived] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    setData(readFicha());
    try {
      const remote = localStorage.getItem(FICHA_REMOTE_KEY) ?? sessionStorage.getItem(FICHA_REMOTE_KEY);
      setArrived(Boolean(remote && remote.length > 0));
    } catch {
      setArrived(null);
    }
  }, []);

  const flags = useMemo(() => (data ? safetyFlags(data) : []), [data]);
  const holds = flags.filter((f) => f.level === "hold");
  const text = data ? formatFicha(data) : "";
  const mail = data
    ? mailtoFicha(`Ficha Enteogénesis · ${data.nombreCompleto}`, text.slice(0, 1800))
    : null;

  const sendToExpediente = async () => {
    if (!data) return;
    setSending(true);
    setSendError(null);
    try {
      let id = "";
      let last: unknown;
      for (let i = 0; i < 3; i += 1) {
        try {
          const res = await submitFicha({ data });
          if (res?.id) {
            id = res.id;
            break;
          }
        } catch (err) {
          last = err;
          await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        }
      }
      if (!id) throw last instanceof Error ? last : new Error("No se pudo guardar.");
      localStorage.setItem(FICHA_REMOTE_KEY, id);
      sessionStorage.setItem(FICHA_REMOTE_KEY, id);
      setArrived(true);
    } catch {
      setSendError("Todavía no llega. Conserva la copia e intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const download = () => {
    if (!data) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ficha-enteogenesis-${data.nombreCompleto.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  if (!data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-3xl font-normal">Aún no hay una ficha en este dispositivo</h1>
          <p className="mt-4 text-sm text-ink-soft">
            Empieza el cuestionario. Se guarda sola mientras avanzas. Si cambias de teléfono o
            limpias el navegador, el borrador no viaja.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm text-cream"
          >
            Llenar la ficha
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="eyebrow">Ficha cerrada</p>
        <h1 className="mt-3 text-3xl font-normal sm:text-4xl">
          Gracias, {data.nombreCompleto.split(" ")[0]}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          {arrived
            ? `Isaac y Claudia ya tienen tu expediente. Conserva una copia en este dispositivo: si cambias de equipo, esta pantalla no la recupera.`
            : `Tu ficha está en este dispositivo. Aún no confirmamos que llegara al expediente.`}
        </p>
        {arrived ? null : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void sendToExpediente()}
              disabled={sending}
              className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm text-cream disabled:opacity-60"
            >
              {sending ? "Enviando…" : "Enviar al expediente"}
            </button>
            {sendError ? <p className="mt-2 text-sm text-hold">{sendError}</p> : null}
          </div>
        )}
        <p className="mt-2 text-sm text-muted">
          {retreatLabel(data)}
          {data.submittedAt ? ` · ${data.submittedAt}` : ""}
        </p>

        <ol className="mt-8 space-y-3 rounded-3xl border border-line bg-paper p-5 text-sm leading-relaxed text-ink-soft">
          <li>
            <span className="font-medium text-ink">1. Conserva una copia.</span> Descarga o imprime.
            Es tu respaldo.
          </li>
          <li>
            <span className="font-medium text-ink">2. Ellos leen.</span>{" "}
            {arrived
              ? "Tu ficha ya está en su archivo. La entrevista sigue siendo parte del proceso."
              : SITE.inbox
                ? "Usa el botón de correo, o pega el texto en WhatsApp."
                : "Pégala en el correo o WhatsApp con el que te invitaron al retiro."}
          </li>
          <li>
            <span className="font-medium text-ink">3. Espera la entrevista.</span> No es un
            compromiso de lugar hasta que conversen.
          </li>
          <li>
            <span className="font-medium text-ink">4. Lee la preparación.</span>{" "}
            <Link to="/preparacion" className="underline underline-offset-4 hover:text-ink">
              Qué es este trabajo, quién no debería participar y cómo llegar
            </Link>
            . Vale la pena leerla antes de la entrevista.
          </li>
        </ol>

        {holds.length > 0 ? (
          <div className="mt-8 rounded-2xl border border-line bg-sand/40 p-5">
            <p className="text-xs font-bold tracking-[0.18em] text-clay">PARA LA ENTREVISTA</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Hay temas de salud que Isaac y Claudia van a querer conversar. No es un rechazo
              automático ni un diagnóstico.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-ink">
              {holds.map((f) => (
                <li key={f.label}>· {f.label}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-8 text-sm leading-relaxed text-muted">
            La entrevista de claridad sigue siendo parte del proceso, con o sin notas automáticas.
          </p>
        )}

        <div className="no-print mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={download}
            className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm text-cream"
          >
            Descargar ficha
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-ink px-5 text-sm"
          >
            <Printer className="size-4" />
            Imprimir
          </button>
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiada" : "Copiar texto"}
          </button>
          {mail ? (
            <a
              href={mail}
              className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm"
            >
              Abrir correo
            </a>
          ) : null}
        </div>

        <section className="mt-12 space-y-8 text-sm leading-relaxed">
          <Block title="Identidad">
            <Row k="Nombre" v={data.nombreCompleto} />
            <Row k="Nacimiento" v={data.fechaNacimiento} />
            <Row k="Sexo al nacer" v={sexoTexto(data)} />
            <Row k="Identidad de género" v={generoTexto(data)} />
            <Row k="Ocupación" v={data.ocupacion} />
            <Row k="Teléfono" v={data.telefono} />
            <Row k="Email" v={data.email} />
            <Row k="Dirección" v={data.direccion} />
            <Row k="Emergencia" v={data.emergencia} />
            <Row k="Cómo se enteró" v={data.comoSeEntero} />
          </Block>
          <Block title="Camino">
            <Row
              k="Participación previa"
              v={`${data.participadoPsicodelicos}${data.participadoContexto ? ` — ${data.participadoContexto}` : ""}`}
            />
            <Row k="Historial de sustancias" v={data.sustanciasHistorial} />
            <Row k="Consumo recreativo" v={data.consumeRecreativo} />
            <Row k="Práctica espiritual" v={data.practicaEspiritual} />
            <Row k="Maestro o guía" v={data.maestroGuia} />
          </Block>
          <Block title="Historia interior">
            <Row k="Terapia" v={data.terapia} />
            <Row k="Mala experiencia" v={data.malaExperiencia} />
            <Row k="Emergencia espiritual" v={data.emergenciaEspiritual} />
            <Row k="Nacimiento" v={data.nacimiento} />
          </Block>
          <Block title="Salud mental">
            <Row k="Enfermedad / tratamiento" v={data.enfermedadMental} />
            <Row k="Familia" v={data.antecedentesFamiliares} />
          </Block>
          <Block title="Cuerpo">
            {BODY_FIELDS.map((f) => (
              <Row
                key={f.key}
                k={f.question}
                v={`${data[f.key].respuesta === "si" ? "Sí" : "No"}${
                  data[f.key].detalle ? ` — ${data[f.key].detalle}` : ""
                }`}
              />
            ))}
            <Row k="Otro padecimiento" v={data.otroPadecimiento} />
            <Row k="Cambio o pérdida" v={data.cambioDramatico} />
            <Row k="Medicamentos" v={data.medicamentos} />
          </Block>
          <Block title="Intención">
            <Row k="Quién eres" v={data.quienEres} />
            <Row k="Sombra" v={data.sombra} />
            <Row k="Miedos" v={data.miedos} />
            <Row k="Razones" v={data.razones} />
          </Block>
          <Block title="Declaración">
            <Row k="Acepta" v={data.declara} />
            <Row k="Firma" v={data.firma} />
          </Block>
        </section>

        <div className="no-print mt-12 border-t border-line pt-8">
          <button
            type="button"
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
            onClick={() => {
              localStorage.removeItem(DRAFT_KEY);
              localStorage.removeItem(FICHA_KEY);
              localStorage.removeItem(FICHA_REMOTE_KEY);
              sessionStorage.removeItem(FICHA_KEY);
              sessionStorage.removeItem(FICHA_REMOTE_KEY);
              window.location.href = "/";
            }}
          >
            Empezar una ficha nueva en este dispositivo
          </button>
        </div>
      </article>
    </PageShell>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
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
