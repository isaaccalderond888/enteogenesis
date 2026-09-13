import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { debeRecargar, esVersionVieja } from "@/lib/version-vieja";

const FALLBACK_MESSAGE = "Ocurrió un error inesperado. Recarga la página.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const vieja = esVersionVieja(error);
  const [recargando, setRecargando] = useState(false);

  useEffect(() => {
    if (!vieja) return;
    if (!debeRecargar(typeof window === "undefined" ? undefined : window.sessionStorage)) return;
    setRecargando(true);
    window.location.reload();
  }, [vieja]);

  // El mensaje crudo de este fallo habla de módulos y de rutas de archivos: no
  // le dice nada a quien está a punto de entrar a una entrevista.
  const mensaje = vieja
    ? recargando
      ? "El sitio se actualizó mientras tenías esta página abierta. Recargando…"
      : "El sitio se actualizó mientras tenías esta página abierta. Recarga la página para entrar."
    : errorMessage(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream px-6 text-center text-ink">
      <span className="text-clay" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={1.5} />
      </span>
      <h1 className="text-lg font-normal tracking-wide">
        {vieja ? "Hay una versión más nueva" : "Algo se interrumpió"}
      </h1>
      <p className="max-w-md text-sm break-words text-muted">{mensaje}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 rounded-full border border-line px-5 py-2 text-sm text-ink transition hover:bg-sand/40"
      >
        Recargar la página
      </button>
    </main>
  );
}
