import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyApplication,
  generoTexto,
  limitesFechaNacimiento,
  lectura,
  safetyFlags,
  sexoTexto,
  validateApplication,
  validateStep,
  type Application,
} from "./application.ts";

/** Una ficha válida mínima, para variar sólo el campo bajo prueba. */
function fichaValida(parche: Partial<Application> = {}): Application {
  return {
    ...emptyApplication(),
    marcoAceptado: true,
    nombreCompleto: "Prueba Uno",
    fechaNacimiento: "1985-03-14",
    sexoAlNacer: "Mujer",
    identidadGenero: "Mujer",
    ocupacion: "Diseñadora",
    telefono: "5512345678",
    email: "prueba@ejemplo.com",
    direccion: "Calle 1",
    emergencia: "Ana · 5599",
    comoSeEntero: "Una amiga",
    participadoPsicodelicos: "no",
    sustanciasHistorial: "Ninguno",
    consumeRecreativo: "No",
    practicaEspiritual: "Meditación",
    maestroGuia: "No",
    terapia: "No",
    malaExperiencia: "No",
    emergenciaEspiritual: "No",
    nacimiento: "Parto natural",
    enfermedadMental: "No",
    antecedentesFamiliares: "Ninguno",
    otroPadecimiento: "Ninguno",
    cambioDramatico: "No",
    medicamentos: "Ninguno",
    // Las doce del bloque "El cuerpo": la ficha no cierra si falta alguna.
    ...Object.fromEntries(
      [
        "cardiaco", "hipertension", "alergia", "autoinmune", "cirugia", "terminal",
        "accidente", "desmayo", "tiroides", "glaucoma", "embarazo", "hormonal",
      ].map((k) => [k, { respuesta: "no", detalle: "" }]),
    ),
    quienEres: "Una persona",
    sombra: "El control",
    miedos: "Perder el control",
    razones: "Reconectar",
    declara: "si",
    firma: "Prueba Uno",
    ...parche,
  };
}

// --- Banderas de seguridad ---------------------------------------------------
// Son lo que Isaac y Claudia leen antes de la entrevista: si dejan de
// levantarse, una contraindicación llega a la sesión sin que nadie la vea.

test("embarazo, cardiaco, hipertensión y enfermedad terminal levantan PAUSA", () => {
  for (const campo of ["embarazo", "cardiaco", "hipertension", "terminal"] as const) {
    const flags = safetyFlags(
      fichaValida({ [campo]: { respuesta: "si", detalle: "detalle" } } as Partial<Application>),
    );
    assert.equal(
      flags.filter((f) => f.level === "hold").length,
      1,
      `${campo} debería levantar exactamente una pausa`,
    );
  }
});

test("tiroides y alergias piden revisar, no pausan", () => {
  const flags = safetyFlags(
    fichaValida({
      tiroides: { respuesta: "si", detalle: "Hipotiroidismo" },
      alergia: { respuesta: "si", detalle: "Polen" },
    }),
  );
  assert.equal(flags.filter((f) => f.level === "hold").length, 0);
  assert.deepEqual(
    flags.filter((f) => f.level === "review").map((f) => f.label),
    ["Tiroides", "Alergias"],
  );
});

test("un antidepresivo ISRS pausa; otro medicamento sólo pide revisar", () => {
  const isrs = safetyFlags(fichaValida({ medicamentos: "Sertralina 50mg" }));
  assert.equal(
    isrs.some((f) => f.level === "hold" && f.label.startsWith("Medicación contraindicada")),
    true,
  );

  const otro = safetyFlags(fichaValida({ medicamentos: "Levotiroxina 50mcg" }));
  assert.equal(otro.some((f) => f.level === "hold"), false);
  assert.equal(otro.some((f) => f.level === "review" && f.label === "Medicación actual"), true);
});

test("el fármaco se busca en todos los campos, no sólo en el de medicamentos", () => {
  // En las fichas reales aparece al describir la salud mental, entre las
  // sustancias que se consumen, o como "otro padecimiento". Mirar un solo campo
  // dejaba pasar la mitad de los casos.
  for (const campo of [
    { enfermedadMental: "Escitalopram de 10mg todas las noches desde hace 6 años" },
    { sustanciasHistorial: "Nicotina, cafeína, marihuana, sertralina y alcohol" },
    { otroPadecimiento: "Fibromialgia tratada con pregabalina" },
  ]) {
    const flags = safetyFlags(fichaValida({ medicamentos: "No", ...campo }));
    assert.equal(
      flags.some((f) => f.level === "hold" && f.label.startsWith("Medicación contraindicada")),
      true,
      `debería encontrarlo en ${Object.keys(campo)[0]}`,
    );
  }
});

test("la bandera nombra la clase, que es lo que la persona no sabe", () => {
  // Quien firma "no uso ISRS" y toma duloxetina no miente: duloxetina es IRSN.
  const flags = safetyFlags(fichaValida({ medicamentos: "duloxetina 30 mg y pregabalina 75 mg" }));
  const bandera = flags.find((f) => f.label.startsWith("Medicación contraindicada"));
  assert.match(bandera?.label ?? "", /IRSN/);
  assert.match(bandera?.label ?? "", /anticonvulsivo/);
});

test("el nombre comercial levanta la misma bandera que el genérico", () => {
  // Nadie escribe "escitalopram" si la caja dice Lexapro.
  const flags = safetyFlags(fichaValida({ medicamentos: "Lexapro 10mg en las noches" }));
  assert.equal(
    flags.some((f) => f.level === "hold" && f.label.startsWith("Medicación contraindicada")),
    true,
  );
});

test("no aceptar la declaración pausa la ficha", () => {
  assert.equal(
    safetyFlags(fichaValida({ declara: "no" })).some((f) => f.label === "Declaración no aceptada"),
    true,
  );
});

test("una ficha sin banderas no inventa ninguna", () => {
  assert.deepEqual(safetyFlags(fichaValida()), []);
});

test("las negaciones habituales no levantan bandera de salud mental", () => {
  for (const respuesta of ["No", "no", "Ninguno", "Ninguna", "Nada", "N/A", "No aplica"]) {
    assert.deepEqual(
      safetyFlags(fichaValida({ enfermedadMental: respuesta })).filter((f) => f.label === "Salud mental"),
      [],
      `"${respuesta}" no debería levantar bandera`,
    );
  }
});

test("una negación que no empieza con 'no' SÍ levanta bandera — falso positivo conocido", () => {
  // Documenta el comportamiento actual, no lo aprueba: `isNegation` sólo mira el
  // inicio de la frase. Está anotado como §8 en PENDIENTES.md; cuando se
  // sustituya por una lectura clínica, esta prueba debe cambiar a propósito.
  const flags = safetyFlags(fichaValida({ enfermedadMental: "Nunca he tenido nada" }));
  assert.equal(flags.some((f) => f.level === "hold" && f.label === "Salud mental"), true);
});

test("la lectura nombra las pausas antes que las revisiones", () => {
  const data = fichaValida({
    cardiaco: { respuesta: "si", detalle: "Arritmia" },
    tiroides: { respuesta: "si", detalle: "Hipotiroidismo" },
  });
  const texto = lectura(data, safetyFlags(data));
  assert.ok(texto.indexOf("Pausas") < texto.indexOf("Revisar"), texto);
});

// --- Sexo e identidad --------------------------------------------------------

test("sexo e identidad se leen de los campos nuevos", () => {
  const data = fichaValida({ sexoAlNacer: "Intersex", identidadGenero: "No binario" });
  assert.equal(sexoTexto(data), "Intersex");
  assert.equal(generoTexto(data), "No binario");
});

test('"Otra" muestra el texto que escribió la persona', () => {
  const data = fichaValida({ identidadGenero: "Otra", identidadGeneroOtra: "  Género fluido  " });
  assert.equal(generoTexto(data), "Género fluido");
});

test("una ficha anterior al cambio sigue mostrando su dato", () => {
  const vieja = fichaValida({ sexoAlNacer: "", identidadGenero: "", sexo: "Mujer" });
  assert.equal(sexoTexto(vieja), "Mujer");
  assert.equal(generoTexto(vieja), "Mujer");
});

// --- Validación --------------------------------------------------------------

test("la ficha de referencia pasa la validación completa", () => {
  assert.equal(validateApplication(fichaValida()), null);
});

test("faltar sexo al nacer o identidad detiene la ficha", () => {
  assert.match(String(validateApplication(fichaValida({ sexoAlNacer: "" }))), /sexo asignado/i);
  assert.match(String(validateApplication(fichaValida({ identidadGenero: "" }))), /identidad/i);
});

test('elegir "Otra" sin escribirla detiene la ficha', () => {
  const msg = validateApplication(fichaValida({ identidadGenero: "Otra", identidadGeneroOtra: "  " }));
  assert.match(String(msg), /nombras/i);
});

test("una fecha de nacimiento imposible no pasa de la ficha", () => {
  // Caso real de Claudia: escribió mal la fecha, quiso corregirla escribiendo
  // encima, y los dígitos se concatenaron —1085 corregido a 1985 quedó 31985—.
  // Antes sólo se comprobaba que el campo no estuviera vacío.
  for (const fecha of ["31985-12-03", "1085-03-14", "0019-01-01", "3000-01-01"]) {
    const error = validateStep(1, fichaValida({ fechaNacimiento: fecha }));
    assert.match(error ?? "", /fecha de nacimiento/i, `debería rechazar ${fecha}`);
  }
});

test("una fecha de nacimiento normal sí pasa", () => {
  assert.equal(validateStep(1, fichaValida({ fechaNacimiento: "1985-03-14" })), null);
});

test("el trabajo es para mayores de edad, y se dice con claridad", () => {
  const hoy = new Date();
  const hace10 = new Date(hoy.getFullYear() - 10, hoy.getMonth(), hoy.getDate());
  const error = validateStep(1, fichaValida({ fechaNacimiento: hace10.toISOString().slice(0, 10) }));
  assert.match(error ?? "", /mayores de 18/i);
});

test("los límites del campo dejan el rango que el formulario acepta", () => {
  const { min, max } = limitesFechaNacimiento(new Date("2026-09-15T00:00:00Z"));
  assert.equal(max, "2008-09-15");
  assert.equal(min, "1926-09-15");
});
