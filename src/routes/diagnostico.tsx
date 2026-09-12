import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { dbSource, getSql } from "@/lib/db";

type Report = {
  backend: string;
  conecta: boolean;
  tablaFichas: boolean;
  migraciones: string[];
  fichas: number | null;
  error: string | null;
};

/**
 * Read-only deploy check: which database the running server actually reached and
 * whether the schema is there. Exposes no connection string, no credentials and
 * no ficha content — only names and counts — so it is safe on a public URL and
 * answers in one page what otherwise takes a round trip through build logs.
 */
const report = createServerFn({ method: "GET" }).handler(async (): Promise<Report> => {
  const base: Report = {
    backend: dbSource,
    conecta: false,
    tablaFichas: false,
    migraciones: [],
    fichas: null,
    error: null,
  };
  try {
    const sql = await getSql();
    base.conecta = true;
    const t = await sql.query<{ n: number }>(
      `select count(*)::int as n from information_schema.tables
       where table_schema = 'public' and table_name = 'fichas'`,
    );
    base.tablaFichas = Number(t[0]?.n ?? 0) > 0;
    try {
      const m = await sql.query<{ name: string }>(`select name from _migrations order by name`);
      base.migraciones = m.map((r) => r.name);
    } catch {
      /* _migrations missing — leave the list empty, that is the finding */
    }
    if (base.tablaFichas) {
      const c = await sql.query<{ n: number }>(`select count(*)::int as n from fichas`);
      base.fichas = Number(c[0]?.n ?? 0);
    }
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err);
  }
  return base;
});

export const Route = createFileRoute("/diagnostico")({
  loader: () => report(),
  component: Diagnostico,
});

function Diagnostico() {
  const loaded = Route.useLoaderData();
  const r: Report = loaded ?? {
    backend: "?",
    conecta: false,
    tablaFichas: false,
    migraciones: [],
    fichas: null,
    error: "El servidor no devolvió el reporte.",
  };
  const ok = r.backend === "neon" && r.conecta && r.tablaFichas;
  const row = (k: string, v: string) => (
    <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #E2D0B6" }}>
      <span style={{ minWidth: 200, color: "#976150" }}>{k}</span>
      <span>{v}</span>
    </div>
  );
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24, fontFamily: "Lato, system-ui, sans-serif" }}>
      <h1 style={{ color: "#108474" }}>Diagnóstico</h1>
      <p style={{ fontSize: 20, fontWeight: 700, color: ok ? "#108474" : "#976150" }}>
        {ok ? "Todo en orden — las fichas se guardan." : "Hay un problema. El detalle está abajo."}
      </p>
      {row("Base de datos", r.backend === "neon" ? "Neon (permanente)" : "PGLite (temporal — se borra)")}
      {row("Conecta", r.conecta ? "Sí" : "No")}
      {row("Tabla de fichas", r.tablaFichas ? "Existe" : "NO existe")}
      {row("Migraciones aplicadas", r.migraciones.length ? r.migraciones.join(", ") : "ninguna")}
      {row("Fichas guardadas", r.fichas === null ? "—" : String(r.fichas))}
      {r.error ? row("Error", r.error) : null}
    </main>
  );
}
