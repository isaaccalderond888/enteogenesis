# Contener una pestaña que quedó pidiendo sin parar

Septiembre de 2026. Una pestaña de Expedientes abierta antes del despliegue
seguía pidiendo unas 140 veces por segundo. El defecto ya está corregido, pero
**publicar el arreglo no cambia el código que esa pestaña ya está ejecutando**:
sigue igual hasta que alguien la recargue, y nadie puede recargar la pestaña de
otra persona.

## Por qué el firewall es la única salida

Desde el servidor no se puede detener. El bucle se retroalimenta dentro del
navegador y hasta la respuesta de error lo vuelve a disparar. Cuando la petición
llega a la aplicación, ya se contó.

Vercel sí puede rechazarla antes, en el firewall, y esas peticiones rechazadas
no consumen cuota.

## Por qué hubo que renombrar las funciones

La dirección con la que el navegador llama a una función de servidor sale del
**archivo y del nombre exportado**, nada más:

    /_serverFn/<base64 de {"file":"/src/lib/fichas.ts?tss-serverfn-split",
                           "export":"listFichas_createServerFn_handler"}>

No cambia entre despliegues. Así que bloquear esa dirección habría bloqueado
también al sitio corregido, que llamaba exactamente igual.

Por eso se renombraron las cuatro funciones del panel:

| Antes | Ahora |
| --- | --- |
| `listFichas` | `fichasDelPanel` |
| `listStaff` | `equipoDelPanel` |
| `getFicha` | `fichaDelPanel` |
| `getLectura` | `lecturaDelPanel` |

El sitio corregido llama a direcciones nuevas. Las viejas quedan bloqueadas para
siempre y no cuestan nada. Verificado en el navegador: la versión corregida pide
`fichasDelPanel_createServerFn_handler`, no `listFichas_...`.

## Las rutas viejas

**En producción el identificador es un hash de 64 caracteres, no la cadena
base64 que muestra el servidor de desarrollo.** Es el error que estuvo a punto
de costar una regla de firewall inservible: lo que se observa con `vite dev` no
es lo que pide el sitio publicado. Para obtener las rutas de verdad hay que
compilar (`npx vite build`) y leerlas del bundle.

Rutas de la versión anterior, extraídas del build de producción del commit
previo al renombre y confirmadas contra las que Vercel registraba en vivo:

```
/_serverFn/e2286fde6b4d58b147d7bcc66c569d379edf15f8087950822a78deeadb394238   listFichas
/_serverFn/317eb383a54446b5781f0bb0ae1f38adc0b02df2ee3b123439ef5179f779f356   listStaff
/_serverFn/5d81acf2ac73150f54844bd20cf66cba3fd4e9e73c861d4fcab21f9d4a2c01cb   getFicha
/_serverFn/1229afc4516072cb3da9a636e4985e03a9edac86914af84afcbda0dc3a7d1c43   getLectura
```

Las dos primeras son las que aparecían disparadas en Vercel; las otras dos
salen del mismo build.

En Vercel → el proyecto (**`enteogenesis-4itw`**, no `enteogenesis`) →
**Firewall** → regla nueva → *Request Path* *equals* la ruta → **Deny**.

**Nunca bloquear `/_serverFn/` completo ni con comodín**: por ahí pasa también
el formulario público, y dejaría de poder enviarse una ficha.

### Cómo sacar las rutas nuevas, para comprobar que NO coinciden

```
npx vite build
grep -rhoE 'ns\(`[0-9a-f]{64}`\)' .vercel/output/static/assets/*.js | sort -u
```

Para mapear cada hash a su función, buscar el hash en
`.vercel/output/functions/__server.func/_ssr/ssr.mjs`: el nombre exportado
aparece junto a él.

## Si volviera a pasar

1. Bloquear en el firewall la dirección que aparece disparada en Vercel.
2. Renombrar esa función y desplegar, para que el sitio corregido use otra.
3. Dejar el bloqueo puesto. No estorba.

## Lo que ya no depende de esto

Aunque el bloqueo no estuviera, la base de datos está protegida: las lecturas
repetidas se guardan cinco segundos en memoria del servidor
(`src/lib/cache-breve.ts`). Medido con el bucle corriendo: 4645 consultas a
Postgres en 12 segundos sin ese cache, 17 con él.
