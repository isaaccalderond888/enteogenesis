# Pendientes · Enteogénesis

Notas técnicas para Isaac. No es material para compartir con el equipo clínico:
lo que Claudia e Isaura revisan son los enlaces del sitio, no este archivo.

Estado al cierre de la sesión del 12 de septiembre de 2026.

---

## 1. Vincular una evaluación con la ficha de quien la responde

**La pieza de arquitectura que falta, y la de mayor valor.**

Hoy las escalas de `/evaluaciones` viven sueltas: se responden, se ve el
resultado, y ahí termina. No quedan guardadas ni se sabe de quién son.

Lo que se quiere: que la persona conteste, escriba su correo, y el sistema
**reconozca sola a qué participante corresponde** — su ficha ya trae ese correo
(`fichas.email`) — y cuelgue el resultado de su expediente. Así, al abrir
`/expedientes/{id}`, Isaac y Claudia ven la ficha y sus escalas juntas.

Lo que implica:

- Una tabla `evaluaciones` con `ficha_id`, escala, puntaje, respuestas y fecha.
- Emparejar por correo normalizado, con el caso de que no exista ficha con ese
  correo (¿se guarda huérfana y se vincula después, o se rechaza?).
- Decidir si las respuestas ítem por ítem se guardan o sólo el puntaje. Son
  datos clínicos: guardar de más es un riesgo, guardar de menos pierde la
  posibilidad de releer.
- Mostrarlas en el expediente.

Trabajo de varias horas y con decisiones clínicas de por medio. Aplazado a
propósito.

## 2. Lectura clínica de la ficha con IA

La ficha guarda ~20 respuestas abiertas — camino con sustancias, práctica,
terapia previa, nacimiento, antecedentes familiares, quién eres, sombra,
miedos, razones — y hoy nadie las lee hasta la entrevista. Lo único automático
es `safetyFlags`, que empareja palabras y produce falsos positivos (ver §8).

Lo que se quiere: que al cerrar una ficha, la IA la lea **completa** con los
marcos clínicos de Isaac y devuelva un **perfil** para el expediente —
equivalente a lo que ya hace `landingPB` después de una escala, pero sobre el
conjunto de la ficha en vez de sobre un puntaje.

Qué tendría que producir, para que sea útil y no un resumen bonito:

- Una lectura en prosa del caso, no una etiqueta.
- Los temas que conviene abrir en la entrevista, con la cita textual de la
  ficha que los sugiere — para que Isaac y Claudia puedan contrastar.
- Contraindicaciones o interacciones que la persona menciona de pasada y un
  emparejamiento de palabras no atrapa.
- Lo que la ficha **no** dice y valdría preguntar.

Decisiones antes de construirlo:

- **Nunca se le muestra a quien aplica.** Es una lectura para el equipo, no un
  dictamen devuelto a la persona; el criterio de `ScreeningTAPS.md` aplica aquí
  sin ambigüedad.
- **Nunca decide.** Ni acepta ni rechaza: alimenta la conversación. El estado
  del expediente lo siguen moviendo Isaac y Claudia a mano.
- Se guarda junto a la ficha y se puede regenerar, con la fecha y el modelo con
  que se produjo, porque la lectura envejece cuando cambian los marcos.
- Los marcos salen del vault (`03-Ciencia-Psicodelica`, `02-Neuroclínica`) y hay
  que fijarlos como texto versionado en el repo, no reescribirlos cada vez.
- Hace falta `ANTHROPIC_API_KEY` en Vercel. El costo por ficha es de centavos;
  al volumen de un retiro es irrelevante.

Relación con §8: si esta lectura funciona, `safetyFlags` deja de ser el
tamizaje y pasa a ser sólo una red de seguridad para lo binario y verificable
(embarazo, medicación contraindicada, declaración no aceptada).

## 3. Enviar el resultado por correo

Neon es sólo la base de datos: no manda correo. Hace falta un servicio aparte.

Ya está resuelto en `landingPB` (`app/api/send-results/route.ts`), que usa
**Resend**:

```ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ from: FROM_EMAIL, to: THERAPIST_EMAIL, subject, html });
```

Para traerlo hace falta: `RESEND_API_KEY`, `FROM_EMAIL`, el destinatario, y un
dominio verificado en Resend — probablemente ya verificado para el otro sitio.

Decisión abierta: hoy manda a un solo terapeuta. ¿Va siempre a Isaac y a
Claudia, o quien responde elige a quién?

## 4. Interpretación con IA (escalas)

Está escrita en `landingPB` (`app/api/interpret/route.ts`): SDK de Anthropic con
streaming, y un prompt en primera persona — *"Eres Isaac Calderón,
psicoterapeuta transpersonal…"* — con las cinco instrucciones de tono y el
cierre *"humano, clínico con alma"*. Es portable casi tal cual.

Dos cosas antes de portarla:

- **El modelo está desactualizado.** El código fija una generación anterior; al
  portarlo hay que apuntar al vigente.
- **Hay un criterio en conflicto.** La nota `ScreeningTAPS.md` del vault afirma
  que la interpretación de IA *nunca* se devuelve al cliente; en `landingPB` sí
  se le muestra a quien responde. Falta decidir cuál aplica aquí.

## 5. Revisión humana de los textos

Claudia Saviñón e Isaura Maro revisan todo el texto del sitio y deciden **qué
escalas se quedan**. Las 17 permanecen disponibles mientras tanto, sin enlaces,
para poder mandarlas a revisión una por una.

## 6. Línea de emergencia

Cambiar el bloque de crisis para que aparezcan **primero los tres contactos**
(Isaac, Claudia, Isaura) y la línea quede debajo como red de seguridad.

`src/lib/site.ts` trae hoy `Línea de la Vida · 800 911 2000`, heredada del
código original. **Sin verificar.** Antes de publicarla hay que marcar y
confirmar que contesta; alternativas a evaluar: SAPTEL (Cruz Roja Mexicana) y la
línea de apoyo psicológico de Locatel para CDMX.

## 7. Deuda heredada de la plantilla — resuelto

Las 17 pruebas que fallaban afirmaban el estado original de la plantilla, no un
defecto de esta app; se eliminaron esos bloques. El error de lint quedó cerrado.
`npm test`, `npm run lint` y `npm run typecheck` están limpios, así que de aquí
en adelante una falla significa algo.

Sigue abierto sólo esto:

- `/aplicar` es un redirect a `/` sin nada propio. Se conserva por si algún
  enlace viejo lo usa.
- Google: el botón del broker de Grok sólo completa en `*.grok-sandbox.com`, así
  que en este dominio nunca funcionó y se quitó. El código ya acepta
  credenciales propias vía `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: en
  cuanto existan, el botón reaparece solo.

## 9. Consentimiento para el procesamiento con IA — aplazado

`05-Sistemas/Agente-Clinico-Expediente.md` deja pendiente redactar la cláusula de
consentimiento informado para la asistencia de IA en notas clínicas, y acepta el
costo de que el contenido pase por la nube "con consentimiento explícito del
paciente". La declaración que firma quien aplica al retiro no menciona nada de
eso.

**Aplazado por decisión de Isaac (2026-09-13).** Ya no bloquea §2 para construir
ni para probar: la lectura clínica se puede desarrollar y verificar entera con
fichas inventadas. La cláusula vuelve a ser necesaria el día que una ficha de una
persona real pase por el modelo.

## 8. Calibración clínica del tamizaje de la ficha

`safetyFlags` en `src/lib/application.ts` decide por palabras al inicio de la
frase: sólo reconoce un "no" si la respuesta **empieza** con no / ninguno /
nada. Una respuesta como *"Nunca he tenido nada"* levanta bandera igual.

Eso produce falsos positivos, y un tamizaje que marca de más se deja de mirar.
Es el argumento de fondo para sustituirlo por escalas puntuables (§5) o por la
lectura con marcos clínicos de §2.
