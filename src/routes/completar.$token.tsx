import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FichaWizard } from "@/components/ficha";
import { PageShell } from "@/components/site-chrome";
import type { Application } from "@/lib/application";
import { fichaPorEnlace, guardarPorEnlace, type FichaParaCompletar } from "@/lib/edicion/server";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/completar/$token")({
  head: () => ({
    meta: [
      { title: "Completar tu ficha · Enteogénesis" },
      // El enlace se manda a una persona concreta: no se descubre desde fuera.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CompletarPage,
});

function CompletarPage() {
  const { token } = Route.useParams();
  const [estado, setEstado] = useState<FichaParaCompletar | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [guardada, setGuardada] = useState(false);

  useEffect(() => {
    let vivo = true;
    void fichaPorEnlace({ data: token })
      .then((r) => vivo && setEstado(r))
      .catch(() => vivo && setFallo("No se pudo abrir tu ficha. Vuelve a intentarlo en un momento."));
    return () => {
      vivo = false;
    };
  }, [token]);

  if (guardada) return <Listo />;
  if (fallo) return <Aviso texto={fallo} />;
  if (!estado) {
    return (
      <PageShell footer={false}>
        <div className="mx-auto max-w-2xl px-4 py-24 text-sm text-muted">Abriendo tu ficha…</div>
      </PageShell>
    );
  }
  if (!estado.ok) return <Aviso texto={estado.aviso} />;

  const primerNombre = estado.nombre.trim().split(/\s+/)[0] ?? "";

  return (
    <FichaWizard
      edicion={{
        inicial: estado.data,
        // Una clave por enlace: si dos personas usan el mismo navegador, el
        // borrador de una no puede aparecer en la ficha de la otra.
        claveBorrador: `terrasana-completar-${token.slice(0, 12)}`,
        guardar: async (data: Application) => {
          await guardarPorEnlace({ data: { token, data } });
        },
        alGuardar: () => setGuardada(true),
        intro: (
          <>
            <p>
              {primerNombre ? `Hola, ${primerNombre}. ` : ""}Esta es la ficha que ya enviaste,
              con todo lo que contestaste. Avanza hasta lo que quieras completar o corregir —lo
              demás se queda como está— y guarda al final.
            </p>
            <p>
              No hace falta que la llenes de nuevo. Si algo cambió desde que la enviaste —una
              medicación, una fecha, algo de salud— este es el lugar para decirlo, y{" "}
              {SITE.facilitators} lo verán antes de la entrevista.
            </p>
          </>
        ),
      }}
    />
  );
}

function Listo() {
  return (
    <PageShell>
      <div className="mx-auto max-w-lg px-4 py-24 sm:px-6">
        <p className="eyebrow">Completar tu ficha</p>
        <h1 className="mt-3 text-2xl font-normal">Listo, quedó guardado</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Tus cambios ya están en tu ficha y {SITE.facilitators} los verán antes de la
          entrevista. No hace falta que hagas nada más.
        </p>
        <p className="mt-6 text-[15px] leading-relaxed text-muted">
          Este enlace ya se usó. Si te falta algo, pídeles otro y seguimos desde donde quedó.
        </p>
      </div>
    </PageShell>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-lg px-4 py-24 sm:px-6">
        <p className="eyebrow">Completar tu ficha</p>
        <h1 className="mt-3 text-2xl font-normal">Este enlace ya no abre</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{texto}</p>
        <p className="mt-6 text-[15px] leading-relaxed text-muted">
          Tu ficha sigue guardada: nada de lo que contestaste se perdió.
        </p>
      </div>
    </PageShell>
  );
}
