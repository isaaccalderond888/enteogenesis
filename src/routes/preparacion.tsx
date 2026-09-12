import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site-chrome";

export const Route = createFileRoute("/preparacion")({ component: PreparacionPage });

const SECTIONS = [
  {
    n: "01",
    title: "Qué es este trabajo",
    body: [
      "Enteogénesis es un proceso terapéutico con medicina, dentro de un contenedor de psicología transpersonal: preparación, una sesión y un tejido de integración individual y grupal. Lo acompañan Claudia Saviñón e Isaac Calderón — quince años de sociedad, no un equipo improvisado.",
      "No es un sustituto de la psicoterapia ni un evento recreativo. Pueden aparecer liberaciones emocionales y psíquicas intensas. El protagonista de la evolución eres tú; Isaac y Claudia sostienen el espacio.",
    ],
  },
  {
    n: "02",
    title: "Quién no debería participar",
    body: [
      "Estas técnicas no son apropiadas para: embarazo; problemas cardiovasculares; accidentes cerebrovasculares; hipertensión severa; enfermedades mentales; fracturas o cirugías recientes; enfermedades infecciosas agudas; epilepsia.",
      "Tampoco mientras se usan ISRS, IMAO, anticonvulsivos u otros medicamentos neuropsiquiátricos, ni con historial de brotes psicóticos o internación psiquiátrica en el contexto de estados no ordinarios de consciencia.",
      "Si dudas, consulta a tu médico, tu terapeuta o a Isaac y Claudia antes de aplicar. Ocultar información pone en riesgo tu proceso y el del grupo.",
    ],
  },
  {
    n: "03",
    title: "Las semanas previas",
    body: [
      "Reduce o evita alcohol, cannabis y otras sustancias recreativas. Cuida el sueño. Mueve el cuerpo con suavidad. Baja el ruido: redes, noticias, contenidos perturbadores.",
      "Si tomas medicación, no la suspendas por tu cuenta. Cualquier ajuste se conversa con quien te prescribe y con Isaac y Claudia.",
      "Llega con una intención clara y suelta. Preguntas útiles: ¿qué parte de mi historia me cuesta mirar? ¿qué patrón se repite? ¿qué emoción evito?",
    ],
  },
  {
    n: "04",
    title: "Los días inmediatamente anteriores",
    body: [
      "Alimentación ligera, agua, menos cafeína. Cena temprana la noche previa. Ropa cómoda, en capas. Confirma tu transporte: no conduzcas de regreso si el proceso te deja sensible.",
      "Avisa a Isaac y Claudia de cualquier cambio de salud, duelo, aniversario difícil o medicación entre la ficha y el retiro.",
    ],
  },
  {
    n: "05",
    title: "Durante y después",
    body: [
      "Isaac y Claudia acompañan todo el proceso. Si algo se vuelve insostenible, dilo. La integración —individual y grupal— es parte del retiro, no un extra.",
      "Los días siguientes pueden traer sensibilidad o un bajón. Descansa, escribe, evita decisiones grandes. Si aparecen pensamientos de hacerte daño, desconexión persistente, insomnio severo o una activación inusual, habla con Isaac y Claudia y, si estás en crisis, llama a la Línea de la Vida: 800 911 2000.",
    ],
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
        <h1 className="mt-3 text-3xl font-normal sm:text-4xl">Antes de Enteogénesis</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Material de apoyo para la fase de preparación. Léelo con calma y lleva tus dudas a la
          entrevista de claridad. No sustituye consejo médico individualizado.
        </p>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((s) => (
            <section key={s.n}>
              <p className="text-xs tracking-[0.22em] text-clay">{s.n}</p>
              <h2 className="mt-2 text-2xl font-normal">{s.title}</h2>
              {s.body.map((p) => (
                <p key={p} className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-ink px-6 py-10 text-cream">
          <h2 className="text-2xl font-normal">Siguiente paso</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/80">
            Completa la ficha de admisión. Al terminar, descárgala o envíasela a Isaac y Claudia.
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
