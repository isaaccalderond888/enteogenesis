import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { PageShell } from "@/components/site-chrome";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/integracion")({
  head: () => ({
    meta: [
      { title: "Integración · Enteogénesis" },
      // Se comparte con quien ya pasó por la sesión, no se descubre desde fuera.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IntegracionPage,
});

type Bloque = { n: string; title: string; body?: string[]; lista?: string[]; contra?: string[] };

/**
 * Contenido tomado del manual de Isaac "Preparación e integración psicodélica"
 * (Ciencia Psicodélica · Psicodélicos sin mitos, v1.0), que sintetiza las clases
 * 3 y 4 del curso, el trabajo de Marc Aixalà y el Modelo Sintetizado de
 * Integración de Bathje, Majeski y Kudowor. Esta página cubre el DESPUÉS;
 * /preparacion cubre el antes.
 */
const BLOQUES: Bloque[] = [
  {
    n: "01",
    title: "Tres ideas para orientarte",
    lista: [
      "La sustancia no es la terapia. Una experiencia puede abrir posibilidades, pero el cambio depende del contexto, las relaciones, el seguimiento y lo que se practica después.",
      "Difícil no significa necesariamente dañino; pero tampoco todo sufrimiento es terapéutico. La seguridad se evalúa por el funcionamiento, la capacidad de pedir ayuda y la presencia de riesgo real.",
      "Integrar no es encontrar una explicación definitiva. Es relacionarte con lo vivido con curiosidad, cuerpo, tiempo, discernimiento y acciones sostenibles.",
    ],
  },
  {
    n: "02",
    title: "Las primeras 24 a 48 horas",
    body: [
      "Después de una experiencia intensa, prioriza aterrizaje y funcionamiento antes que interpretación.",
    ],
    lista: [
      "Dormir y recuperar rutinas básicas de alimentación e hidratación.",
      "Reducir compromisos y estímulos innecesarios.",
      "Registrar recuerdos sin exigir coherencia.",
      "Hablar con una persona capaz de escuchar sin dramatizar ni idealizar.",
      "Posponer decisiones irreversibles hasta recuperar estabilidad y perspectiva.",
    ],
    contra: [
      "Convertir inmediatamente cada imagen en una certeza literal.",
      "Publicar detalles íntimos por impulso.",
      "Tomar nuevas sustancias para “completar” o corregir lo vivido.",
      "Aislarte si notas confusión, miedo o deterioro de tu funcionamiento.",
      "Permitir que otra persona defina por ti el significado de la experiencia.",
    ],
  },
  {
    n: "03",
    title: "Qué significa integrar",
    body: [
      "Integrar es pasar del insight al hábito, del símbolo a la relación y de la experiencia extraordinaria a una vida cotidiana más habitable. No existe una única técnica ni un plazo universal.",
    ],
    lista: [
      "Dar tiempo a que el significado cambie.",
      "Contrastar insights con la realidad y con personas confiables.",
      "Cuidar cuerpo, relaciones, descanso y límites.",
      "Traducir una comprensión en una acción pequeña y repetible.",
      "Buscar apoyo cuando el material excede tus recursos actuales.",
    ],
    contra: [
      "Obedecer toda revelación como mandato.",
      "Demostrar que la experiencia fue profunda.",
      "Repetir experiencias para evitar el trabajo cotidiano.",
      "Adoptar la cosmovisión del facilitador.",
      "Llamar “sanación” a un deterioro persistente del funcionamiento.",
    ],
  },
];

/** Etiqueta partida en lineas cortas para que quepa dentro de cada gajo. */
const HEX = [
  ["Mente"],
  ["Cuerpo"],
  ["Espíritu", "y sentido"],
  ["Relaciones"],
  ["Vida", "cotidiana"],
  ["Naturaleza", "y contexto"],
];

const TERRITORIOS = [
  { t: "Mente", q: "¿Qué creencias se flexibilizaron? ¿Qué interpretación necesita permanecer provisional? ¿Qué hechos puedo verificar?" },
  { t: "Cuerpo", q: "¿Cómo están mi sueño, apetito, energía, tensión y sensación de seguridad? ¿Qué práctica corporal me ayuda a volver al presente?" },
  { t: "Espíritu y sentido", q: "¿Cambió mi relación con el propósito, la muerte, lo sagrado o la pertenencia? ¿Puedo honrarlo sin usarlo para evitar dolor psicológico o responsabilidades concretas?" },
  { t: "Relaciones", q: "¿Qué conversaciones, reparaciones o límites aparecen? Poner un límite también puede ser integración." },
  { t: "Vida cotidiana", q: "¿Qué cambio pequeño sería observable y sostenible durante las próximas dos semanas? Evita planes grandiosos." },
  { t: "Naturaleza y contexto", q: "¿Cambió mi relación con el mundo natural, mi comunidad o las culturas de las que provienen ciertas prácticas? ¿Cómo puedo responder con reciprocidad?" },
];

const MAPA = [
  "Lo que viví",
  "Lo que siento en el cuerpo al recordarlo",
  "El significado provisional que le doy hoy",
  "Lo que todavía no sé",
  "Una acción pequeña y verificable",
  "La persona o recurso que puede sostenerme",
];

const SANO = [
  "Recuperas o mejoras gradualmente el sueño y las rutinas.",
  "Puedes sostener ambigüedad sin actuar impulsivamente.",
  "Aumenta tu conexión con el cuerpo y con personas confiables.",
  "Los cambios son pequeños, observables y compatibles con tus responsabilidades.",
  "Puedes pedir ayuda y aceptar retroalimentación.",
];

const ALERTA = [
  "El miedo, la confusión, la despersonalización o el insomnio persisten o aumentan.",
  "Hay deterioro en trabajo, estudio, autocuidado o relaciones.",
  "Aparecen pensamientos suicidas, conducta peligrosa, agitación extrema, paranoia o pérdida de contacto con la realidad.",
  "No puedes alimentarte, dormir o mantenerte seguro.",
  "La experiencia activó trauma que te desborda.",
];

const RECURSOS = [
  { n: "ICEERS Support Center", d: "Apoyo e integración de experiencias difíciles. No sustituye diagnóstico ni tratamiento.", u: "https://www.iceers.org/en/support-and-integration/" },
  { n: "Fireside Project", d: "Apoyo emocional entre pares. No es un servicio de emergencias.", u: "https://firesideproject.org/" },
  { n: "NCCIH", d: "Información pública de seguridad sobre psilocibina.", u: "https://www.nccih.nih.gov/health/psilocybin-for-mental-health-and-addiction-what-you-need-to-know" },
];

/**
 * Rueda de los seis territorios: un hexagono partido en seis gajos, uno por
 * dominio, pensado para imprimirse y llenarse a mano. Sustituye a los recuadros
 * vacios, que en pantalla parecian campos de formulario y en papel no invitaban
 * a escribir. SVG en linea para que no dependa de una imagen externa y salga
 * nitido a cualquier tamano de impresion.
 */
function RuedaTerritorios() {
  const cx = 300;
  const cy = 272;
  const r = 232;
  const punto = (i: number) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  return (
    <svg
      viewBox="0 0 600 560"
      role="img"
      aria-label="Rueda de los seis territorios de integración"
      className="mt-6 w-full"
    >
      {HEX.map((lineas, i) => {
        const [x1, y1] = punto(i);
        const [x2, y2] = punto((i + 1) % 6);
        // Centroide del gajo, empujado hacia afuera para dejar libre el centro.
        const mx = (cx + x1 + x2) / 3;
        const my = (cy + y1 + y2) / 3;
        const lx = cx + (mx - cx) * 1.32;
        const ly = cy + (my - cy) * 1.32;
        return (
          <g key={lineas.join(" ")}>
            <polygon
              points={`${cx},${cy} ${x1},${y1} ${x2},${y2}`}
              fill={i % 2 === 0 ? "#E2D0B6" : "#F2EEE5"}
              fillOpacity="0.45"
              stroke="#976150"
              strokeWidth="1.5"
            />
            {lineas.map((linea, j) => (
              <text
                key={linea}
                x={lx}
                y={ly + (j - (lineas.length - 1) / 2) * 17}
                textAnchor="middle"
                fontSize="15"
                fill="#3A332E"
                fontWeight="600"
              >
                {linea}
              </text>
            ))}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="52" fill="#FFFFFF" stroke="#976150" strokeWidth="1.5" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fill="#976150" fontWeight="700">
        LO QUE
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="13" fill="#976150" fontWeight="700">
        VIVÍ
      </text>
    </svg>
  );
}

/**
 * Mapa de integración como esquema, no como formulario.
 *
 * Seis celdas en blanco parecen campos de una página web y nadie las llena a
 * mano. Un diagrama cerrado, con su forma y su orden visible, se puede imprimir
 * — o copiar en una libreta con una regla — y se llena porque se entiende de un
 * vistazo. Va en SVG para que salga nítido a cualquier tamaño de impresión.
 */
function EsquemaMapa() {
  const celdas = [
    { n: "01", t: ["Lo que", "viví"] },
    { n: "02", t: ["Lo que siento", "en el cuerpo"] },
    { n: "03", t: ["El significado", "provisional de hoy"] },
    { n: "04", t: ["Lo que", "todavía no sé"] },
    { n: "05", t: ["Una acción pequeña", "y verificable"] },
    { n: "06", t: ["Quién puede", "sostenerme"] },
  ];
  const W = 600;
  const cw = 280;
  const ch = 168;
  const gap = 20;
  return (
    <svg
      viewBox={`0 0 ${W} ${ch * 3 + gap * 2 + 4}`}
      role="img"
      aria-label="Esquema del mapa de integración, seis celdas para completar"
      className="mt-6 w-full"
    >
      {celdas.map((c, i) => {
        const col = i % 2;
        const fila = Math.floor(i / 2);
        const x = col * (cw + gap) + 2;
        const y = fila * (ch + gap) + 2;
        return (
          <g key={c.n}>
            <rect
              x={x}
              y={y}
              width={cw}
              height={ch}
              rx="16"
              fill={fila % 2 === 0 ? "#F2EEE5" : "#E2D0B6"}
              fillOpacity="0.5"
              stroke="#976150"
              strokeWidth="1.5"
            />
            <text x={x + 18} y={y + 28} fontSize="13" fill="#976150" fontWeight="700">
              {c.n}
            </text>
            {c.t.map((linea, j) => (
              <text
                key={linea}
                x={x + 18}
                y={y + 52 + j * 19}
                fontSize="15"
                fill="#3A332E"
                fontWeight="600"
              >
                {linea}
              </text>
            ))}
            {[0, 1, 2].map((n) => (
              <line
                key={n}
                x1={x + 18}
                x2={x + cw - 18}
                y1={y + 104 + n * 20}
                y2={y + 104 + n * 20}
                stroke="#976150"
                strokeOpacity="0.3"
                strokeWidth="1"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function IntegracionPage() {
  return (
    <PageShell>
      <div className="relative overflow-hidden">
        <img
          src="/images/enteogenesis-2.jpg"
          alt="Paisaje sereno al amanecer"
          className="photo h-64 w-full object-cover sm:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/20 to-transparent" />
      </div>

      <article className="relative mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <p className="eyebrow">Guía de integración</p>
        <h1 className="mt-3 text-3xl font-normal sm:text-4xl">Después de Enteogénesis</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          La preparación no busca controlar la experiencia. Busca crear condiciones para que lo que
          ocurra pueda ser sostenido, escuchado e integrado. Esta guía acompaña los días y las
          semanas posteriores. No sustituye atención médica, psicológica o psiquiátrica.
        </p>

        <button
          type="button"
          onClick={() => window.print()}
          className="no-print mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm hover:border-ink/40"
        >
          <Printer className="size-4" />
          Imprimir o guardar como PDF
        </button>

        <div className="mt-12 space-y-12">
          {BLOQUES.map((b) => (
            <section key={b.n}>
              <p className="text-xs tracking-[0.22em] text-clay">{b.n}</p>
              <h2 className="mt-2 text-2xl font-normal">{b.title}</h2>
              {b.body?.map((p) => (
                <p key={p} className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
              {b.lista ? (
                <ul className="mt-4 space-y-2">
                  {b.lista.map((x) => (
                    <li key={x} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {b.contra ? (
                <>
                  <p className="mt-6 text-xs font-bold tracking-[0.18em] text-clay">CONVIENE EVITAR</p>
                  <ul className="mt-3 space-y-2">
                    {b.contra.map((x) => (
                      <li key={x} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          ))}

          <section>
            <p className="text-xs tracking-[0.22em] text-clay">04</p>
            <h2 className="mt-2 text-2xl font-normal">Seis territorios para revisar</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
              Úsalos como preguntas, no como una lista que debas completar.
            </p>
            <RuedaTerritorios />
            <p className="mt-2 text-xs text-muted">
              Imprime esta página y escribe dentro de cada gajo. No hace falta llenarlos todos.
            </p>
            <div className="mt-8 space-y-5">
              {TERRITORIOS.map((x) => (
                <div key={x.t} className="rounded-2xl border border-line bg-sand/30 p-5">
                  <p className="text-sm font-medium text-ink">{x.t}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{x.q}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs tracking-[0.22em] text-clay">05</p>
            <h2 className="mt-2 text-2xl font-normal">Tu mapa de integración</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
              Complétalo varias veces: al día siguiente, una semana después y cuando cambie tu
              comprensión. Imprime esta página si quieres llenarlo a mano.
            </p>
            <EsquemaMapa />
            <p className="mt-2 text-xs text-muted">
              Imprímelo, o cópialo en una libreta: seis recuadros y tres renglones en cada uno.
            </p>
          </section>

          <section>
            <p className="text-xs tracking-[0.22em] text-clay">06</p>
            <h2 className="mt-2 text-2xl font-normal">Señales de cuidado</h2>
            <p className="mt-6 text-xs font-bold tracking-[0.18em] text-teal">
              INTEGRACIÓN SALUDABLE
            </p>
            <ul className="mt-3 space-y-2">
              {SANO.map((x) => (
                <li key={x} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs font-bold tracking-[0.18em] text-clay">
              BUSCA APOYO PROFESIONAL PRONTO SI
            </p>
            <ul className="mt-3 space-y-2">
              {ALERTA.map((x) => (
                <li key={x} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-clay/30 bg-sand/50 p-5">
              <p className="text-[15px] leading-relaxed text-ink">
                Si existe peligro inmediato, riesgo suicida o una emergencia médica o de salud
                mental, contacta los servicios locales de emergencia. En México,{" "}
                <span className="font-medium">
                  {SITE.crisis.name}: {SITE.crisis.phone}
                </span>
                . Los servicios de integración y las líneas de apoyo no sustituyen atención de
                urgencia.
              </p>
            </div>
          </section>

          <section>
            <p className="text-xs tracking-[0.22em] text-clay">07</p>
            <h2 className="mt-2 text-2xl font-normal">Recursos</h2>
            <div className="mt-6 space-y-4">
              {RECURSOS.map((r) => (
                <a
                  key={r.n}
                  href={r.u}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-line p-5 hover:border-ink/30"
                >
                  <p className="text-sm font-medium text-ink underline underline-offset-4">{r.n}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{r.d}</p>
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-14 rounded-3xl bg-ink px-6 py-10 text-cream">
          <h2 className="text-2xl font-normal">La integración es parte del retiro</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/80">
            {SITE.facilitators} acompañan el proceso individual y grupal. Si algo se vuelve
            insostenible, díganlo. Pedir ayuda no interrumpe la integración: es integración.
          </p>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted">
          Material educativo y de reducción de riesgos, adaptado del manual “Preparación e
          integración psicodélica” (Ciencia Psicodélica · Psicodélicos sin mitos). Dialoga con el
          trabajo de Marc Aixalà, el MAPS Psychedelic Integration Workbook y el Modelo Sintetizado
          de Integración de Bathje, Majeski y Kudowor. No constituye recomendación para consumir
          sustancias, instrucciones de administración ni sustituto de atención profesional.
        </p>
      </article>
    </PageShell>
  );
}
