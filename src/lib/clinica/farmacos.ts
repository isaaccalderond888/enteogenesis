/**
 * Los medicamentos que hay que reconocer en una ficha, por genérico y por nombre
 * comercial.
 *
 * La declaración que firma la persona nombra categorías —ISRS, IMAO,
 * anticonvulsivos— y la gente conoce nombres. En las 30 fichas revisadas
 * (`docs/barrido-fichas.md`), seis firmaron esa declaración y nombraron en su
 * propia ficha un fármaco de la lista: una de cada cinco. No es que mientan; es
 * que nadie sabe que su medicamento entra en esa categoría.
 *
 * Esta lista es el mismo criterio que el marco clínico le da al modelo, pero del
 * lado del código, para que las banderas del expediente no dependan de que
 * alguien pague una lectura.
 */

export type ClaseFarmaco =
  | "ISRS"
  | "IRSN u otro antidepresivo"
  | "IMAO"
  | "anticonvulsivo o estabilizador"
  | "antipsicótico"
  | "riesgo serotoninérgico";

/**
 * Cada entrada lleva el genérico y sus nombres comerciales.
 *
 * Los comerciales son los que circulan en México y Latinoamérica, que es de
 * donde llega la gente a estos retiros.
 */
export const FARMACOS: { generico: string; clase: ClaseFarmaco; comerciales: string[] }[] = [
  // --- ISRS: los que la declaración nombra por sus siglas ---
  { generico: "fluoxetina", clase: "ISRS", comerciales: ["prozac", "siquial", "fluoxac"] },
  { generico: "sertralina", clase: "ISRS", comerciales: ["altruline", "zoloft", "aremis"] },
  { generico: "paroxetina", clase: "ISRS", comerciales: ["paxil", "aropax", "seroxat"] },
  { generico: "escitalopram", clase: "ISRS", comerciales: ["lexapro", "cipralex", "meridian"] },
  { generico: "citalopram", clase: "ISRS", comerciales: ["seropram", "celexa"] },
  { generico: "fluvoxamina", clase: "ISRS", comerciales: ["luvox"] },

  // --- No son ISRS, pero pesan igual ---
  {
    generico: "venlafaxina",
    clase: "IRSN u otro antidepresivo",
    comerciales: ["efexor", "odven"],
  },
  {
    generico: "desvenlafaxina",
    clase: "IRSN u otro antidepresivo",
    comerciales: ["pristiq", "ellefore"],
  },
  {
    generico: "duloxetina",
    clase: "IRSN u otro antidepresivo",
    comerciales: ["cymbalta", "duxetin"],
  },
  {
    generico: "bupropión",
    clase: "IRSN u otro antidepresivo",
    comerciales: ["bupropion", "wellbutrin", "zyntabac"],
  },
  {
    generico: "mirtazapina",
    clase: "IRSN u otro antidepresivo",
    comerciales: ["remeron", "comenter"],
  },
  {
    generico: "trazodona",
    clase: "IRSN u otro antidepresivo",
    comerciales: ["sideril", "taxagon"],
  },
  {
    generico: "amitriptilina",
    clase: "IRSN u otro antidepresivo",
    comerciales: ["tryptanol", "anapsique"],
  },
  { generico: "imipramina", clase: "IRSN u otro antidepresivo", comerciales: ["tofranil"] },
  { generico: "clomipramina", clase: "IRSN u otro antidepresivo", comerciales: ["anafranil"] },

  // --- IMAO: poco frecuentes y de los más peligrosos ---
  { generico: "tranilcipromina", clase: "IMAO", comerciales: ["parnate"] },
  { generico: "fenelzina", clase: "IMAO", comerciales: ["nardil"] },
  { generico: "moclobemida", clase: "IMAO", comerciales: ["aurorix"] },
  { generico: "selegilina", clase: "IMAO", comerciales: ["jumex"] },
  { generico: "rasagilina", clase: "IMAO", comerciales: ["azilect"] },
  // Se compra sin receta y la gente la cuenta como suplemento, no como medicina.
  { generico: "hierba de San Juan", clase: "IMAO", comerciales: ["hiperico", "hypericum"] },

  // --- Anticonvulsivos y estabilizadores ---
  {
    generico: "pregabalina",
    clase: "anticonvulsivo o estabilizador",
    comerciales: ["lyrica", "lirica"],
  },
  {
    generico: "gabapentina",
    clase: "anticonvulsivo o estabilizador",
    comerciales: ["neurontin", "gabantin"],
  },
  { generico: "lamotrigina", clase: "anticonvulsivo o estabilizador", comerciales: ["lamictal"] },
  {
    generico: "valproato",
    clase: "anticonvulsivo o estabilizador",
    comerciales: ["valproico", "epival", "depakote"],
  },
  { generico: "carbamazepina", clase: "anticonvulsivo o estabilizador", comerciales: ["tegretol"] },
  {
    generico: "oxcarbazepina",
    clase: "anticonvulsivo o estabilizador",
    comerciales: ["trileptal"],
  },
  { generico: "topiramato", clase: "anticonvulsivo o estabilizador", comerciales: ["topamax"] },
  { generico: "levetiracetam", clase: "anticonvulsivo o estabilizador", comerciales: ["keppra"] },
  { generico: "fenitoína", clase: "anticonvulsivo o estabilizador", comerciales: ["epamin"] },
  { generico: "litio", clase: "anticonvulsivo o estabilizador", comerciales: ["carbolit"] },

  // --- Antipsicóticos: no están en la declaración, pero cambian el cuadro ---
  { generico: "quetiapina", clase: "antipsicótico", comerciales: ["seroquel"] },
  { generico: "olanzapina", clase: "antipsicótico", comerciales: ["zyprexa"] },
  { generico: "risperidona", clase: "antipsicótico", comerciales: ["risperdal"] },
  { generico: "aripiprazol", clase: "antipsicótico", comerciales: ["abilify"] },

  // --- Tampoco están en la declaración, y son riesgo serotoninérgico igual ---
  // Se recetan para dolor, migraña o tos, y nadie los cuenta como psicofármacos.
  {
    generico: "tramadol",
    clase: "riesgo serotoninérgico",
    comerciales: ["tramal", "nobligan"],
  },
  { generico: "sumatriptán", clase: "riesgo serotoninérgico", comerciales: ["imigran"] },
  { generico: "rizatriptán", clase: "riesgo serotoninérgico", comerciales: ["maxalt"] },
  { generico: "dextrometorfano", clase: "riesgo serotoninérgico", comerciales: [] },
  { generico: "linezolid", clase: "riesgo serotoninérgico", comerciales: ["zyvox"] },
];

/** Quita acentos para que "fenitoína" se encuentre escrito "fenitoina". */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export type Hallazgo = { generico: string; clase: ClaseFarmaco; termino: string };

/**
 * Busca fármacos en un texto libre, por genérico o por nombre comercial.
 *
 * Se busca por prefijo de palabra y no por coincidencia suelta: "litio" no debe
 * saltar dentro de "analitico", y "prozac" sí dentro de "Prozac 20mg".
 */
export function farmacosEnTexto(texto: string): Hallazgo[] {
  const plano = normalizar(texto);
  const hallazgos: Hallazgo[] = [];
  for (const f of FARMACOS) {
    for (const termino of [f.generico, ...f.comerciales]) {
      const buscado = normalizar(termino);
      if (new RegExp(`\\b${buscado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(plano)) {
        hallazgos.push({ generico: f.generico, clase: f.clase, termino });
        break;
      }
    }
  }
  return hallazgos;
}

/** Las clases encontradas, sin repetir, para redactar una bandera. */
export function clasesEncontradas(hallazgos: Hallazgo[]): ClaseFarmaco[] {
  return [...new Set(hallazgos.map((h) => h.clase))];
}
