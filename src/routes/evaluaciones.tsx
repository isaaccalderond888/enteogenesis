import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site-chrome";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  TEST_CONFIGS,
  type TestId,
} from "@/lib/evaluaciones/tests";

export const Route = createFileRoute("/evaluaciones")({
  head: () => ({
    meta: [
      { title: "Evaluaciones · Enteogénesis" },
      // Se comparte por enlace con quien corresponde; no se descubre desde fuera.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EvaluacionesPage,
});

function EvaluacionesPage() {
  const porCategoria = CATEGORY_ORDER.map((cat) => ({
    cat,
    tests: (Object.keys(TEST_CONFIGS) as TestId[]).filter(
      (id) => TEST_CONFIGS[id].category === cat,
    ),
  })).filter((g) => g.tests.length > 0);

  return (
    <PageShell>
      <article className="mx-auto max-w-2xl px-4 pb-20 pt-12 sm:px-6">
        <p className="eyebrow">Evaluaciones</p>
        <h1 className="mt-3 text-3xl font-normal sm:text-4xl">Instrumentos de tamizaje</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Escalas autoaplicadas de uso clínico. Ninguna diagnostica: orientan una conversación.
          Los resultados se quedan en este dispositivo y no se envían a nadie.
        </p>

        <div className="mt-12 space-y-12">
          {porCategoria.map(({ cat, tests }) => (
            <section key={cat}>
              <h2 className="text-2xl font-normal">{CATEGORY_LABELS[cat].title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                {CATEGORY_LABELS[cat].description}
              </p>
              <div className="mt-5 space-y-3">
                {tests.map((id) => (
                  <Link
                    key={id}
                    to="/evaluaciones/$id"
                    params={{ id }}
                    className="block rounded-2xl border border-line bg-paper p-5 hover:border-ink/30"
                  >
                    <p className="text-sm font-medium text-ink">
                      {TEST_CONFIGS[id].name}
                      <span className="ml-2 font-normal text-clay">
                        {TEST_CONFIGS[id].subtitle}
                      </span>
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">
                      {TEST_CONFIGS[id].cardDescription}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-14 text-xs leading-relaxed text-muted">
          Instrumentos de tamizaje, no de diagnóstico. Un resultado elevado no es un
          padecimiento ni un rechazo; un resultado bajo no descarta nada. La lectura la hacen
          Isaac Calderón y Claudia Saviñón en conversación.
        </p>
      </article>
    </PageShell>
  );
}
