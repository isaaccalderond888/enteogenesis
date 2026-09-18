# Completar una ficha ya enviada

Cuando alguien omitió algo, o algo cambió entre que mandó la ficha y la
entrevista, ya no hay que llenarla de nuevo ni complementar de memoria.

## Cómo se manda el enlace

1. Entra al expediente de esa persona: **Expedientes → su ficha**.
2. Botón **«Enviar link para completar ficha»**, debajo de la lectura clínica.
3. Copia el enlace **en ese momento**: no se puede volver a ver. En la base
   guardamos sólo su hash, así que ni nosotros podemos recuperarlo.
4. Mándaselo por donde ya hablan con ella. No necesita cuenta ni contraseña.

Si ya había un enlace sin usar, la pantalla lo dice y ofrece crear otro. **Crear
uno nuevo cancela el anterior**, para que no queden dos puertas abiertas.

Quien puede generarlo es quien puede entrar a Expedientes: la misma lista de
siempre, sin cambios.

## Qué ve ella

Su ficha completa, con todo lo que ya contestó. Avanza por los mismos ocho pasos
—se puede saltar hasta lo que quiera corregir— y guarda al final. Lo que no toca
se queda igual.

## Cuánto dura

**72 horas**, y se cancela en cuanto ella guarda.

Abrirlo no lo consume: puede entrar, cerrar el navegador y volver más tarde
dentro de esas 72 horas. Si lo consumiera al abrir, cerrar la pestaña sin querer
la dejaría fuera de su propia ficha.

Dos pestañas guardando a la vez no pueden escribir las dos: la segunda recibe
«este enlace ya se usó».

Si caduca o ya se usó, la pantalla se lo dice con una frase que explica qué hacer
—pedir otro— y aclara que lo que ya había contestado sigue guardado.

## Qué pasa del lado de ustedes

**No se crea una ficha nueva.** Se actualiza la misma, así que no hay duplicados
en el archivo.

**Queda el rastro.** El expediente muestra arriba, en ámbar, «Completada por la
participante vía enlace el …», con la fecha y cuántas veces. Está para que nadie
lea una ficha creyendo que es la que leyó la semana pasada.

**Se guarda la versión anterior.** Cada edición archiva el estado previo en
`ficha_versiones`. Esto no es prolijidad: si alguien corrige «ya no tomo
sertralina», hace falta poder ver qué decía antes y cuándo cambió. Una ficha que
se sobrescribe en silencio borra justo el dato que obliga a preguntar de nuevo.
Hoy se guarda pero no se muestra; ponerlo en pantalla es media hora cuando lo
quieran.

**La lectura clínica se borra.** Se generó sobre datos que acaban de cambiar, así
que dejarla en pantalla sería peor que no tenerla: se leería un tablero basado en
información que la persona ya no reporta. El expediente vuelve a ofrecer
«Generar lectura».

**Las banderas automáticas se recalculan** con lo nuevo: si ahora nombra un
fármaco de la lista, la ficha pasa a pausa sola.

## Por dentro

- `migrations/0004_edicion.sql` — `ficha_links`, `ficha_versiones`, y las
  columnas de rastro en `fichas`.
- `src/lib/edicion/enlace.ts` — lo que también necesita el navegador: duración,
  estados y los avisos.
- `src/lib/edicion/token.server.ts` — generar y hashear. Sólo servidor.
- `src/lib/edicion/server.ts` — crear, abrir y guardar.
- `src/routes/completar.$token.tsx` — la pantalla de ella. `noindex`.
- `src/components/enlace-completar.tsx` — el botón del expediente.

El token es aleatorio de 32 bytes y en la base vive sólo su SHA-256. No va
firmado a propósito: un token firmado se valida sin tocar la base pero no se
puede invalidar, y aquí hace falta cancelarlo al primer guardado. Como el estado
tiene que vivir en la base de todos modos, guardar el hash sale gratis y protege
de una fuga — quien lea la tabla tiene hashes, no enlaces que abren fichas.
