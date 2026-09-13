# Convenciones · Enteogénesis

## Datos de personas — regla permanente

Isaac trabaja con fichas y expedientes de personas reales, y a veces los pega
completos en la conversación para que haya material con el que trabajar. Tiene
autorización de esas personas para usarlos con fines de investigación.

**Al guardar cualquier cosa —repositorio, bóveda, archivo, commit— la
información se convierte en confidencial antes de escribirla.** Nunca se guarda
un nombre completo, correo, teléfono, domicilio, ni un dato que identifique a
alguien.

Pseudonimización, como en `SKILL-Agente-Clinico.md`: **tres primeras letras del
nombre + tres del apellido** — Isaac Calderón → `Isacal`. El mapeo entre clave y
persona lo guarda Isaac aparte; aquí no vive.

Esto aplica también a los ejemplos: un caso de prueba se inventa entero o se
pseudonimiza, nunca se copia de una ficha real.

## Dominios

- **Ciencia Psicodélica** — el producto: este sitio, la plataforma, los
  manuales. Material con marca.
- **Práctica Clínica** — el criterio con que Isaac evalúa, prepara o integra a
  una persona frente a él. Su puerta de entrada es el Atlas Terapéutico, en
  `08-Práctica-Clínica` de la bóveda.

La lectura clínica de una ficha vive en la frontera: la produce el producto,
pero el criterio es de la práctica. Ver `src/lib/clinica/lectura-ficha.ts`.

## Qué decide el sistema y qué no

Nada. Ni admite, ni rechaza, ni diagnostica. La lectura y las banderas alimentan
una conversación entre Isaac, Claudia y la persona; la decisión —incluida la
dosis— se toma en la entrevista y de común acuerdo con quien participa.
