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

En Vercel → el proyecto → **Firewall** → regla nueva → condición *Request Path*
*starts with*, acción **Deny**. Una por cada una:

```
/_serverFn/eyJmaWxlIjoiL3NyYy9saWIvZmljaGFzLnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6Imxpc3RGaWNoYXNfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9
/_serverFn/eyJmaWxlIjoiL3NyYy9saWIvZmljaGFzLnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6Imxpc3RTdGFmZl9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0
/_serverFn/eyJmaWxlIjoiL3NyYy9saWIvZmljaGFzLnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6ImdldEZpY2hhX2NyZWF0ZVNlcnZlckZuX2hhbmRsZXIifQ
/_serverFn/eyJmaWxlIjoiL3NyYy9saWIvZmljaGFzLnRzP3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6ImdldExlY3R1cmFfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9
```

**Nunca bloquear `/_serverFn/` completo**: por ahí pasa también el formulario
público, y dejaría de poder enviarse una ficha.

Las dos primeras están verificadas contra lo que el navegador pide de verdad;
las otras dos se derivan de la misma fórmula, que resultó exacta en esos dos
casos.

## Si volviera a pasar

1. Bloquear en el firewall la dirección que aparece disparada en Vercel.
2. Renombrar esa función y desplegar, para que el sitio corregido use otra.
3. Dejar el bloqueo puesto. No estorba.

## Lo que ya no depende de esto

Aunque el bloqueo no estuviera, la base de datos está protegida: las lecturas
repetidas se guardan cinco segundos en memoria del servidor
(`src/lib/cache-breve.ts`). Medido con el bucle corriendo: 4645 consultas a
Postgres en 12 segundos sin ese cache, 17 con él.
