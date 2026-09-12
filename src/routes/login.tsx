import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site-chrome";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SITE } from "@/lib/site";

/**
 * Whether this deploy has its own Google client. Asked of the server because the
 * credentials are server-only: the page must not offer a provider that cannot
 * complete, which is exactly the dead button a custom domain used to show.
 */
const googleAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const { googleNativeEnabled } = await import("@/lib/auth/server");
  return googleNativeEnabled;
});

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acceso interno · Terrasana" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: () => googleAvailable(),
  component: LoginPage,
});

function LoginPage() {
  const conGoogle = Route.useLoaderData() ?? false;
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPending && user) void navigate({ to: "/expedientes" });
  }, [isPending, user, navigate]);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "crear") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || email,
          callbackURL: "/expedientes",
        });
        if (res.error) throw new Error(res.error.message || "No se pudo crear el acceso.");
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/expedientes",
        });
        if (res.error) throw new Error(res.error.message || "Correo o clave incorrectos.");
      }
      void navigate({ to: "/expedientes" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell internal footer={false}>
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <p className="eyebrow">Acceso interno</p>
        <h1 className="mt-3 text-3xl font-normal">Isaac y Claudia</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Expedientes de admisión. No es la ficha pública. {SITE.facilitators}.
        </p>

        {!authEnabled ? (
          <p className="mt-8 text-sm text-muted">El acceso interno no está activo en este entorno.</p>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            {mode === "crear" ? (
              <label className="block text-sm">
                Nombre
                <input
                  className="mt-2 w-full rounded-xl border border-line bg-paper px-3.5 py-3 outline-none focus:border-clay focus:ring-2 focus:ring-clay/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </label>
            ) : null}
            <label className="block text-sm">
              Correo
              <input
                type="email"
                className="mt-2 w-full rounded-xl border border-line bg-paper px-3.5 py-3 outline-none focus:border-clay focus:ring-2 focus:ring-clay/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm">
              Clave
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-line bg-paper px-3.5 py-3 outline-none focus:border-clay focus:ring-2 focus:ring-clay/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "crear" ? "new-password" : "current-password"}
                required
                minLength={8}
              />
            </label>
            {error ? (
              <p className="rounded-2xl border border-hold/30 bg-hold/5 px-4 py-3 text-sm text-hold" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm text-cream hover:bg-ink-soft disabled:opacity-60"
            >
              {busy ? "Entrando…" : mode === "crear" ? "Crear acceso" : "Entrar"}
            </button>
            <button
              type="button"
              className="w-full text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              onClick={() => {
                setMode((m) => (m === "entrar" ? "crear" : "entrar"));
                setError(null);
              }}
            >
              {mode === "entrar" ? "Primera vez: crear acceso" : "Ya tengo acceso"}
            </button>
            {conGoogle ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    authClient.signIn.social({ provider: "google", callbackURL: "/expedientes" })
                  }
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-line text-sm hover:border-ink/40"
                >
                  Continuar con Google
                </button>
              </div>
            ) : null}
          </form>
        )}
      </main>
    </PageShell>
  );
}
