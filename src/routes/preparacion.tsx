import { createFileRoute, Link } from "@tanstack/react-router";
import { AQuienAvisar } from "@/components/a-quien-avisar";
import { PageShell } from "@/components/site-chrome";

export const Route = createFileRoute("/preparacion")({
  head: () => ({
    meta: [
      { title: "Preparación · Enteogénesis" },
      // Se comparte por enlace con quien ya aplicó, como /integracion. Desde que
      // la página trae los teléfonos de los tres facilitadores, no tiene por qué
      // aparecer en buscadores ni quedar al alcance de los rastreadores.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PreparacionPage,
});

const SECTIONS = [
  {
    n: "01",
    title: "¿Qué es este trabajo?",
    body: [
      "Un proceso terapéutico con diferentes métodos, incluyendo el uso de Medicina Sagrada, diseñado para explorar estados de profunda introspección dentro de un contenedor seguro, acompañado de integración psicoterapéutica individual y grupal.",
      "Más que un retiro, es una experiencia de introspección, activación y reconexión con los recursos internos y el potencial sanador de cada persona.",
      "No es un sustituto de la psicoterapia ni un evento recreativo. Pueden aparecer liberaciones emocionales y psíquicas intensas. El protagonista de la evolución eres tú; los facilitadores sostienen el espacio.",
    ],
  },
  {
    n: "02",
    title: "Quién no debería participar",
    body: [
      "Estas técnicas no son apropiadas para personas: en embarazo; problemas cardiovasculares; accidentes cerebrovasculares; hipertensión severa; enfermedades mentales; fracturas o cirugías recientes; enfermedades infecciosas agudas; epilepsia.",
      "Tampoco mientras se usan ISRS, IMAO, anticonvulsivos u otros medicamentos neuropsiquiátricos, ni con historial de brotes psicóticos o internación psiquiátrica en el contexto de estados no ordinarios de consciencia.",
      "Si dudas, consulta a tu médico, tu terapeuta o a los facilitadores antes de aplicar. Ocultar información pone en riesgo tu proceso y el del grupo.",
    ],
  },
  {
    n: "03",
    title: "Las semanas previas",
    body: [
      "Reduce o evita alcohol, cannabis y otras sustancias recreativas. Cuida el sueño. Mueve el cuerpo con suavidad. Baja el ruido: redes, noticias, contenidos perturbadores.",
      "Si tomas medicación, no la suspendas por tu cuenta. Cualquier ajuste se conversa con quien te prescribe y con los facilitadores.",
      "Llega con una intención clara y suelta. Preguntas útiles: ¿qué parte de mi historia me cuesta mirar? ¿qué patrón se repite? ¿qué emoción evito?",
    ],
  },
  {
    n: "04",
    title: "Preparando el camino: los días previos",
    intro:
      "El proceso de sanación comienza desde ahora. La medicina actúa mejor en un cuerpo limpio y una mente despejada.",
    groups: [
      {
        title: "Cuerpo y nutrición",
        items: [
          "Alimentación: prioriza vegetales, grasas saludables y proteínas ligeras (pescado o pollo). Evita carnes rojas, alcohol, café y marihuana al menos 5 días antes.",
          "Medicamentos o suplementos: si los tomas, menciónalos en el formulario médico — tiempo de consumo, frecuencia y dosis.",
          "Abstinencia sexual: se recomienda no tener relaciones sexuales 3 días antes y 3 días después del encuentro.",
          "Tu hogar como contenedor: antes de partir, deja tu espacio limpio y organizado. Al regresar, un entorno ordenado facilita una integración armoniosa y paz mental.",
        ],
      },
      {
        title: "Preparación emocional y mental",
        items: [
          "Desconexión: reduce el uso de redes sociales y busca momentos de silencio o meditación.",
          "Reflexión: ¿qué aspectos de tu sombra o bloqueos sientes listos para ser mirados con compasión? Escríbelo.",
          "Prepárate para abrir tu corazón y tu mente a un encuentro sagrado contigo mism@, en un entorno protegido y amoroso.",
        ],
      },
    ],
    body: [
      "Informa cualquier cambio de salud, duelo, aniversario difícil o medicación entre la ficha y el retiro.",
    ],
  },
  {
    n: "05",
    title: "Durante y después",
    body: [
      "Los facilitadores acompañan todo el proceso. Si algo se vuelve insostenible, dilo. La integración —individual y grupal— es parte del retiro, no un extra.",
      "Es normal tener mayor sensibilidad emocional durante los tres a cinco días siguientes, y también un bajón. No es una señal de que algo salió mal. Descansa, escribe, muévete con suavidad y evita decisiones grandes.",
      "Para eso —el bajón, la sensibilidad, las dudas que aparecen después— escríbeles a los facilitadores. Es parte del acompañamiento, no una molestia, y no hace falta que sea grave para avisar.",
    ],
    avisos: true,
  },
];

function PreparacionPage() {
  return (
    <PageShell>
      <div className="relative overflow-hidden">
        <img
          src="/images/enteogenesis-3.jpg"
          alt="Caminata ceremonial en la naturaleza"
          className="photo h-64 w-full object-cover sm:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/20 to-transparent" />
      </div>
      <article className="relative mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <p className="eyebrow">Guía de preparación</p>
        <h1 className="mt-3 text-3xl font-normal sm:text-4xl">Antes del retiro de Enteogénesis</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Material de apoyo para la fase de preparación. Léelo con calma y lleva tus dudas a la
          entrevista de claridad. No sustituye consejo médico individualizado.
        </p>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((s) => (
            <section key={s.n}>
              <p className="text-xs tracking-[0.22em] text-clay">{s.n}</p>
              <h2 className="mt-2 text-2xl font-normal">{s.title}</h2>
              {"intro" in s && s.intro ? (
                <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{s.intro}</p>
              ) : null}
              {"groups" in s && s.groups
                ? s.groups.map((g) => (
                    <div key={g.title} className="mt-6">
                      <h3 className="text-xs font-bold tracking-[0.18em] text-clay uppercase">
                        {g.title}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {g.items.map((item) => (
                          <li
                            key={item}
                            className="border-l-2 border-sand pl-4 text-[15px] leading-relaxed text-ink-soft"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                : null}
              {s.body.map((p) => (
                <p key={p} className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
              {"avisos" in s && s.avisos ? (
                <div className="mt-6">
                  <AQuienAvisar />
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-ink px-6 py-10 text-cream">
          <h2 className="text-2xl font-normal">Siguiente paso</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/80">
            Completa la ficha de admisión. Al terminar, descárgala o envíasela a los facilitadores.
            Ellos la leen y agendan la entrevista de claridad.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-cream px-6 text-sm text-ink"
          >
            Aplicar al proceso
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
