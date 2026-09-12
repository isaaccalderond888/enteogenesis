import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Choice, Field, SelectInput, TextArea, TextInput, YesNo, YesNoDetail } from "@/components/fields";
import { PageShell } from "@/components/site-chrome";
import {
  BODY_FIELDS,
  DRAFT_KEY,
  FICHA_KEY,
  FICHA_REMOTE_KEY,
  RETREATS,
  STEPS,
  emptyApplication,
  rememberFicha,
  type Application,
  type BodyItem,
  validateStep,
} from "@/lib/application";
import { submitFicha } from "@/lib/fichas";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

async function persistFicha(submitted: Application): Promise<string> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await submitFicha({ data: submitted });
      if (res?.id) return res.id;
      last = new Error("Sin identificador");
    } catch (err) {
      last = err;
    }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw last instanceof Error ? last : new Error("No se pudo guardar.");
}

export function FichaWizard() {
  const navigate = useNavigate();
  const [data, setData] = useState<Application>(emptyApplication);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data?: Application; step?: number } & Partial<Application>;
        if (parsed.data) {
          setData({ ...emptyApplication(), ...parsed.data });
          if (typeof parsed.step === "number") setStep(Math.min(Math.max(parsed.step, 0), STEPS.length - 1));
        } else {
          setData({ ...emptyApplication(), ...(parsed as unknown as Application) });
        }
      }
    } catch {
      /* ignore corrupt draft */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step }));
  }, [data, step, loaded]);

  const patch = (partial: Partial<Application>) => {
    setData((d) => ({ ...d, ...partial }));
    setError(null);
  };

  const patchBody = (key: (typeof BODY_FIELDS)[number]["key"], next: BodyItem) => {
    setData((d) => ({ ...d, [key]: next }));
    setError(null);
  };

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const goNext = () => {
    const message = validateStep(step, data);
    if (message) {
      setError(message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step === STEPS.length - 1) {
      void closeFicha();
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeFicha = async () => {
    const submitted: Application = {
      ...data,
      submittedAt: new Date().toLocaleString("es-MX", {
        dateStyle: "long",
        timeStyle: "short",
      }),
    };
    const payload = JSON.stringify(submitted);
    rememberFicha(submitted);
    try {
      localStorage.setItem(FICHA_KEY, payload);
      sessionStorage.setItem(FICHA_KEY, payload);
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      try {
        sessionStorage.setItem(FICHA_KEY, payload);
      } catch {
        /* in-memory still holds it for this tab */
      }
    }
    setSending(true);
    setError(null);
    try {
      const id = await persistFicha(submitted);
      try {
        localStorage.setItem(FICHA_REMOTE_KEY, id);
        sessionStorage.setItem(FICHA_REMOTE_KEY, id);
      } catch {
        /* ignore */
      }
      void navigate({ to: "/gracias" });
    } catch {
      try {
        localStorage.setItem(FICHA_REMOTE_KEY, "");
        sessionStorage.setItem(FICHA_REMOTE_KEY, "");
      } catch {
        /* ignore */
      }
      setSending(false);
      setError(
        "No se pudo guardar en el expediente. Tu ficha sigue en este dispositivo — vuelve a intentar Cerrar ficha.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!loaded) {
    return (
      <PageShell footer={false}>
        <div className="mx-auto max-w-2xl px-4 py-24 text-sm text-muted">Cargando tu ficha…</div>
      </PageShell>
    );
  }

  return (
    <PageShell footer={false}>
      <div className="border-b border-line bg-paper/70">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          {step === 0 ? (
            <p className="mb-4 max-w-prose text-[15px] leading-relaxed text-ink-soft">
              Esta es la ficha de admisión de Enteogénesis. {SITE.facilitators} la leen antes de
              la entrevista. El retiro se cuenta en{" "}
              <a href={SITE.home} className="text-clay underline-offset-4 hover:underline">
                terrasana.pro
              </a>
              .
            </p>
          ) : null}
          <p className="eyebrow">Ficha de admisión</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <h1 className="text-2xl font-normal sm:text-3xl">{STEPS[step].title}</h1>
            <p className="shrink-0 text-xs tracking-[0.14em] text-muted">
              {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted">{STEPS[step].caption}</p>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-clay transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <form
        className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 pb-36 sm:px-6 sm:pb-28"
        onSubmit={(e) => {
          e.preventDefault();
          goNext();
        }}
      >
        {error ? (
          <p className="rounded-2xl border border-hold/30 bg-hold/5 px-4 py-3 text-sm text-hold" role="alert">
            {error}
          </p>
        ) : null}

        {step === 0 ? <Marco data={data} patch={patch} /> : null}
        {step === 1 ? <Identidad data={data} patch={patch} /> : null}
        {step === 2 ? <Camino data={data} patch={patch} /> : null}
        {step === 3 ? <Historia data={data} patch={patch} /> : null}
        {step === 4 ? <Mente data={data} patch={patch} /> : null}
        {step === 5 ? <Cuerpo data={data} patchBody={patchBody} patch={patch} /> : null}
        {step === 6 ? <Intencion data={data} patch={patch} /> : null}
        {step === 7 ? <Declaracion data={data} patch={patch} /> : null}

        <div className="no-print fixed inset-x-0 bottom-16 z-30 border-t border-line bg-cream/95 backdrop-blur-md sm:bottom-0">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className={cn(
                "inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm",
                step === 0 ? "invisible" : "text-ink-soft hover:text-ink",
              )}
            >
              <ArrowLeft className="size-4" />
              Atrás
            </button>
            <button
              type="submit"
              className="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm text-cream hover:bg-ink-soft disabled:opacity-60"
              disabled={sending}
            >
              {sending ? "Enviando…" : step === STEPS.length - 1 ? "Cerrar ficha" : "Continuar"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </form>
    </PageShell>
  );
}

function Marco({
  data,
  patch,
}: {
  data: Application;
  patch: (p: Partial<Application>) => void;
}) {
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-ink-soft">
      <p>
        Esta ficha debe completarse con información veraz y honesta. Ocultar detalles puede afectar
        o poner en riesgo tu proceso y el del grupo.
      </p>
      <p>
        {SITE.facilitators} se reservan el derecho de admisión de acuerdo con tu estado presente de
        salud emocional, mental, física y espiritual. Lo que compartas lo leen ellos. No va a un
        expediente abierto ni a investigación.
      </p>
      <p>
        Tus respuestas se guardan en este dispositivo mientras avanzas. Al cerrar, llegan al
        expediente que leen Isaac y Claudia. Conserva una copia: es tu respaldo.
      </p>
      <p>
        Este evento es una experiencia de crecimiento personal y no debería considerarse un
        sustituto de la psicoterapia. En las dinámicas pueden aparecer liberaciones emocionales y
        psíquicas intensas.
      </p>
      <div className="rounded-2xl border border-sand bg-sand/30 p-5 text-sm text-ink">
        <p className="eyebrow">No es apropiado</p>
        <p className="mt-3 leading-relaxed">
          Embarazo · problemas cardiovasculares · accidentes cerebrovasculares · hipertensión severa
          · enfermedades mentales · fracturas o cirugías recientes · enfermedades infecciosas agudas
          · epilepsia · uso de ISRS, IMAO o anticonvulsivos.
        </p>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper p-4">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-ink"
          checked={data.marcoAceptado}
          onChange={(e) => patch({ marcoAceptado: e.target.checked })}
        />
        <span className="text-sm leading-relaxed text-ink">
          Leí el marco, entiendo las contraindicaciones y me comprometo a responder con honestidad.
        </span>
      </label>
    </div>
  );
}

function Identidad({
  data,
  patch,
}: {
  data: Application;
  patch: (p: Partial<Application>) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-ink-soft">
        Estos datos son para que {SITE.facilitators} puedan contactarte. No se publican.
      </p>
      <Field label="Nombre completo" required>
        <TextInput
          value={data.nombreCompleto}
          onChange={(e) => patch({ nombreCompleto: e.target.value })}
          autoComplete="name"
        />
      </Field>
      <Field label="Fecha de nacimiento" required>
        <TextInput
          type="date"
          value={data.fechaNacimiento}
          onChange={(e) => patch({ fechaNacimiento: e.target.value })}
        />
      </Field>
      <Field label="Fechas del retiro en el que quieres participar" required>
        <SelectInput
          value={data.fechasRetiro}
          onChange={(e) => patch({ fechasRetiro: e.target.value })}
        >
          {RETREATS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </SelectInput>
      </Field>
      {data.fechasRetiro === "otra" ? (
        <Field label="Escribe las fechas">
          <TextInput
            value={data.fechasRetiroOtra}
            onChange={(e) => patch({ fechasRetiroOtra: e.target.value })}
            placeholder="Ej. noviembre 2026"
          />
        </Field>
      ) : null}
      <Field label="Sexo" required>
        <Choice
          value={data.sexo}
          onChange={(sexo) => patch({ sexo })}
          options={[
            { value: "Mujer", label: "Mujer" },
            { value: "Hombre", label: "Hombre" },
            { value: "Otro", label: "Otro" },
          ]}
        />
      </Field>
      <Field label="Ocupación" required>
        <TextInput value={data.ocupacion} onChange={(e) => patch({ ocupacion: e.target.value })} />
      </Field>
      <Field label="Teléfono" required>
        <TextInput
          type="tel"
          value={data.telefono}
          onChange={(e) => patch({ telefono: e.target.value })}
          autoComplete="tel"
        />
      </Field>
      <Field label="E-mail" required>
        <TextInput
          type="email"
          value={data.email}
          onChange={(e) => patch({ email: e.target.value })}
          autoComplete="email"
        />
      </Field>
      <Field label="Dirección" required>
        <TextInput
          value={data.direccion}
          onChange={(e) => patch({ direccion: e.target.value })}
          autoComplete="street-address"
        />
      </Field>
      <Field label="Contacto en caso de emergencia (nombre y teléfono)" required>
        <TextArea
          value={data.emergencia}
          onChange={(e) => patch({ emergencia: e.target.value })}
        />
      </Field>
      <Field label="¿Cómo te enteraste de nosotros? ¿Por qué medio y/o quién te recomendó?">
        <TextArea
          value={data.comoSeEntero}
          onChange={(e) => patch({ comoSeEntero: e.target.value })}
        />
      </Field>
    </div>
  );
}

function Camino({
  data,
  patch,
}: {
  data: Application;
  patch: (p: Partial<Application>) => void;
}) {
  return (
    <div className="space-y-5">
      <Field
        label="¿Has participado en eventos, cursos, terapias o ceremonias con psicotrópicos / psicodélicos?"
        required
      >
        <YesNo
          name="participado"
          value={data.participadoPsicodelicos}
          onChange={(participadoPsicodelicos) => patch({ participadoPsicodelicos })}
        />
      </Field>
      {data.participadoPsicodelicos === "si" ? (
        <Field label="Si la respuesta es sí, explica en qué contexto">
          <TextArea
            value={data.participadoContexto}
            onChange={(e) => patch({ participadoContexto: e.target.value })}
          />
        </Field>
      ) : null}
      <Field
        label="Describe detalladamente las plantas o sustancias estimulantes, depresoras o psicotrópicas que has consumido y con qué frecuencia"
        hint="Incluye nicotina, alcohol, cafeína y fármacos."
        required
      >
        <TextArea
          value={data.sustanciasHistorial}
          onChange={(e) => patch({ sustanciasHistorial: e.target.value })}
        />
      </Field>
      <Field label="¿Consumes de forma recreativa alguna planta o sustancia estimulante, depresora o psicotrópica? Describe con qué frecuencia.">
        <TextArea
          value={data.consumeRecreativo}
          onChange={(e) => patch({ consumeRecreativo: e.target.value })}
        />
      </Field>
      <Field label="¿Tienes alguna práctica espiritual? Describe cuál y si forma parte de alguna religión o linaje específico.">
        <TextArea
          value={data.practicaEspiritual}
          onChange={(e) => patch({ practicaEspiritual: e.target.value })}
        />
      </Field>
      <Field label="¿Tienes algún maestro o guía espiritual?">
        <TextInput
          value={data.maestroGuia}
          onChange={(e) => patch({ maestroGuia: e.target.value })}
        />
      </Field>
    </div>
  );
}

function Historia({
  data,
  patch,
}: {
  data: Application;
  patch: (p: Partial<Application>) => void;
}) {
  return (
    <div className="space-y-5">
      <Field
        label="¿Realizas o has realizado algún tipo de terapia psicológica? Describe el tipo de terapia y la duración."
        required
      >
        <TextArea value={data.terapia} onChange={(e) => patch({ terapia: e.target.value })} />
      </Field>
      <Field label="¿Has tenido alguna mala experiencia o viaje con alguna sustancia o práctica espiritual? Describe lo que experimentaste interna y externamente, incluyendo síntomas físicos.">
        <TextArea
          value={data.malaExperiencia}
          onChange={(e) => patch({ malaExperiencia: e.target.value })}
        />
      </Field>
      <Field label="¿Has experimentado alguna emergencia espiritual que te haya sobrepasado, a tal grado que hayas perdido la funcionalidad física, mental o emocional? Describe su contenido y síntomas.">
        <TextArea
          value={data.emergenciaEspiritual}
          onChange={(e) => patch({ emergenciaEspiritual: e.target.value })}
        />
      </Field>
      <Field
        label="Describe la información que conozcas de tu proceso durante el embarazo de tu madre y tu nacimiento."
        hint="Circunstancias, contexto, complicaciones, intervenciones médicas. Toda esta información es muy relevante para atender tu proceso durante el retiro."
        required
      >
        <TextArea
          value={data.nacimiento}
          onChange={(e) => patch({ nacimiento: e.target.value })}
        />
      </Field>
    </div>
  );
}

function Mente({
  data,
  patch,
}: {
  data: Application;
  patch: (p: Partial<Application>) => void;
}) {
  return (
    <div className="space-y-5">
      <Field
        label="¿Has padecido alguna enfermedad mental? ¿Has recibido tratamiento por tal motivo?"
        hint="Describe diagnóstico, fechas, tratamiento, medicamentos y el psiquiatra que te atendió. Si no aplica, escribe «no»."
        required
      >
        <TextArea
          value={data.enfermedadMental}
          onChange={(e) => patch({ enfermedadMental: e.target.value })}
        />
      </Field>
      <p className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-muted">
        Si estás en una crisis aguda, este cuestionario no es el lugar. Habla con alguien de
        confianza o llama a {SITE.crisis.name}: {SITE.crisis.phone}.
      </p>
      <Field label="Describe lo que sepas de antecedentes en tu familia de enfermedad mental, o rarezas o peculiaridades que afectaran el bienestar de familiares y consideres importante mencionar.">
        <TextArea
          value={data.antecedentesFamiliares}
          onChange={(e) => patch({ antecedentesFamiliares: e.target.value })}
        />
      </Field>
    </div>
  );
}

function Cuerpo({
  data,
  patch,
  patchBody,
}: {
  data: Application;
  patch: (p: Partial<Application>) => void;
  patchBody: (key: (typeof BODY_FIELDS)[number]["key"], next: BodyItem) => void;
}) {
  return (
    <div className="space-y-4">
      {BODY_FIELDS.map((field) => (
        <YesNoDetail
          key={field.key}
          question={field.question}
          detail={field.detail}
          value={data[field.key]}
          onChange={(next) => patchBody(field.key, next)}
        />
      ))}
      <Field label="¿Tienes algún otro padecimiento que consideres pertinente hacer de nuestro conocimiento?">
        <TextArea
          value={data.otroPadecimiento}
          onChange={(e) => patch({ otroPadecimiento: e.target.value })}
        />
      </Field>
      <Field label="¿Estás pasando por un cambio drástico o pérdida en tu vida en este momento, o en los días del retiro es el aniversario de una situación de cambio o pérdida?">
        <TextArea
          value={data.cambioDramatico}
          onChange={(e) => patch({ cambioDramatico: e.target.value })}
        />
      </Field>
      <Field
        label="¿Estás tomando algún tipo de medicamento o estás en algún tipo de tratamiento médico, farmacéutico, psiquiátrico u homeopático?"
        hint="Nombre del medicamento, frecuencia y dosis. Si no tomas nada, escribe «ninguno»."
        required
      >
        <TextArea
          value={data.medicamentos}
          onChange={(e) => patch({ medicamentos: e.target.value })}
        />
      </Field>
    </div>
  );
}

function Intencion({
  data,
  patch,
}: {
  data: Application;
  patch: (p: Partial<Application>) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Describe quién eres" required>
        <TextArea value={data.quienEres} onChange={(e) => patch({ quienEres: e.target.value })} />
      </Field>
      <Field label="¿Qué aspectos de tu sombra has trabajado? ¿Cuáles son los aspectos de tu sombra que te generan conflicto?">
        <TextArea value={data.sombra} onChange={(e) => patch({ sombra: e.target.value })} />
      </Field>
      <Field label="Describe cuáles son tus miedos más profundos">
        <TextArea value={data.miedos} onChange={(e) => patch({ miedos: e.target.value })} />
      </Field>
      <Field label="Describe las razones por las que deseas participar en este trabajo" required>
        <TextArea value={data.razones} onChange={(e) => patch({ razones: e.target.value })} />
      </Field>
    </div>
  );
}

function Declaracion({
  data,
  patch,
}: {
  data: Application;
  patch: (p: Partial<Application>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-3xl border border-line bg-paper p-5 text-sm leading-relaxed text-ink-soft">
        <p>Declaro que la información presentada en esta ficha es verdadera.</p>
        <p>
          Declaro que no estoy utilizando medicamentos neuropsiquiátricos, antidepresivos del tipo
          inhibidores selectivos de la recaptura de serotonina (ISRS), inhibidores de la
          monoaminooxidasa (IMAO) o anticonvulsivos, mientras estoy en el protocolo de trabajo.
        </p>
        <p>
          Declaro que no tengo historial de brotes psicóticos o internación psiquiátrica anterior,
          mientras en protocolos de trabajo en estados no ordinarios de consciencia (ENOC).
        </p>
        <p>
          Declaro que he adquirido de forma externa la sustancia psicoactiva y la he consumido
          libremente, solicitando para ello únicamente el acompañamiento de las personas
          facilitadoras durante el tiempo que dura el efecto de ésta.
        </p>
        <p>
          Asumo total responsabilidad por mi libre participación en el protocolo de trabajo. Me he
          informado y soy plenamente consciente de los efectos que puede tener en mi organismo, así
          como de las condiciones y medicamentos que están contraindicados.
        </p>
      </div>
      <Field label="¿Aceptas esta declaración?" required>
        <YesNo name="declara" value={data.declara} onChange={(declara) => patch({ declara })} />
      </Field>
      <Field
        label="Lugar, nombre completo, fecha"
        hint="Ej. Ciudad de México, María López, 10 de septiembre de 2026."
        required
      >
        <TextInput value={data.firma} onChange={(e) => patch({ firma: e.target.value })} />
      </Field>
    </div>
  );
}
