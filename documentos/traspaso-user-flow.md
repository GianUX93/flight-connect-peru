# Traspaso — User Flow (Vendedor y Comprador)

**Fuente:** estado real del código a la fecha (`src/routes/*.tsx`, `src/lib/mock-data.ts`, `src/lib/flight-utils.ts`).
**Propósito:** detallar, paso a paso, cada acción y tarea que cumple cada rol dentro del prototipo — no es un flujo aspiracional, es lo que hoy está implementado y navegable.
**Nota:** una misma persona puede ser vendedor y comprador en momentos distintos (no son cuentas separadas) — este documento separa los flujos por **rol dentro de una transacción**, no por tipo de usuario.

---

## Índice

1. [Flujo del vendedor](#1-flujo-del-vendedor)
2. [Flujo del comprador](#2-flujo-del-comprador)
3. [Punto de encuentro: la máquina de estados de la transacción](#3-punto-de-encuentro-la-máquina-de-estados-de-la-transacción)
4. [Flujo de disputa (ambos roles)](#4-flujo-de-disputa-ambos-roles)
5. [Diagrama resumen](#5-diagrama-resumen)

---

## 1. Flujo del vendedor

### 1.1 Publicar un pasaje (`/publish`)

**Entrada:** botón "Publicar un pasaje" (header, dropdown de avatar, o CTA en `/dashboard`).

El formulario es un stepper de 4 pasos. No se puede avanzar al siguiente paso con datos inválidos (validación dura en el paso de precio).

| Paso | Nombre | Acciones del vendedor | Reglas / validaciones |
|---|---|---|---|
| 0 | **Vuelo** | Sube un voucher/captura de reserva (`Autocompletar con IA`) **o** completa manualmente: aerolínea, número de vuelo, origen/destino ida, fecha/hora, si es solo ida o ida y vuelta (y de ser así, origen/destino/fecha/hora de vuelta), equipaje. | El autocompletado por IA es una simulación visual (~1.8s de "Analizando con IA…"): completa aerolínea, vuelo, ruta, fechas, horarios y equipaje, pero **no** completa email/teléfono del pasajero (no vienen impresos en un voucher real). Botón de intercambiar Origen ⇄ Destino disponible en cada tramo. |
| 1 | **Reserva** | Si es ida y vuelta, decide **qué tramo(s) vende**: `ida`, `regreso` o `ambos`. Completa asiento por tramo (`AsientoFields`): tipo (seleccionado/aleatorio) y, si es seleccionado, categoría (ventana/medio/pasillo) y número. Completa los datos del pasajero titular (nombres, apellidos, email, teléfono). | Una sola oferta, un solo comprador — nunca se vende el mismo tramo dos veces. Asiento de ida y de vuelta son independientes entre sí. Solo "ventana" + "seleccionado" obtiene el badge "Ventana confirmada"; "aleatorio" siempre se muestra como "Asignación aleatoria" (nunca "por confirmar"). |
| 2 | **Precio** | Ingresa el precio de reventa. Opcionalmente ingresa el cargo estimado que le cobraría la aerolínea por el endoso (`cargoAerolineaEstimado`, sin evidencia requerida en este punto). Decide si permite que la oferta entre en "última llamada" (`sellerAllowsLastCall`) cuando falten <24h para el vuelo. | **Tope de precio de reventa, bloqueo duro:** debe ser estrictamente menor al precio original y no menor al 10% de este. Input pasa de neutro → verde (válido) → rojo (fuera de rango, botón "Continuar" deshabilitado). Ve un neto estimado (precio − cargo estimado − comisión) antes de publicar. |
| 3 | **Confirmar publicación** | Revisa el resumen completo de la oferta. Escribe una **nota opcional para compradores** (textarea, 280 caracteres — ej. "Cambio de planes, endoso rápido, respondo en minutos…"). Presiona "Publicar pasaje". | La nota es puramente informativa, visible en el detalle del vuelo para cualquier comprador. |
| 4 | **Éxito** | Pantalla de confirmación: precio publicado + mensaje indicando que verá vistas/interesados/guardados desde "Mis operaciones → Publicados" (no se muestran cifras en esta pantalla — recién empiezan a generarse una vez expuesta al público). Botón "Ir a mis operaciones" navega directo a la pestaña Publicados. | — |

### 1.2 Monitorear publicaciones activas (`/dashboard`, pestaña "Publicados")

**Entrada:** "Como vendedor" → chip "Publicados" (o directo desde el botón final de Publicar).

Esta vista lista los `Flight` que le pertenecen al vendedor (`flight.seller.id === currentUser.id`) y que **todavía no tienen comprador** (sin `Transaction` asociada).

Por cada publicación activa, el vendedor puede:

- **Ver su estado real:** badge "Publicado · activo" o "Última llamada" (si faltan <24h y `sellerAllowsLastCall = true`).
- **Ver 3 métricas de desempeño:** Vistas, Interesados, Guardados (corazón — señal de intención más fuerte que una vista).
- **"Ver publicación":** abre el detalle del vuelo tal como lo ve un comprador; al volver, regresa directo a la pestaña Publicados (sin necesidad de re-navegar por Explorar).
- **"Retirar publicación" (danger zone):** solo disponible porque aún no hay comprador. Abre un modal de confirmación que advierte que la oferta dejará de ser visible de inmediato y que quien la tenía guardada no podrá completarla, pero aclara que **no se elimina el historial**. Al confirmar, la oferta desaparece del marketplace y pasa a la pestaña "Retirados" (solo lectura, sin acciones).

### 1.3 Gestionar una venta en curso (`/dashboard`, pestaña "En proceso")

Una vez que un comprador paga y el dinero queda retenido en escrow, la oferta deja de estar en "Publicados" (ya tiene `Transaction`) y aparece como tarjeta de transacción en "En proceso", con badge "Venta". El vendedor ejecuta, en orden, las 3 transiciones reales de la máquina de estados (ver sección 3):

1. **Espera a que el comprador envíe sus datos de endoso** (nombres, apellidos, tipo y número de documento) — visibles solo para él, nunca por chat.
2. **"Iniciar trámite con la aerolínea"** — habilitado recién cuando esos datos ya llegaron.
3. Durante el trámite, si la aerolínea le cobra algo por el endoso, **reporta el cargo real** subiendo evidencia (monto + `evidenciaUrl` simulado) — pasa a `pendiente_revision`, y si supera el 50% del precio de venta, queda marcado para revisión manual obligatoria aunque tenga evidencia.
4. **"Confirmar traspaso"** — una vez completado el endoso ante la aerolínea.
5. **"Liberar pago retenido"** — ve el neto final calculado (precio − cargo de aerolínea confirmado − comisión efectiva, nunca negativo) antes de confirmar. Al liberar, se dispara un modal de éxito con el monto liberado.

En cualquier punto antes de liberar el pago, el vendedor también puede:

- **Contactar al comprador** vía el chat interno de esa transacción (nunca WhatsApp, nunca expone el teléfono real).
- **Reportar un problema** (ver sección 4).

---

## 2. Flujo del comprador

### 2.1 Descubrir vuelos (`/explore`)

**Entrada:** "Explorar vuelos" (header) o CTA desde la landing.

- Busca por origen/destino con botón de intercambio Origen ⇄ Destino.
- Elige un rango de fechas por presets (`semana`, `quince`, `mes`) o "Ingresar fecha" para una fecha exacta — sin fecha seleccionada, no se muestra ningún resultado (evita el bug de mostrar todo el inventario sin filtro real).
- Filtra por aerolínea, tipo de asiento y rango de precio (slider de doble manija) desde el Popover "Más filtros".
- Ordena resultados desde el dropdown "Ordenar".
- Todo el filtrado es en vivo, sin botón "Buscar" ni espera de red.
- Puede **guardar** un vuelo (corazón) directamente desde la card sin entrar al detalle — toast "Guardado en tus favoritos" con link a `/profile?tab=guardados`.
- Puede crear una **alerta de búsqueda** ("Avísame cuando aparezcan pasajes") una vez que origen y destino están completos — usa su email de sesión sin pedirlo de nuevo; recibe una notificación simulada ~4s después con un vuelo real que calza.

### 2.2 Revisar el detalle de un vuelo (`/flight/$id`)

Desde una card en Explorar, en un resultado de búsqueda, o desde una notificación/alerta.

- Ve el desglose completo: ruta con línea punteada partida por el ícono del avión, fecha/hora, aerolínea y número de vuelo, equipaje, asiento (con badge "Ventana confirmada" solo si aplica), nota del vendedor (si la escribió), precio fijo.
- Si es ida y vuelta con `tramoAVender = "ambos"`, ve **dos bloques completos** (Ida y Vuelta), cada uno con su propia información — nunca se asume que comparten los mismos datos.
- Si faltan <24h para el vuelo y el vendedor permite última llamada, ve el countdown prominente ("Última llamada", pastilla oscura con punto pulsante).
- Puede **Guardar** (corazón) o **Compartir** (Popover con link para copiar, WhatsApp, Facebook, Instagram — Instagram solo copia el link porque no soporta compartir prellenado desde web).
- **"Pagar y retener dinero"** abre un modal de selección de método de pago (Yape/Plin, Tarjeta, Transferencia bancaria) → estado "Procesando pago…" (~1.5s simulado) → confirma el pago y arranca el flujo de escrow.

### 2.3 Completar el trámite de endoso (`/dashboard`, pestaña "En proceso", como comprador)

Tras pagar, la transacción aparece en su "Mis operaciones" → "Como comprador" con badge "Compra", estado inicial `pago_retenido`.

1. **Completa el formulario de datos para el endoso** (nombres, apellidos, tipo y número de documento) — estructurado, nunca se pide por chat en texto libre. Esto es lo que habilita al vendedor a iniciar el trámite.
2. **Sigue el timeline** de 4 pasos (Pago retenido → Vendedor inicia trámite → Traspaso confirmado → Pago liberado) para saber en qué punto está su compra, sin poder alterar los estados directamente (esas transiciones son responsabilidad del vendedor).
3. **Contacta al vendedor** por el chat interno de esa transacción si tiene dudas.
4. **Ve el precio fijo garantizado** — nunca cambia después de pagar, sin importar lo que el vendedor reporte de cargo de aerolínea (ese cargo lo asume siempre el vendedor).
5. Al llegar a `liberado`, la transacción sale de la vista activa; si algo falla, el modelo contempla reembolso 100% (estado `reembolsado`, también fuera del timeline lineal).
6. En cualquier punto antes de `liberado`/`reembolsado`, puede **Reportar un problema** (ver sección 4).

### 2.4 Gestionar su perfil (`/profile`)

- Segmented control: **Verificación** (estado de identidad verificada), **Preferencias**, **Viajes guardados**.
- En "Viajes guardados" ve los vuelos que marcó con el corazón, incluyendo los que ya no están disponibles (marcados "Ya no disponible", no desaparecen solos).
- Ve su reputación (como comprador y como vendedor) con botón "Ver reseñas" (modal).

---

## 3. Punto de encuentro: la máquina de estados de la transacción

Ambos roles observan la **misma** `Transaction`, pero solo el vendedor puede avanzarla:

```
pago_retenido ──▶ vendedor_inicia ──▶ confirmado ──▶ liberado
   (comprador          (vendedor,          (vendedor,
    paga)               tras recibir        "Confirmar
                         datos de            traspaso")
                         endoso)
```

- **Interrupciones posibles desde cualquier punto** (antes de `liberado`): `en_disputa` (ver sección 4) o `reembolsado`. Ninguna de las dos forma parte del `stateOrder` lineal — son estados terminales o de pausa, no pasos del camino feliz.
- El vendedor **nunca** ve datos de pago del comprador más allá de lo necesario para el endoso; el comprador **nunca** ve el cargo de aerolínea que el vendedor reporta.

---

## 4. Flujo de disputa (ambos roles)

Disponible desde el botón "Reportar problema" en la card de transacción, en cualquier estado antes de `liberado`/`reembolsado`.

1. Se abre un modal con **categorías predefinidas según el rol de quien reporta**:
   - **Comprador:** "El vendedor no responde", "El vuelo o asiento no coincide con lo publicado", "Boleto inválido o rechazado por la aerolínea", "Sospecho de fraude", "Otro".
   - **Vendedor:** "El comprador no responde", "Datos de endoso incorrectos o incompletos", "Sospecho de fraude", "Otro".
2. Puede agregar un detalle opcional en texto libre (máx. 400 caracteres).
3. Al enviar: la transacción pasa a `en_disputa`, el pago retenido queda **en pausa** (se bloquean "Iniciar trámite", "Confirmar traspaso", "Liberar pago retenido" y el reporte de cargo de aerolínea), y ambos roles ven el estado con copy no técnico y tranquilizador: **"Pago en pausa"** (label corto) y **"Soporte está revisando · pago en pausa"** (badge, reemplaza al botón de reportar).
4. El timeline visual no se pierde: se congela en el último paso real alcanzado antes de la disputa.
5. **Límite actual del prototipo:** el reporte queda registrado (motivo, detalle, fecha) pero no existe todavía un panel de soporte que resuelva el caso (liberar, reembolsar o mediar) — la transacción permanece "en pausa" de forma indefinida en esta versión.

---

## 5. Diagrama resumen

```
                         VENDEDOR                                    COMPRADOR
                     ───────────────                             ───────────────
                    Publicar pasaje (/publish)
                    4 pasos: Vuelo → Reserva →
                    Precio → Confirmar (+ nota)
                            │
                            ▼
              Publicado, visible en /explore ───────────▶  Explorar y filtrar (/explore)
                            │                                        │
              Ve en "Publicados": vistas,                            ▼
              interesados, guardados.                     Ver detalle (/flight/$id)
              Puede "Retirar publicación"                            │
              (solo si aún no hay comprador)                         ▼
                            │                              "Pagar y retener dinero"
                            │                              → método de pago → escrow
                            ▼                                        │
                 Transacción creada (pago_retenido) ◀────────────────┘
                            │                                        │
                            │                              Completa datos de endoso
                            ▼                                        │
              "Iniciar trámite con la aerolínea"                     │
              (reporta cargo real si aplica)                         │
                            │                                        │
                            ▼                                        ▼
                  "Confirmar traspaso"                    Sigue el timeline / chat
                            │
                            ▼
              "Liberar pago retenido" (ve neto final)
                            │
                            ▼
                        liberado

        En cualquier punto antes de "liberado": cualquiera de los dos puede
        "Reportar problema" → en_disputa → "Pago en pausa" / "Soporte está revisando"
```
