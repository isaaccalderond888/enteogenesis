import { SITE } from "@/lib/site";

/**
 * A quién avisar, con los facilitadores primero y la línea pública debajo.
 *
 * Existe como un solo componente para que el orden no se decida página por
 * página. El orden es la parte clínica: un bajón después de una sesión no es
 * una crisis de riesgo vital, y mandar a alguien a una línea de emergencia por
 * eso patologiza algo esperable y le enseña a no avisar. Quien sí está en
 * riesgo necesita ver la urgencia aparte, no mezclada en la misma frase.
 */
export function AQuienAvisar({ nota }: { nota?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <p className="text-xs font-bold tracking-[0.18em] text-clay">A QUIÉN AVISAR</p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
        {nota ??
          "Escríbeles o llámales. No hace falta que sea grave: avisar a tiempo es parte del acompañamiento, no una molestia."}
      </p>
      <ul className="mt-4 space-y-2">
        {SITE.contacts.map((c) => (
          <li key={c.tel}>
            <a
              href={`tel:${c.tel}`}
              className="flex flex-wrap items-baseline gap-x-3 text-[15px] text-ink hover:text-clay"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-ink-soft tabular-nums">{c.display}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line pt-4 text-[15px] leading-relaxed text-ink-soft">
        Aparte de eso, si hay <span className="text-ink">peligro inmediato</span> —riesgo de
        hacerte daño, una emergencia médica o de salud mental— busca atención de urgencia además
        de avisarles. En México,{" "}
        <a href={`tel:${SITE.crisis.tel}`} className="text-ink hover:text-clay">
          {SITE.crisis.name}: <span className="tabular-nums">{SITE.crisis.phone}</span>
        </a>
        .
      </p>
    </div>
  );
}
