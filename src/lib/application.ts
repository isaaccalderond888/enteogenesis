import { clasesEncontradas, farmacosEnTexto } from "./clinica/farmacos.ts";

export type YesNo = "" | "si" | "no";

export type BodyItem = {
  respuesta: YesNo;
  detalle: string;
};

export type Application = {
  marcoAceptado: boolean;
  nombreCompleto: string;
  fechaNacimiento: string;
  fechasRetiro: string;
  fechasRetiroOtra: string;
  /**
   * Separados a propósito: el sexo asignado al nacer es dato de tamizaje médico
   * (interacciones, embarazo) y la identidad de género es cómo se nombra y se
   * sostiene a la persona en el contenedor. Mezclarlos pierde una de las dos.
   *
   * `sexo` se conserva sólo para leer las fichas cerradas antes de este cambio.
   */
  sexoAlNacer: string;
  identidadGenero: string;
  identidadGeneroOtra: string;
  /** @deprecated Fichas anteriores a la separación de sexo e identidad. */
  sexo?: string;
  ocupacion: string;
  telefono: string;
  email: string;
  direccion: string;
  emergencia: string;
  comoSeEntero: string;
  participadoPsicodelicos: YesNo;
  participadoContexto: string;
  sustanciasHistorial: string;
  consumeRecreativo: string;
  practicaEspiritual: string;
  maestroGuia: string;
  terapia: string;
  malaExperiencia: string;
  emergenciaEspiritual: string;
  nacimiento: string;
  enfermedadMental: string;
  antecedentesFamiliares: string;
  cardiaco: BodyItem;
  hipertension: BodyItem;
  alergia: BodyItem;
  autoinmune: BodyItem;
  cirugia: BodyItem;
  terminal: BodyItem;
  accidente: BodyItem;
  desmayo: BodyItem;
  tiroides: BodyItem;
  glaucoma: BodyItem;
  embarazo: BodyItem;
  hormonal: BodyItem;
  otroPadecimiento: string;
  cambioDramatico: string;
  medicamentos: string;
  quienEres: string;
  sombra: string;
  miedos: string;
  razones: string;
  declara: YesNo;
  firma: string;
  submittedAt: string;
};

export const emptyBody = (): BodyItem => ({ respuesta: "", detalle: "" });

export const emptyApplication = (): Application => ({
  marcoAceptado: false,
  nombreCompleto: "",
  fechaNacimiento: "",
  fechasRetiro: "enteogenesis-sep-2026",
  fechasRetiroOtra: "",
  sexoAlNacer: "",
  identidadGenero: "",
  identidadGeneroOtra: "",
  ocupacion: "",
  telefono: "",
  email: "",
  direccion: "",
  emergencia: "",
  comoSeEntero: "",
  participadoPsicodelicos: "",
  participadoContexto: "",
  sustanciasHistorial: "",
  consumeRecreativo: "",
  practicaEspiritual: "",
  maestroGuia: "",
  terapia: "",
  malaExperiencia: "",
  emergenciaEspiritual: "",
  nacimiento: "",
  enfermedadMental: "",
  antecedentesFamiliares: "",
  cardiaco: emptyBody(),
  hipertension: emptyBody(),
  alergia: emptyBody(),
  autoinmune: emptyBody(),
  cirugia: emptyBody(),
  terminal: emptyBody(),
  accidente: emptyBody(),
  desmayo: emptyBody(),
  tiroides: emptyBody(),
  glaucoma: emptyBody(),
  embarazo: emptyBody(),
  hormonal: emptyBody(),
  otroPadecimiento: "",
  cambioDramatico: "",
  medicamentos: "",
  quienEres: "",
  sombra: "",
  miedos: "",
  razones: "",
  declara: "",
  firma: "",
  submittedAt: "",
});

export const RETREATS = [
  {
    id: "enteogenesis-sep-2026",
    label: "25 – 27 septiembre 2026 · Enteogénesis",
  },
  {
    id: "integracion-viva-oct-2026",
    label: "15 – 18 octubre 2026 · Integración Viva",
  },
  { id: "otra", label: "Otra fecha / próximo proceso" },
] as const;

export const STEPS = [
  { id: "marco", title: "El marco", caption: "Contenedor y confidencialidad" },
  { id: "identidad", title: "Quién eres", caption: "Datos de contacto" },
  { id: "camino", title: "Tu camino", caption: "Sustancias y práctica" },
  { id: "historia", title: "Historia interior", caption: "Proceso y origen" },
  { id: "mente", title: "Salud mental", caption: "Antecedentes" },
  { id: "cuerpo", title: "El cuerpo", caption: "Salud física" },
  { id: "intencion", title: "Intención", caption: "Por qué vienes" },
  { id: "declaracion", title: "Declaración", caption: "Cierre y firma" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const BODY_FIELDS: {
  key: keyof Pick<
    Application,
    | "cardiaco"
    | "hipertension"
    | "alergia"
    | "autoinmune"
    | "cirugia"
    | "terminal"
    | "accidente"
    | "desmayo"
    | "tiroides"
    | "glaucoma"
    | "embarazo"
    | "hormonal"
  >;
  question: string;
  detail: string;
}[] = [
  {
    key: "cardiaco",
    question: "¿Padeces alguna enfermedad o problema cardiaco?",
    detail: "Describe diagnóstico y tratamiento.",
  },
  {
    key: "hipertension",
    question: "¿Padeces de hipertensión?",
    detail: "Describe cómo la controlas.",
  },
  {
    key: "alergia",
    question: "¿Tienes alguna alergia?",
    detail: "Describe cómo reacciona tu cuerpo, síntomas.",
  },
  {
    key: "autoinmune",
    question: "¿En este momento padeces alguna enfermedad autoinmune?",
    detail: "Describe diagnóstico y tratamiento.",
  },
  {
    key: "cirugia",
    question: "¿Te han operado de algo?",
    detail: "Describe fechas y tipo de cirugía.",
  },
  {
    key: "terminal",
    question: "¿En este momento padeces alguna enfermedad terminal?",
    detail: "Describe diagnóstico y tratamiento.",
  },
  {
    key: "accidente",
    question: "¿Has tenido algún accidente grave o fracturas de las que debamos ser conscientes?",
    detail: "Describe gravedad y fechas.",
  },
  {
    key: "desmayo",
    question: "¿Te desmayas con facilidad?",
    detail: "Describe la frecuencia y la experiencia interna y externa de tu cuerpo cuando sucede.",
  },
  {
    key: "tiroides",
    question: "¿Sufres de hipotiroidismo o hipertiroidismo?",
    detail: "En caso afirmativo, explica.",
  },
  {
    key: "glaucoma",
    question: "¿Padeces de glaucoma?",
    detail: "Describe diagnóstico y tratamiento.",
  },
  {
    key: "embarazo",
    question: "¿Estás embarazada o planeando embarazarte?",
    detail: "Comparte lo que consideres relevante para el equipo.",
  },
  {
    key: "hormonal",
    question: "¿Tomas algún tipo de tratamiento hormonal?",
    detail: "Describe el tratamiento.",
  },
];

const filled = (v: string) => v.trim().length > 0;

export function validateStep(step: number, data: Application): string | null {
  switch (step) {
    case 0:
      return data.marcoAceptado
        ? null
        : "Para continuar, confirma que leíste el marco y responderás con honestidad.";
    case 1: {
      if (!filled(data.nombreCompleto)) return "Escribe tu nombre completo.";
      if (!filled(data.fechaNacimiento)) return "Indica tu fecha de nacimiento.";
      {
        const edad = ageFromIso(data.fechaNacimiento);
        if (edad === null)
          return "Revisa tu fecha de nacimiento: el año no parece correcto.";
        if (edad < EDAD_MINIMA)
          return `Este trabajo es para mayores de ${EDAD_MINIMA} años.`;
        if (edad > EDAD_MAXIMA)
          return "Revisa tu fecha de nacimiento: el año no parece correcto.";
      }
      if (!data.sexoAlNacer) return "Selecciona el sexo asignado al nacer.";
      if (!data.identidadGenero) return "Selecciona tu identidad de género.";
      if (data.identidadGenero === "Otra" && !data.identidadGeneroOtra.trim())
        return "Escribe cómo nombras tu identidad de género.";
      if (!filled(data.ocupacion)) return "Indica tu ocupación.";
      if (!filled(data.telefono)) return "Indica un teléfono de contacto.";
      if (!filled(data.email) || !data.email.includes("@"))
        return "Escribe un correo válido.";
      if (!filled(data.direccion)) return "Indica tu dirección.";
      if (!filled(data.emergencia))
        return "Necesitamos un contacto de emergencia (nombre y teléfono).";
      if (data.fechasRetiro === "otra" && !filled(data.fechasRetiroOtra))
        return "Escribe las fechas del retiro en el que quieres participar.";
      return null;
    }
    case 2:
      if (!data.participadoPsicodelicos)
        return "Indica si has participado en ceremonias o procesos con enteógenos.";
      if (!filled(data.sustanciasHistorial))
        return "Describe las plantas o sustancias que has consumido y con qué frecuencia.";
      return null;
    case 3:
      if (!filled(data.terapia))
        return "Cuéntanos si has realizado terapia psicológica (aunque la respuesta sea no).";
      if (!filled(data.nacimiento))
        return "Comparte lo que sepas de tu embarazo y nacimiento — aunque sea poco.";
      return null;
    case 4:
      if (!filled(data.enfermedadMental))
        return "Responde sobre antecedentes de enfermedad mental, aunque no hayas tenido.";
      return null;
    case 5: {
      for (const field of BODY_FIELDS) {
        const item = data[field.key];
        if (!item.respuesta) return `Responde: ${field.question}`;
        if (item.respuesta === "si" && !filled(item.detalle))
          return `Agrega detalle en: ${field.question}`;
      }
      if (!filled(data.medicamentos))
        return "Indica medicamentos o tratamientos actuales, o escribe «ninguno».";
      return null;
    }
    case 6:
      if (!filled(data.quienEres)) return "Describe quién eres.";
      if (!filled(data.razones))
        return "Describe las razones por las que deseas participar.";
      return null;
    case 7:
      if (data.declara !== "si")
        return "La declaración debe aceptarse con SI para cerrar la ficha.";
      if (!filled(data.firma))
        return "Firma con lugar, nombre completo y fecha.";
      return null;
    default:
      return null;
  }
}

/** Sexo al nacer, leyendo el campo viejo cuando la ficha es anterior al cambio. */
export function sexoTexto(data: Application): string {
  return data.sexoAlNacer || data.sexo || "";
}

/** Identidad de género, con el texto libre cuando la persona eligió "Otra". */
export function generoTexto(data: Application): string {
  if (data.identidadGenero === "Otra") return data.identidadGeneroOtra.trim() || "Otra";
  return data.identidadGenero || data.sexo || "";
}

export function validateApplication(data: Application): string | null {
  for (let i = 0; i < STEPS.length; i++) {
    const message = validateStep(i, data);
    if (message) return message;
  }
  return null;
}

export type SafetyFlag = {
  level: "hold" | "review";
  label: string;
  detail: string;
};

function isNegation(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/^[¿¡"']+/, "");
  return /^(no\b|ningun[oa]?s?\b|nada\b|sin antecedentes|n\/a\b|no aplica)/.test(t);
}

export function safetyFlags(data: Application): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const add = (level: SafetyFlag["level"], label: string, detail: string) => {
    const d = (detail || "").trim();
    if (d) flags.push({ level, label, detail: d });
    else if (level === "hold") flags.push({ level, label, detail: "Marcado en la ficha." });
  };

  if (data.embarazo.respuesta === "si")
    add("hold", "Embarazo", data.embarazo.detalle || "Reportó embarazo o plan de embarazo.");
  if (data.cardiaco.respuesta === "si")
    add("hold", "Cardiaco", data.cardiaco.detalle);
  if (data.hipertension.respuesta === "si")
    add("hold", "Hipertensión", data.hipertension.detalle);
  if (data.terminal.respuesta === "si")
    add("hold", "Enfermedad terminal", data.terminal.detalle);
  if (data.glaucoma.respuesta === "si")
    add("review", "Glaucoma", data.glaucoma.detalle);
  if (data.desmayo.respuesta === "si")
    add("review", "Desmayos", data.desmayo.detalle);
  if (data.autoinmune.respuesta === "si")
    add("review", "Autoinmune", data.autoinmune.detalle);
  if (data.cirugia.respuesta === "si")
    add("review", "Cirugías", data.cirugia.detalle);
  if (data.accidente.respuesta === "si")
    add("review", "Accidentes / fracturas", data.accidente.detalle);
  if (data.tiroides.respuesta === "si")
    add("review", "Tiroides", data.tiroides.detalle);
  if (data.alergia.respuesta === "si")
    add("review", "Alergias", data.alergia.detalle);
  if (data.hormonal.respuesta === "si")
    add("review", "Tratamiento hormonal", data.hormonal.detalle);

  if (data.enfermedadMental.trim() && !isNegation(data.enfermedadMental)) {
    add("hold", "Salud mental", data.enfermedadMental);
  }

  // Los fármacos no viven sólo en el campo de medicamentos. En las fichas reales
  // aparecen al describir la salud mental, entre las sustancias que se consumen,
  // o como "otro padecimiento": mirar un solo campo dejaba pasar la mitad.
  const hallazgos = [
    data.medicamentos,
    data.enfermedadMental,
    data.sustanciasHistorial,
    data.otroPadecimiento,
  ].flatMap((texto) => farmacosEnTexto(texto).map((h) => ({ ...h, texto })));

  if (hallazgos.length) {
    // La clase va en la etiqueta porque es justo lo que quien firmó no sabía:
    // duloxetina es IRSN y pregabalina anticonvulsivo, y ninguna se llama "ISRS".
    const clases = clasesEncontradas(hallazgos).join(", ");
    const nombres = [...new Set(hallazgos.map((h) => h.generico))].join(", ");
    add("hold", `Medicación contraindicada · ${clases}`, `${nombres} — ${hallazgos[0].texto}`);
  } else if (
    /\bisrs\b|\bssri\b|\bimao\b|\bmaoi\b|antidepres|anticonvuls/.test(
      data.medicamentos.toLowerCase(),
    )
  ) {
    // Nombró la categoría sin nombrar el fármaco: cuenta igual.
    add("hold", "Medicación contraindicada", data.medicamentos);
  } else if (data.medicamentos.trim() && !isNegation(data.medicamentos)) {
    add("review", "Medicación actual", data.medicamentos);
  }

  if (data.declara === "no")
    add("hold", "Declaración no aceptada", "La persona marcó No en la declaración de responsabilidad.");

  return flags;
}

export function retreatLabel(data: Application): string {
  if (data.fechasRetiro === "otra") return data.fechasRetiroOtra || "Otra fecha";
  return RETREATS.find((r) => r.id === data.fechasRetiro)?.label ?? data.fechasRetiro;
}

/**
 * Los años que puede tener quien aplica.
 *
 * Existen por un caso real: el campo de fecha deja escribir encima y los dígitos
 * se concatenan —al corregir 1085 por 1985 quedaba 31985— y nada lo detenía
 * después, así que una fecha imposible entraba al expediente en silencio.
 */
export const EDAD_MINIMA = 18;
export const EDAD_MAXIMA = 100;

/** El rango de fechas que el navegador debe aceptar, en formato ISO. */
export function limitesFechaNacimiento(hoy: Date = new Date()): { min: string; max: string } {
  const en = (aniosAtras: number) => {
    const d = new Date(hoy);
    d.setFullYear(d.getFullYear() - aniosAtras);
    return d.toISOString().slice(0, 10);
  };
  return { min: en(EDAD_MAXIMA), max: en(EDAD_MINIMA) };
}

export function ageFromIso(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function lectura(data: Application, flags: SafetyFlag[]): string {
  const holds = flags.filter((f) => f.level === "hold");
  const reviews = flags.filter((f) => f.level === "review");
  const bits: string[] = [];
  if (holds.length) bits.push(`Pausas: ${holds.map((h) => h.label).join(", ")}.`);
  else bits.push("Sin pausas automáticas.");
  if (reviews.length) bits.push(`Revisar: ${reviews.map((h) => h.label).join(", ")}.`);
  const razones = data.razones.trim();
  if (razones) bits.push(`Intención: ${razones.slice(0, 280)}${razones.length > 280 ? "…" : ""}`);
  return bits.join(" ");
}

export const DRAFT_KEY = "terrasana-enteogenesis-draft";
export const FICHA_KEY = "terrasana-enteogenesis-ficha";
export const FICHA_REMOTE_KEY = "terrasana-enteogenesis-remote";

/** In-memory fallback if storage is blocked (private mode, quota). */
let lastFicha: Application | null = null;

export function rememberFicha(data: Application) {
  lastFicha = data;
}

export function recallFicha(): Application | null {
  return lastFicha;
}

export function formatFicha(data: Application): string {
  const yn = (item: BodyItem, q: string) =>
    `${q}\n  ${item.respuesta === "si" ? "Sí" : item.respuesta === "no" ? "No" : "—"}${
      item.detalle ? `\n  ${item.detalle}` : ""
    }`;

  // La lectura automática NO va en esta copia: es material para Isaac y Claudia,
  // y quien aplica se lleva sus respuestas, no la interpretación que hizo el
  // sistema sobre ellas. En el expediente interno sí aparece completa.
  return `FICHA DE ADMISIÓN · ENTEOGÉNESIS · TERRASANA
${data.submittedAt ? `Enviada: ${data.submittedAt}` : "Borrador"}
Retiro: ${retreatLabel(data)}

=== IDENTIDAD ===
Nombre: ${data.nombreCompleto}
Nacimiento: ${data.fechaNacimiento}
Sexo asignado al nacer: ${sexoTexto(data)}\nIdentidad de género: ${generoTexto(data)}
Ocupación: ${data.ocupacion}
Teléfono: ${data.telefono}
Email: ${data.email}
Dirección: ${data.direccion}
Emergencia: ${data.emergencia}
Cómo se enteró: ${data.comoSeEntero}

=== CAMINO ===
Participó en enteógenos: ${data.participadoPsicodelicos}
Contexto: ${data.participadoContexto}
Historial de sustancias: ${data.sustanciasHistorial}
Consumo recreativo actual: ${data.consumeRecreativo}
Práctica espiritual: ${data.practicaEspiritual}
Maestro o guía: ${data.maestroGuia}

=== HISTORIA INTERIOR ===
Terapia: ${data.terapia}
Mala experiencia: ${data.malaExperiencia}
Emergencia espiritual: ${data.emergenciaEspiritual}
Embarazo y nacimiento: ${data.nacimiento}

=== SALUD MENTAL ===
Enfermedad mental / tratamiento: ${data.enfermedadMental}
Antecedentes familiares: ${data.antecedentesFamiliares}

=== CUERPO ===
${BODY_FIELDS.map((f) => yn(data[f.key], f.question)).join("\n\n")}

Otro padecimiento: ${data.otroPadecimiento}
Cambio o pérdida: ${data.cambioDramatico}
Medicamentos: ${data.medicamentos}

=== INTENCIÓN ===
Quién eres: ${data.quienEres}
Sombra: ${data.sombra}
Miedos: ${data.miedos}
Razones: ${data.razones}

=== DECLARACIÓN ===
Acepta: ${data.declara}
Firma: ${data.firma}

`;
}
