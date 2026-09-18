import { Check, Copy, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { crearEnlaceEdicion, enlaceVigente } from "@/lib/edicion/server";
import { VIDA_DEL_ENLACE_HORAS, urlDelEnlace } from "@/lib/edicion/enlace";

/**
 * Genera el enlace con el que quien llenó la ficha puede completarla.
 *
 * El token se muestra una sola vez, al crearlo: en la base sólo queda su hash.
 * Si se pierde, se genera otro — y el anterior deja de servir.
 */
export function EnlaceCompletar({ fichaId }: { fichaId: string }) {
  const [enlace, setEnlace] = useState<string | null>(null);
  const [vigente, setVigente] = useState<{ expiraAt: string; creadoPor: string } | null>(null);
  const [creando, setCreando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void enlaceVigente({ data: fichaId })
      .then((r) => vivo && setVigente(r))
      .catch(() => {
        /* saber si había uno es una comodidad, no bloquea crear otro */
      });
    return () => {
      vivo = false;
    };
  }, [fichaId]);

  const crear = () => {
    setCreando(true);
    setError(null);
    void crearEnlaceEdicion({ data: fichaId })
      .then((r) => {
        setEnlace(urlDelEnlace(window.location.origin, r.token));
        setVigente({ expiraAt: r.expiraAt, creadoPor: "" });
        setCopiado(false);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudo crear el enlace."),
      )
      .finally(() => setCreando(false));
  };

  const copiar = () => {
    if (!enlace) return;
    void navigator.clipboard
      .writeText(enlace)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      })
      .catch(() => setError("No se pudo copiar. Selecciona el enlace y cópialo a mano."));
  };

  return (
    <div className="no-print">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={crear}
          disabled={creando}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm hover:border-ink/40 disabled:opacity-40"
        >
          <Link2 className="size-4" />
          {creando
            ? "Creando…"
            : vigente && !enlace
              ? "Crear otro enlace"
              : "Enviar link para completar ficha"}
        </button>
        {vigente && !enlace ? (
          <span className="text-xs text-muted">
            Ya hay uno sin usar, vigente hasta el{" "}
            {new Date(vigente.expiraAt).toLocaleString("es-MX", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            . Crear otro lo cancela.
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-2xl border border-hold/30 bg-hold/5 px-4 py-3 text-sm text-hold">
          {error}
        </p>
      ) : null}

      {enlace ? (
        <div className="mt-3 rounded-2xl border border-sand bg-sand/20 p-4">
          <p className="text-xs font-bold tracking-[0.18em] text-clay">
            CÓPIALO AHORA · NO SE PUEDE VOLVER A VER
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="min-w-0 flex-1 break-all rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink">
              {enlace}
            </code>
            <button
              type="button"
              onClick={copiar}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-sm text-cream hover:bg-ink-soft"
            >
              {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Vale {VIDA_DEL_ENLACE_HORAS} horas y se cancela en cuanto ella guarde. Abre su ficha
            con todo lo que ya contestó, sin pedirle cuenta ni contraseña. Mándaselo por donde ya
            hablan con ella.
          </p>
        </div>
      ) : null}
    </div>
  );
}
