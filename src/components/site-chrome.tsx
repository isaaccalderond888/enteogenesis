import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";

export function SiteHeader({ internal = false }: { internal?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to={internal ? "/expedientes" : "/"} className="flex min-w-0 items-center gap-3">
          <img
            src="/images/mark.jpg"
            alt="Terrasana"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="min-w-0">
            <span className="block text-[11px] font-bold tracking-[0.28em] text-clay">
              TERRASANA
            </span>
            <span className="block truncate text-sm text-ink-soft">
              {internal ? "Archivo interno" : "Admisión · Enteogénesis"}
            </span>
          </span>
        </Link>
        {internal ? (
          <span className="shrink-0 text-[12px] tracking-[0.08em] text-muted">Solo staff</span>
        ) : (
          <a
            href={SITE.home}
            className="shrink-0 text-[12px] tracking-[0.08em] text-muted hover:text-ink"
          >
            terrasana.pro
          </a>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-6 text-center sm:px-6">
        <p className="text-sm text-ink-soft">{SITE.facilitators}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Tepetlixpa · Al cerrar, la ficha llega al expediente de {SITE.facilitators}.
        </p>
        <a
          href={SITE.home}
          className="mt-3 inline-block text-[11px] tracking-[0.14em] text-clay hover:text-clay-deep"
        >
          TERRASANA.PRO
        </a>
      </div>
    </footer>
  );
}

export function PageShell({
  children,
  footer = true,
  internal = false,
}: {
  children: ReactNode;
  footer?: boolean;
  internal?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <SiteHeader internal={internal} />
      <div className="flex-1">{children}</div>
      {footer && !internal ? <SiteFooter /> : null}
    </div>
  );
}
