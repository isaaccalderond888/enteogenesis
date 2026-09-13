# Qué contesta la gente de verdad

Barrido de las 30 fichas del formulario de Enteogénesis (respuestas de retiros
pasados), hecho para decidir qué dominios merecen un lugar en la lectura clínica
en vez de inventarlos.

**Aquí sólo viven cuentas.** Ninguna persona, ninguna cita, ningún dato de
contacto. Los números de ficha que aparecen son la posición en la hoja de Isaac,
no una identidad: el mapeo lo tiene él.

Fecha del barrido: 2026-09-13 · n = 30

## Lo primero: el bloque cerrado de salud casi no dice nada

La mediana de caracteres de las preguntas cerradas de salud (cardiaco,
hipertensión, autoinmune, terminal, desmayos, glaucoma, embarazo, hormonal) es
**2**. Es decir: "No".

Las señales clínicas no están ahí. Están en las preguntas abiertas, donde la
mediana sube a 60–320 caracteres. Lo que ya decía el marco —"las
contraindicaciones reales suelen aparecer en las respuestas abiertas"— se
sostiene con datos: leer sólo el bloque cerrado deja pasar casi todo.

## La declaración firmada

Las 30 fichas la firman. Dice, entre otras cosas, que quien la firma **no** usa
ISRS, IMAO ni anticonvulsivos, y que **no** tiene historial de brotes psicóticos
o internación psiquiátrica.

**6 de 30 (20%) firman y nombran en su propia ficha un fármaco de esa lista.**

De esas seis, la mitad lo describe como vigente y la mitad como pasado:

| | vigente al llenar | ya suspendido |
|---|---|---|
| fichas | 3 | 3 |

No es gente que mienta: es gente que no sabe que su medicamento entra en esa
lista. Un ISRS se llama sertralina, no "ISRS". Por eso el cotejo no puede
quedarse en "¿firmó?" y tiene que ser fármaco por fármaco, y separar **vigente**
de **suspendido** — son dos decisiones clínicas distintas.

Fármacos encontrados: sertralina, fluoxetina, paroxetina, escitalopram,
duloxetina, venlafaxina, mirtazapina, pregabalina.

Dos de esos no son ISRS y se cuelan con facilidad: **duloxetina** es IRSN y
**pregabalina** es anticonvulsivo. Ambas aparecen en la misma ficha, vigentes.

## Cuántos dominios se encienden por persona

La pregunta era si un tablero de ocho casillas fijas se sostiene. **No se
sostiene**: la carga varía demasiado.

| dominios variables activos | fichas |
|---|---|
| 0 | 1 |
| 1 | 7 |
| 2 | 6 |
| 3 | 8 |
| 4 | 4 |
| 5 | 1 |
| 6 | 1 |
| 7 | 2 |

Mínimo 0, mediana 3, máximo 7. Sumando los fijos, el tablero va de **3 a 10
casillas**, con 6 como caso típico.

De ahí la estructura: un piso fijo que aparece siempre (aunque esté en verde,
porque su ausencia es la información) y casillas variables que sólo aparecen
cuando hay algo que decir.

## Frecuencia de cada dominio

Fijos — van siempre:

| dominio | por qué es fijo |
|---|---|
| Declaración vs. reportado | 20% tiene choque; el 80% restante necesita verse revisado |
| Lavados | 70% nombra alcohol, 23% un psicofármaco |
| Salud física | el bloque cerrado es donde se declara, aunque casi siempre sea "No" |
| Riesgo agudo | su ausencia es exactamente lo que hay que poder ver |

Variables — sólo si hay algo:

| dominio | fichas | % |
|---|---|---|
| Experiencia previa mala con sustancia | 17 | 57% |
| Psiquiátrico propio (dx o tratamiento) | 15 | 50% |
| Duelo o pérdida en curso | 12 | 40% |
| Antecedente familiar psiquiátrico | 11 | 37% |
| Perinatal cargado | 9 | 30% |
| Emergencia espiritual / desbordamiento | 6 | 20% |
| Violencia o abuso | 6 | 20% |
| Suicidio en la familia | 4 | 13% |
| Sin terapia ni red actual | 4 | 13% |

Otros datos del barrido: 87% ha hecho o hace terapia psicológica, 63% reporta
alguna cirugía, 70% nombra alcohol, 33% cannabis, 27% nicotina, 13% tiroides,
3% carga cardiovascular.

## Un falso positivo que importa

Buscar "suicidio" en toda la ficha da 5 resultados. **Los cinco son familiares
—abuelo, padre, primos, medio hermano— y ninguno es ideación propia.**

Una alerta de riesgo que no distingue "mi abuelo se suicidó" de "pienso en
quitarme la vida" convierte la casilla de riesgo agudo en ruido, y una casilla
que suena en falso deja de mirarse. El antecedente familiar de suicidio es
clínicamente relevante, pero es otro dominio y otra conversación.

## Lo que esto cambia en el producto

1. Tablero de piso fijo + casillas variables, no ocho fijas.
2. El cotejo de la declaración se hace por fármaco, distinguiendo vigente de
   suspendido, y nombra la clase (ISRS / IRSN / anticonvulsivo) porque quien
   llenó la ficha no la conoce.
3. Riesgo agudo distingue lo propio de lo familiar.
4. "Suicidio en la familia" y "perinatal cargado" se ganaron su lugar con datos;
   no estaban en mi propuesta inicial con ese peso.

## Qué se construyó con esto

El tablero de `src/lib/clinica/dominios.ts` sale directo de aquí: el piso fijo de
cuatro casillas, las variables ordenadas por la frecuencia de la tabla de arriba,
y `suicidioFamiliar` separado de `antecedenteFamiliar` por el falso positivo.

`segundaVez` no salió de las cuentas sino de leer una ficha completa: alguien que
ya había participado, y cuya dosis dependía de cómo le fue la vez anterior — un
dato que el formulario nunca pregunta.

Lo que el barrido dejó como tarea del formulario, no del sistema:

1. La declaración nombra categorías (ISRS, IMAO, anticonvulsivos) y la gente
   conoce nombres comerciales. Una lista de medicamentos junto a la casilla
   evitaría la mitad de los seis choques.
2. El formulario pregunta *si* participó antes, nunca *cómo fue*. Ninguna lectura
   puede recuperar un dato que nadie pidió.
