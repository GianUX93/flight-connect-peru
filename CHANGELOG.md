# Traspaso — Registro de cambios, decisiones de diseño y lógica de negocio

Este documento resume las decisiones tomadas durante el desarrollo del prototipo: qué se construyó, por qué, y las reglas de negocio que gobiernan el producto. Sirve como referencia para retomar el trabajo o alinear a alguien nuevo sin tener que releer todo el historial de cambios.

---

## 1. Producto y contexto

**Traspaso** es un marketplace P2P peruano de endoso de pasajes aéreos nacionales. Un vendedor con un pasaje que no puede usar lo publica para transferirlo (endoso) a un comprador, recuperando parte del dinero. El comprador consigue vuelos de último minuto con descuento. La plataforma retiene el pago (estilo escrow) hasta que se confirma el traspaso ante la aerolínea.

Diferenciadores de diseño obligatorios: nada de clichés de "startup de viajes" (sin íconos de avión de stock ni gradientes azul-cielo genéricos), estética cercana a fintech moderna, mobile-first, para un público peruano 20-45 años.

---

## 2. Sistema de diseño

### 2.1 Tokens de color (`src/styles.css`)

| Token | Valor | Uso |
|---|---|---|
| `--color-primary-token` | `#FF5B49` (naranja/coral) | Acción principal, precios, alertas de error visual, marca |
| `--color-secondary-token` | `#00C2A8` (teal) | Éxito, confirmaciones, estados positivos, badges de descuento |
| `--color-warning-token` | `#FFC93C` (amarillo) | Última llamada, advertencias |
| `--color-accent-token` | `#7C5CFC` (morado) | Acento secundario — **evitado** como color de hover/focus por defecto en menús (ver 2.3) |
| `--destructive` | `#DC2626` (rojo) | Errores de validación reales (ej. precio fuera de rango) |
| `--surface-2` | `#F7F7F9` (gris muy suave) | Fondo global del sitio (`body`), inputs, hover suave — **no** el mismo token que `--color-background` |

**Decisión clave:** el fondo del `body` usa `--surface-2` (gris suave) mientras que las tarjetas y el buscador usan blanco puro, para que haya contraste real entre contenido y fondo. Esto es intencionalmente distinto del token `--color-background` (blanco), que sigue usándose dentro de inputs/selects para que floten sobre las tarjetas blancas.

**Efecto secundario documentado:** al cambiar el fondo global a gris, cualquier elemento que use `bg-gray-100` como "inactivo" (ej. bullets del stepper de Publicar pasaje) se volvía casi invisible por falta de contraste. Se corrigió a `bg-white` + borde sutil donde aplicaba.

### 2.2 Corner radius — convención homologada

Todos los popups/overlays comparten el mismo lenguaje visual:
- **Contenedores** (`DropdownMenuContent`, `PopoverContent`, `DialogContent`): `rounded-2xl` (o `rounded-[2rem]` en Dialog, que es más grande por ser modal de página completa)
- **Items internos** (`DropdownMenuItem`, `DropdownMenuRadioItem`, etc.): `rounded-xl`
- Estos son cambios a nivel de **componente base** (`src/components/ui/dropdown-menu.tsx`, `popover.tsx`, `dialog.tsx`), por lo que se propagan automáticamente a todos los usos (campanita de notificaciones, menú de avatar, "Más filtros", "Ordenar", "Compartir", modal de reseñas, modal de pago).

### 2.3 Bug de contraste en hover — patrón recurrente y su fix

**Causa raíz:** los componentes base de Radix/shadcn (`DropdownMenuItem`, `DropdownMenuRadioItem`) usan `focus:bg-accent` por defecto, y `--accent` está mapeado a `--color-accent-token` (morado `#7C5CFC`). Esto generaba hovers morados que rompían la consistencia de marca (naranja/teal) y a veces tenían mal contraste con el texto.

**Fix aplicado en cada instancia:** override explícito con `!important` de Tailwind v4 (sufijo `!`):
```
className="focus:bg-surface-2! focus:text-inherit!"
```
Aplicado en: dropdown de notificaciones, menú de avatar, dropdown "Ordenar" en Explorar vuelos.

**Por qué `!important` y no solo agregar la clase:** Tailwind resuelve conflictos de clases con la misma especificidad por orden de aparición en la hoja de estilos compilada, **no** por el orden en el string de `className`. Sin `!`, la clase base (`focus:bg-accent`) a veces ganaba igual. Este mismo patrón de bug (y el mismo fix) apareció más de una vez durante el proyecto — es la solución estándar cuando se necesita pisar un estilo de un componente base de shadcn.

### 2.4 Otros ajustes de diseño notables

- **Chevron de los `<select>` nativos**: el navegador ignora `padding-right` para posicionar la flecha nativa. Se reemplazó por `appearance-none` + ícono `ChevronDown` de lucide posicionado manualmente, para poder controlar el espacio (12px, igual al padding izquierdo).
- **Línea punteada partida por el ícono del avión** (detalle de vuelo): en vez de un ícono absolute-positioned sobre una línea continua, se usan dos segmentos de línea (`flex-1` cada uno) con el ícono como elemento normal del flujo entre ambos — así la línea se corta visualmente en vez de pasar "por debajo" del ícono.
- **Botón de intercambiar Origen/Destino**: se alinea verticalmente replicando la altura del label invisible + el alto real del input (en vez de posicionamiento absoluto con coordenadas estimadas a ojo), para que quede centrado sin importar el contenido.
- **`Countdown` con variante `size="lg"`**: el banner de "última llamada" en el detalle de vuelo tenía doble pastilla anidada (dos animaciones `pulse` compitiendo — una en el wrapper, otra en el componente). Se resolvió agregando `size?: "sm" | "lg"` al propio componente `Countdown` (fondo `--color-ink`, punto pulsante en `--color-warning-token`, texto más grande) en vez de envolverlo en un segundo contenedor con estilos propios — un solo elemento, una sola animación.

---

## 3. Modelo de datos y lógica de negocio (`src/lib/mock-data.ts`, `src/lib/flight-utils.ts`)

### 3.1 Estados de un vuelo (`FlightStatus`)
`active` → `last_call` (<24h, si el vendedor lo permite) → `expired` (oculto siempre). Un vuelo nunca queda en un estado "pendiente" ambiguo — o está disponible o no se muestra.

### 3.2 Ida y vuelta (`tipoBoleto`, `tramoAVender`)
Un boleto puede ser `solo_ida` o `ida_y_vuelta`. Cuando es ida y vuelta, el vendedor decide **qué tramo(s) vende** en cada oferta (`tramoAVender: "ida" | "regreso" | "ambos"`) — una sola oferta, para un solo comprador, nunca se vende el mismo tramo dos veces.

- `tramoVigente(flight)`: resuelve qué tramo gobierna el estado/countdown de la oferta (el de ida por defecto, salvo que se venda solo el regreso).
- Cuando `tramoAVender === "ambos"`, el detalle del vuelo muestra **dos bloques completos** ("Ida" y "Vuelta"), cada uno con su propia ruta, fecha, hora, equipaje, asiento y "Ruta: Directo" — no se asume que ambos tramos comparten los mismos datos.

### 3.3 Asiento por tramo (cambio de modelo de datos)
**Antes:** `Flight.asiento: Asiento` (un solo asiento para todo el boleto).
**Ahora:** `asientoIda: Asiento | null` y `asientoRegreso: Asiento | null` — independientes, porque el vendedor puede haber elegido filas distintas en ida y vuelta (o ninguna, si ese tramo no se vende en la oferta).

- `asientoVigente(flight)`: helper que resuelve "el asiento principal" para contextos que solo necesitan un valor (tarjeta compacta, filtro de asiento, badge "Ventana confirmada" en la vista general) — replica la misma resolución que `tramoVigente`.
- El formulario de Publicar pasaje (`publish.tsx`) pide "Asiento de ida" y "Asiento de vuelta" por separado cuando corresponde, con un componente `AsientoFields` reutilizable.
- **Regla de negocio del campo Asiento:** solo la categoría "ventana" con asiento seleccionado obtiene el badge "Ventana confirmada" (garantía real de marketplace). Categorías "medio"/"pasillo" seleccionadas se muestran tal cual (son datos reales reportados por el vendedor, no se degradan a "aleatorio") — solo `asiento.tipo === "aleatorio"` muestra "Asignación aleatoria".

### 3.4 Cargo de aerolínea por endoso (modelo híbrido, Ley N° 32325)
- **Estimado** (`cargoAerolineaEstimado`): privado, opcional, ingresado por el vendedor al publicar, sin evidencia requerida. Solo se usa para calcular el neto estimado — el comprador nunca lo ve.
- **Confirmado** (`cargoAerolineaConfirmado`, a nivel de `Transaction`, no de `Flight`): solo existe post-compra, requiere evidencia (`evidenciaUrl`) y pasa por `estadoVerificacion` (`no_aplica` → `pendiente_revision` → `aceptado`/`rechazado`).
- **Umbral de revisión manual** (`REVISION_MANUAL_UMBRAL = 0.5`): si el cargo confirmado supera el 50% del precio de venta, requiere aprobación manual explícita aunque tenga evidencia — no se acepta automáticamente.
- **Neto nunca negativo** (`montoNetoFinal`, `comisionEfectiva`): la comisión de la plataforma se reduce (nunca el cargo de aerolínea) para que el vendedor nunca reciba un neto negativo.

### 3.5 Tope de precio de reventa (`publish.tsx`)
El precio de reventa debe ser **estrictamente menor** al precio original (nunca igual ni mayor — este no es un marketplace de reventa a la par), y no puede ser menor al **10% del original** (evita publicaciones irrisorias). Bloqueo duro: el input se marca en rojo, aparece el mensaje de error, y el botón "Continuar" queda deshabilitado hasta corregir. Estados del input: neutro (sin tocar) → verde (`--color-secondary-token`, válido) → rojo (`--destructive`, fuera de rango).

### 3.6 Chat interno y datos de endoso
- Chat ligado a la transacción específica — **nunca** WhatsApp ni se expone el teléfono real de nadie.
- `datosCompradorEndoso`: formulario estructurado (nombres, apellidos, tipo y número de documento) que el comprador llena para el trámite de endoso — nunca se pide por chat en texto libre. Solo lo ve el vendedor de esa transacción específica.

### 3.7 Estado de la transacción (`Transaction.state`) — máquina de estados funcional
`pago_retenido` → `vendedor_inicia` → `confirmado` → `liberado`. Antes de esta sesión, este timeline era **puramente decorativo** (ningún botón lo hacía avanzar). Se agregaron las 3 transiciones reales, todas del lado del vendedor:
1. **"Iniciar trámite con la aerolínea"** — visible cuando el comprador ya envió sus datos de endoso.
2. **"Confirmar traspaso"** — visible en estado `vendedor_inicia`.
3. **"Liberar pago retenido"** — visible en estado `confirmado`, muestra el neto final antes de liberar.

La transacción demo `t-102` (JetSmart JA411) se dejó pre-configurada como "happy path" completo: comprador ya envió sus datos, listo para caminar las 3 transiciones en una demo en vivo.

**Estado adicional `en_disputa` (ver 4.11):** no forma parte del timeline lineal — es un estado de interrupción que se puede alcanzar desde cualquier punto antes de `liberado`/`reembolsado`, vía "Reportar problema". Se guarda `estadoAnteriorDisputa` al entrar en disputa para poder congelar el timeline visual en el paso correcto (en vez de perder el progreso mostrado), igual que `reembolsado` ya era un estado terminal fuera del `stateOrder` principal.

---

## 4. Flujos y features construidos en esta sesión

### 4.1 Explorar vuelos — rediseño del buscador
- Reemplazo del toggle "fecha fija / ofertas disponibles" por presets de rango (`semana`, `quince`, `mes`, `fecha`) + selector de fecha específica que **reemplaza en el mismo slot** al selector de presets (sin fila extra), con un link "Cambiar" para volver.
- Filtros secundarios (Aerolínea, Asiento, Precio) agrupados en un Popover "Más filtros" con slider de doble manija (parche manual a `Slider` de shadcn, que solo soportaba un thumb).
- "Ordenar" como `DropdownMenu` con ícono, reemplazando el label "Filtros".
- Botón "Buscar" eliminado — todo el filtrado es en vivo (sin fetch a servidor), consistente con patrones de faceted search (Amazon/Mercado Libre) en vez de patrones de búsqueda con fetch pesado (aerolíneas).
- Botón de intercambiar Origen ⇄ Destino.
- Banner con degradado de marca (`primary-token` → `accent-token`) envolviendo título + buscador, inspirado en referencias de aerolíneas pero sin imágenes externas — solo tokens del sistema.
- **Bug real encontrado y corregido:** al elegir "Ingresar fecha" sin haber escrito una fecha aún, el filtro de fecha quedaba desactivado por completo y mostraba *todas* las ofertas activas sin restricción. Ahora, sin fecha seleccionada, no se muestra ningún resultado (con un estado vacío motivador en vez del genérico "Sin resultados").

### 4.2 Alertas de búsqueda + notificaciones
- `src/lib/alerts-context.tsx`: contexto global (`AlertsProvider`/`useAlerts`) con alertas de dos tipos: `busqueda` (creadas desde el CTA "Avísame cuando aparezcan pasajes" en Explorar) y `match`/`estado` (cambios de estado de transacciones, simulados).
- El CTA de alerta solo aparece cuando origen **y** destino están completos (no tiene sentido alertar sobre "cualquier ruta"). Usa el email del usuario logueado directamente (sin pedirlo de nuevo).
- Campanita de notificaciones en el header con dropdown y badge de no leídas.
- Página independiente `/alertas` (con su propio link "Ver todas" desde la campanita) — separada de "Mis operaciones" porque son conceptualmente distintas (alertas de búsqueda vs. transacciones reales).
- Simulación de demo: 4 segundos después de crear una alerta, llega automáticamente una notificación "¡Apareció un pasaje!" con datos de un vuelo real que calza con la búsqueda.

### 4.3 Viajes guardados (favoritos, patrón Airbnb)
- `src/lib/saved-context.tsx`: contexto global (`SavedProvider`/`useSaved`) con corazón en `FlightCard` y en el detalle del vuelo.
- Sección "Viajes guardados" dentro de `/profile`, con pasajes que ya no están disponibles marcados como "Ya no disponible" (sin desaparecer solos — se quitan manualmente).
- Toast al guardar/quitar: "Guardado en tus favoritos" con link de texto discreto "Ver guardados" (via `toast.custom()`, no el `action` por defecto de sonner que renderiza un botón grande) que navega a `/profile?tab=guardados` y abre esa pestaña directamente. Al quitar: toast simple "Quitado de guardados", sin link.

### 4.4 Header y navegación
- Nav reducido a "Inicio" + "Explorar vuelos" + "Cómo funciona" (landing informativa).
- Resto de acciones (Publicar pasaje, Mis operaciones, Mi perfil, Cerrar sesión) movidas a un dropdown desde el avatar — "Cerrar sesión" es solo visual (toast, no hay auth real en este prototipo).
- Menú móvil unificado con la misma jerarquía (landing arriba, cuenta abajo).

### 4.5 Perfil (`/profile`)
- Segmented control (mismo patrón visual que "Mis operaciones") para Verificación / Preferencias / Viajes guardados, en vez de 3 secciones apiladas.
- Reputación (comprador/vendedor) integrada como badges junto al nombre, con botón "Ver reseñas" que abre un modal — en vez de dos tarjetas grandes con citas permanentemente visibles en la página.

### 4.6 Publicar pasaje (`publish.tsx`)
- "Autocompletar con IA": simulación (no hay integración real con un modelo de visión) de subir un voucher/captura de reserva → loading "Analizando con IA..." (~1.8s) → autocompleta aerolínea, vuelo, ruta, fecha, horarios, equipaje y nombre del pasajero. Email/teléfono se dejan vacíos a propósito porque no vienen impresos en un voucher real.
- Stepper de 4 pasos (Vuelo, Reserva, Precio, Listo).

### 4.7 Detalle de vuelo (`flight.$id.tsx`)
- Botón "Guardar" + "Compartir" (Popover con link + botón copiar, y accesos a WhatsApp/Facebook/Instagram — Instagram copia el link y explica que no soporta compartir prellenado desde web, en vez de fingir una integración que no existe).
- Modal de selección de método de pago (Yape/Plin, Tarjeta, Transferencia bancaria) al presionar "Pagar y retener dinero" — con estado de "Procesando pago..." simulado (~1.5s) antes de avanzar al flujo de escrow existente. Los pasos siguientes del escrow (Confirmar endoso iniciado → Confirmar boleto recibido → Traspaso exitoso) no pasan por el modal, solo el pago inicial.

### 4.8 Mis operaciones (`dashboard.tsx`)
- Pestaña "Todas" eliminada (mezclar compras y ventas dificultaba saber en qué rol se actuó en cada tarjeta). Selector reducido a Comprador/Vendedor, abriendo por defecto en el rol con más operaciones pendientes de acción.
- Los totales superiores (Retenido en escrow, Liberado, Transacciones) se mantienen como resumen global fijo, sin cambiar según la pestaña activa.

### 4.9 Nota del vendedor y limpieza de la pantalla de éxito al publicar (`publish.tsx`)
- `Flight.note` ya existía en el modelo de datos pero no tenía ninguna UI para completarlo. Se agregó como campo real: textarea "Nota para compradores (opcional)" (280 caracteres) en el paso 4 ("Confirmar publicación"), justo antes del resumen.
- La pantalla de éxito mostraba `Vistas: 0` e `Interesados: 0` — cifras hardcodeadas sin ninguna relación con los datos reales del vuelo (que sí existen en `mock-data.ts`, pero se alimentan después, con el vuelo ya expuesto al público). Decisión: **no mostrar esas estadísticas en absoluto en esta pantalla** — se reemplazaron por un solo bloque con el precio publicado y un mensaje que dirige a "Mis operaciones → Publicados" para verlas en contexto real. El botón final ahora navega ahí con `search={{ vista: "publicados" }}`.

### 4.10 Vista "Publicados" del vendedor — vistas, interesados y guardados (`dashboard.tsx`)
- Gap detectado: el vendedor no tenía **ninguna** visibilidad de sus propias publicaciones activas sin comprador (`Flight` sin `Transaction` asociada) — ni siquiera existía un vuelo semilla que perteneciera al usuario actual (`currentUser`/`u-me`). Se agregó `sellers` entry para `u-me` y dos `Flight` nuevos (`f-011`, `f-012`) sin transacción, para poder demostrar el flujo.
- Dentro de "Como vendedor" se agregó un sub-filtro tipo chips (`En proceso` / `Publicados` / `Retirados`, este último solo visible si hay algo retirado) — separado del selector Comprador/Vendedor por `mt-6` (16px) para que no se lean como un solo grupo.
- Cada card de "Publicados" muestra 3 métricas reales: **Vistas**, **Interesados** y **Guardados** (`Flight.savedCount`, campo nuevo — señal de intención más fuerte que una vista simple, aunque igual de "seedeada"/no derivada de agregación real entre usuarios, consistente con `views`/`interested`).
- **"Retirar publicación" (danger zone):** el vendedor puede despublicar una oferta solo si **todavía no tiene comprador** (una vez existe `Transaction`, retirarla requeriría un flujo de cancelación/reembolso distinto, fuera de alcance). Acción vía modal de confirmación que explica la implicancia (deja de ser visible, quien la tenía guardada ya no podrá completarla) — al confirmar, el vuelo se oculta del marketplace pero **no se elimina**: pasa a la pestaña "Retirados" (historial de solo lectura), vía un array `withdrawnIds` en estado local (sin persistencia real, como el resto del prototipo).

### 4.11 "Reportar problema" — disputas con pausa de escrow (`dashboard.tsx`, `mock-data.ts`)
- El botón "Reportar problema" existía en la card de transacción desde antes, pero no tenía ningún `onClick` — no hacía nada.
- Se agregó el estado `Transaction.state === "en_disputa"` (nuevo valor en el union type), alcanzable desde cualquier estado antes de `liberado`/`reembolsado`, vía un modal con **categorías predefinidas y distintas según el rol** (`MOTIVOS_REPORTE`): comprador ve "El vendedor no responde", "El vuelo/asiento no coincide con lo publicado", "Boleto inválido o rechazado por la aerolínea", "Sospecho de fraude", "Otro"; vendedor ve el set espejo ("El comprador no responde", "Datos de endoso incorrectos...", etc.) + un textarea opcional de detalle.
- Al reportar: el pago retenido queda **en pausa** — `puedeGestionar` (que controla "Liberar pago retenido", "Iniciar trámite", "Confirmar traspaso", reportar cargo de aerolínea) ahora también excluye `en_disputa`, así que ninguna acción del flujo normal queda disponible mientras el caso está abierto.
- **Copy deliberadamente no técnico** (decisión de esta sesión, tras descartar "En disputa" por sonar legal/alarmante): el estado se muestra como **"Pago en pausa"** (label corto, en el resumen de la card) y **"Soporte está revisando · pago en pausa"** (badge largo, en el lugar donde antes estaba el botón) — tono tranquilizador, deja explícito que el dinero está protegido, y enfoca el mensaje en que el equipo ya está atendiendo el caso en vez de en el conflicto en sí.
- Simulación sin backend: solo toast de confirmación + cambio de estado local (`reporte: { motivo, detalle, createdAt }` guardado en la transacción) — no hay bandeja de soporte ni resolución real del caso todavía (ver Roadmap).

### 4.12 Back-navigation contextual extendida a "Publicados"
- El patrón ya existente (`flight.$id.tsx` vuelve a "Mis operaciones" en vez de a `/explore` cuando `search.from === "dashboard"`, reposicionando y resaltando la card de la transacción vía `search.tx`) se extendió con un nuevo parámetro `search.vista`. Al entrar al detalle desde la pestaña "Publicados" (`search={{ from: "dashboard", vista: "publicados" }}`), el botón "Volver" regresa directo a esa pestaña — sin resaltado ni scroll (a diferencia del caso de `tx`), porque no hay una card específica de transacción que resaltar.

---

## 5. Limitaciones conocidas del prototipo (no resueltas a propósito)

- **Sin backend real**: todo el estado vive en `useState`/Context de React — se pierde al recargar la página. Esto aplica a transacciones, alertas, guardados, chat, etc.
- **Autocompletar con IA es simulado**: no hay llamada real a un modelo de visión. Implementarlo de verdad requeriría backend + manejo de API key + upload de archivos.
- **Sin pasarela de pago real**: el modal de método de pago es una simulación visual completa, no procesa pagos.
- **Equipaje y asiento no son 100% por tramo en el modelo de datos**: `baggage` sigue siendo un solo campo por boleto (no por tramo), aunque `asientoIda`/`asientoRegreso` sí se separaron. Si en el futuro se necesita equipaje distinto por tramo, requiere el mismo tratamiento que se le dio al asiento.
- **"Cerrar sesión" no tiene auth real** — es un toast, no una acción funcional.

---

## 6. Archivos clave por área

| Área | Archivo |
|---|---|
| Modelo de datos y mocks | `src/lib/mock-data.ts` |
| Lógica de negocio pura (helpers) | `src/lib/flight-utils.ts` |
| Estado global de alertas | `src/lib/alerts-context.tsx` |
| Estado global de guardados | `src/lib/saved-context.tsx` |
| Explorar vuelos | `src/routes/explore.tsx` |
| Detalle de vuelo | `src/routes/flight.$id.tsx` |
| Publicar pasaje | `src/routes/publish.tsx` |
| Mis operaciones | `src/routes/dashboard.tsx` |
| Perfil | `src/routes/profile.tsx` |
| Alertas (página) | `src/routes/alertas.tsx` |
| Header / nav | `src/components/site/SiteHeader.tsx` |
| Tarjeta de vuelo | `src/components/site/FlightCard.tsx` |
| Tokens de diseño | `src/styles.css` |
| Componentes base (Dialog, Dropdown, Popover, Slider) | `src/components/ui/` |
