import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/site-chrome";
import { SITE } from "@/lib/site";
import { TEST_CONFIGS, type TestConfig, type TestId } from "@/lib/evaluaciones/tests";

export const Route = createFileRoute("/evaluaciones_/$id")({
  head: () => ({
    meta: [
      { title: "Evaluación · Enteogénesis" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: ({ params }) => {
    if (!(params.id in TEST_CONFIGS)) throw notFound();
  },
  component: EvaluacionPage,
});

/** Banda de severidad en la que cae un puntaje. */
function bandaDe(config: TestConfig, score: number) {
  return config.bands.find((b) => score <= b.max) ?? config.bands[config.bands.length - 1];
}

function EvaluacionPage() {
  const { id } = Route.useParams();
  const config = TEST_CONFIGS[id as TestId];
  const total = config.questions.length;

  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [enviado, setEnviado] = useState(false);

  const respondidas = answers.filter((a) => a !== null).length;
  const completo = respondidas === total;
  // Una escala larga (Likert de 0-10, por ejemplo) no cabe como botones en un
  // teléfono: ahí conviene un deslizador.
  const usaDeslizador = config.scale.length >= 8;

  const score = useMemo(
    () => (completo ? config.computeScore(answers as number[]) : 0),
    [answers, completo, config],
  );

  if (enviado && completo) {
    const banda = bandaDe(config, score);
    const pct = Math.max(
      0,
      Math.min(100, ((score - config.minScore) / (config.maxScore - config.minScore)) * 100),
    );
    return (
      <PageShell>
        <article className="mx-auto max-w-2xl px-4 pb-20 pt-12 sm:px-6">
          <p className="eyebrow">Resultado</p>
          <h1 className="mt-3 text-3xl font-normal sm:text-4xl">{config.name}</h1>
          <p className="mt-1 text-[15px] text-ink-soft">{config.subtitle}</p>

          <div className="mt-8 rounded-3xl border border-line bg-paper p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-normal text-ink tabular-nums">{score}</span>
              <span className="text-sm text-muted">de {config.maxScore}</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sand/60">
              <div className={`h-full ${banda.barClass}`} style={{ width: `${pct}%` }} />
            </div>
            <p className={`mt-4 text-lg ${banda.textClass}`}>{banda.label}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{banda.description}</p>
          </div>

          {config.subScales?.length ? (
            <div className="mt-6 space-y-3">
              {config.subScales.map((sub) => {
                const bruto = sub.indices.reduce((acc, i) => acc + ((answers[i] as number) ?? 0), 0);
                const valor = bruto * (sub.multiplier ?? 1);
                const b = sub.bands.find((x) => valor <= x.max) ?? sub.bands[sub.bands.length - 1];
                return (
                  <div
                    key={sub.label}
                    className="flex items-center justify-between rounded-2xl border border-line bg-paper px-5 py-4"
                  >
                    <span className="text-sm text-ink">{sub.label}</span>
                    <span className="text-sm">
                      <span className="tabular-nums text-ink-soft">
                        {valor}/{sub.maxScore}
                      </span>
                      <span className={`ml-3 ${b.textClass}`}>{b.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-clay/30 bg-sand/40 p-5">
            <p className="text-[15px] leading-relaxed text-ink">{config.disclaimer}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Si algo de lo que aparece aquí te preocupa, háblalo con {SITE.facilitators}. Ante
              una crisis o riesgo inmediato, busca atención de urgencia.
            </p>
          </div>

          <div className="no-print mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setAnswers(Array(total).fill(null));
                setEnviado(false);
                window.scrollTo({ top: 0 });
              }}
              className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm hover:border-ink/40"
            >
              Responder de nuevo
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm hover:border-ink/40"
            >
              Imprimir o guardar como PDF
            </button>
            <Link
              to="/evaluaciones"
              className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm text-cream"
            >
              Otras evaluaciones
            </Link>
          </div>
        </article>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <article className="mx-auto max-w-2xl px-4 pb-20 pt-12 sm:px-6">
        <p className="eyebrow">Evaluación</p>
        <h1 className="mt-3 text-3xl font-normal sm:text-4xl">{config.name}</h1>
        <p className="mt-1 text-[15px] text-ink-soft">{config.subtitle}</p>

        {config.note ? (
          <div className="mt-6 rounded-2xl border border-clay/30 bg-sand/40 p-5 text-[15px] leading-relaxed text-ink-soft">
            {config.note}
          </div>
        ) : null}

        <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">{config.instructions}</p>

        <p className="mt-4 text-[15px] leading-relaxed text-clay">
          Esta escala está pensada para responderse acompañada, durante la entrevista con{" "}
          {SITE.facilitators}. Si llegaste por tu cuenta, espera a ese momento.
        </p>

        <div className="no-print sticky top-0 z-10 -mx-4 mt-8 bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand/60">
            <div
              className="h-full bg-sage transition-all"
              style={{ width: `${(respondidas / total) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            {respondidas} de {total}
          </p>
        </div>

        <ol className="mt-6 divide-y divide-line">
          {config.questions.map((q, qi) => (
            <li key={q} className="py-6">
              <p className="text-[15px] leading-relaxed text-ink">
                <span className="mr-2 select-none text-xs text-muted tabular-nums">{qi + 1}.</span>
                {q}
              </p>

              {usaDeslizador ? (
                <div className="mt-4 flex items-center gap-4">
                  <input
                    type="range"
                    min={config.scale[0].value}
                    max={config.scale[config.scale.length - 1].value}
                    step={1}
                    value={answers[qi] ?? config.scale[0].value}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAnswers((prev) => prev.map((a, i) => (i === qi ? v : a)));
                    }}
                    className="h-1.5 flex-1 cursor-pointer accent-[#108474]"
                    aria-label={q}
                  />
                  <span className="w-10 text-right text-lg tabular-nums text-ink">
                    {answers[qi] ?? "–"}
                  </span>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {config.scale.map((op) => {
                    const activo = answers[qi] === op.value;
                    return (
                      <button
                        key={op.value}
                        type="button"
                        aria-pressed={activo}
                        onClick={() =>
                          setAnswers((prev) => prev.map((a, i) => (i === qi ? op.value : a)))
                        }
                        className={`inline-flex h-10 items-center rounded-full border px-4 text-sm transition ${
                          activo
                            ? "border-ink bg-ink text-cream"
                            : "border-line text-ink-soft hover:border-ink/40"
                        }`}
                      >
                        {op.full}
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={!completo}
            onClick={() => {
              setEnviado(true);
              window.scrollTo({ top: 0 });
            }}
            className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-8 text-sm text-cream disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ver resultado
          </button>
          {!completo ? (
            <p className="text-xs text-muted">Faltan {total - respondidas} respuestas.</p>
          ) : null}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted">{config.disclaimer}</p>
      </article>
    </PageShell>
  );
}
