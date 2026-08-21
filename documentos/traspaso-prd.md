# Traspaso — PRD (Product Requirements Document)

**Estado:** Prototipo funcional con **backend real en Supabase** (Postgres + Auth + Storage + Realtime) — ya no es una simulación en memoria
**Última actualización:** agosto 2026
**Propósito de este documento:** que cualquier persona o agente de IA (Antigravity, Claude Code, etc.) pueda retomar el proyecto sin perder contexto, aunque haya pasado tiempo sin tocarlo.

---

## 1. Resumen ejecutivo

Traspaso es un marketplace P2P peruano donde usuarios que no van a usar su pasaje aéreo nacional lo endosan y venden con descuento a otros usuarios. La plataforma verifica el traspaso, retiene el pago en garantía (escrow) hasta confirmarlo, y cobra una comisión variable al vendedor. Alcance: solo vuelos nacionales, en LATAM, Sky Airline y JetSmart.

El prototipo cubre hoy el recorrido completo de punta a punta (registro/login real, explorar, publicar con revisión manual, comprar, gestionar el trámite de endoso con chat y notificaciones reales, liberar el pago) sobre un **backend real de Supabase**: autenticación, base de datos con RLS, Storage para adjuntos/vouchers/evidencia, y suscripciones realtime para chat y notificaciones. Lo que sigue siendo simulado es la pasarela de pago (no se procesa dinero real) y el autocompletado por IA al publicar (ver sección 8, Limitaciones conocidas).

Proyecto con doble propósito: negocio real a validar, y pieza de portafolio de producto/diseño.

## 2. Stack técnico y entorno de desarrollo

- **Frontend:** React + Vite + TanStack Router + TanStack Query + Tailwind CSS (v4, dado el uso de sufijo `!` para overrides — ver sección 5)
- **Backend:** Supabase — Postgres (con Row Level Security en todas las tablas), Supabase Auth (email/password), Supabase Storage (buckets públicos para adjuntos), Supabase Realtime (chat y notificaciones vía suscripción a cambios en tablas)
- **Entorno de desarrollo:** Claude Code / Google Antigravity operando directo sobre el repo; cambios de esquema/RLS se entregan como SQL para que el fundador los ejecute manualmente en el SQL Editor de Supabase (el agente no tiene acceso directo a la base de datos)
- **Origen del prototipo:** primera versión visual generada con un prompt para Lovable (UI con datos mock); desarrollo posterior en Antigravity (rediseño visual + evolución funcional sobre mocks); migración a backend real hecha en sesiones posteriores con Claude Code.
- **Componentes base:** Radix/shadcn (`Dialog`, `DropdownMenu`, `Popover`, `Slider`, etc.), en `src/components/ui/`.

### Estructura de archivos

| Área | Archivo |
|---|---|
| Cliente de Supabase | `src/lib/supabase.ts` |
| Autenticación / sesión / perfil | `src/lib/auth-context.tsx` |
| Modelo de datos y tipos compartidos (ya no contiene transacciones/vuelos mock activos) | `src/lib/mock-data.ts` |
| Lógica de negocio pura (helpers de precio, fecha, tramo, asiento) | `src/lib/flight-utils.ts` |
| Estado global de alertas de ruta + notificaciones reales | `src/lib/alerts-context.tsx` |
| Estado global de guardados (favoritos) | `src/lib/saved-context.tsx` |
| Estado global de método de pago/cobro guardado | `src/lib/payment-context.tsx` |
| Prefijos de teléfono por país (`splitPhone`/`joinPhone`) | `src/lib/phone-prefixes.ts` |
| Servicios Supabase — vuelos, publicación, revisión, aprobar/rechazar | `src/lib/services/flights.ts` |
| Servicios Supabase — transacciones, escrow, disputas, cargo de aerolínea, confirmación del comprador | `src/lib/services/transactions.ts` |
| Servicios Supabase — chat interno por transacción + realtime | `src/lib/services/chat.ts` |
| Servicios Supabase — notificaciones + realtime | `src/lib/services/notifications.ts` |
| Servicios Supabase — vuelos/alertas de ruta guardados | `src/lib/services/route-alerts.ts` |
| Servicios Supabase — favoritos | `src/lib/services/saved-flights.ts` |
| Servicios Supabase — métodos de pago/cobro guardados | `src/lib/services/payment-methods.ts` |
| Servicios Supabase — edición de perfil (teléfono, etc.) | `src/lib/services/profile.ts` |
| Login / registro | `src/routes/login.tsx` |
| Explorar vuelos | `src/routes/explore.tsx` |
| Detalle de vuelo | `src/routes/flight.$id.tsx` |
| Publicar pasaje (con revisión manual) | `src/routes/publish.tsx` |
| Editar publicación existente | `src/routes/edit-flight.$id.tsx` |
| Mis operaciones (dashboard comprador/vendedor) | `src/routes/dashboard.tsx` |
| Perfil | `src/routes/profile.tsx` |
| Alertas (página) | `src/routes/alertas.tsx` |
| Panel de administración — revisión de publicaciones y cargos de aerolínea | `src/routes/admin.revisiones.tsx` |
| Header / nav | `src/components/site/SiteHeader.tsx` |
| Tarjeta de vuelo | `src/components/site/FlightCard.tsx` |
| Input de teléfono con selector de país | `src/components/site/PhoneInput.tsx` |
| Campos compartidos del formulario de publicar/editar vuelo | `src/components/site/PublishFormFields.tsx` |
| Tokens de diseño | `src/styles.css` |
| Componentes base (Dialog, Dropdown, Popover, Slider) | `src/components/ui/` |

## 3. Problema y contexto de mercado

Ver Documento Maestro para la versión comercial. Puntos técnicos relevantes:

- **Competencia directa identificada:** Rename Travel (Perú), modelo similar, comisión plana del 15%. Vacíos detectados: no descuenta el cargo de aerolínea en su cálculo de neto (solo lo advierte en texto), permite fechas/inventario potencialmente vencido, buscador rígido tipo Google Flights (mal ajuste para inventario finito de terceros).
- **Marco legal:**
  - Ley 29571 (Código de Protección y Defensa del Consumidor) — base histórica del derecho de endoso.
  - Ley N° 32325 (mayo 2025) — refuerza el endoso gratuito de pasajes nacionales, solicitado con ≥24h de anticipación, sin cambio de condiciones del vuelo.
  - **Ambigüedad legal sin resolver:** fuentes serias discrepan sobre si la gratuidad de la Ley 32325 cubre los "gastos administrativos" del trámite. Un estudio de abogados corporativo (Olaechea) sostiene que estos gastos siguen siendo cobrables bajo el Código de Protección al Consumidor; otra fuente sostiene que no se puede cobrar nada, ni siquiera la emisión del nuevo boleto. En la práctica, Rename Travel opera asumiendo que sí existe un cargo real.
  - Precedente Indecopi vs. Avianca (confirmado en Corte Suprema): reconoce el derecho a endosar los tramos **no usados** de un pasaje ida y vuelta, no solo el boleto completo.
  - Cargos de aerolínea documentados (pueden estar desactualizados respecto a la Ley 32325, no verificados en la práctica actual): Sky Airline ~USD 15 por segmento en endosos DOMPE; JetSmart cargo variable no publicado; LATAM sin cargo identificado.

## 4. Usuarios objetivo

Ver Documento Maestro. **Autenticación real vía Supabase Auth** (email/password) — "Cerrar sesión" ya no es un toast visual, es una sesión real que se cierra de verdad (ver sección 6).

## 5. Sistema de diseño

### 5.1 Tokens de color (`src/styles.css`)

| Token | Valor | Uso |
|---|---|---|
| `--color-primary-token` | `#FF5B49` (naranja/coral) | Acción principal, precios, alertas de error visual, marca |
| `--color-secondary-token` | `#00C2A8` (teal) | Éxito, confirmaciones, estados positivos, badges de descuento |
| `--color-warning-token` | `#FFC93C` (amarillo) | Última llamada, advertencias |
| `--color-accent-token` | `#7C5CFC` (morado) | Acento secundario — evitado como color de hover/focus por defecto en menús (ver 5.3) |
| `--destructive` | `#DC2626` (rojo) | Errores de validación reales (ej. precio fuera de rango) |
| `--surface-2` | `#F7F7F9` (gris muy suave) | Fondo global del sitio (`body`), inputs, hover suave — no el mismo token que `--color-background` |

**Decisión clave:** el fondo del `body` usa `--surface-2` (gris suave) mientras que tarjetas y buscador usan blanco puro, para contraste real entre contenido y fondo.

### 5.2 Corner radius — convención homologada

- **Contenedores** (`DropdownMenuContent`, `PopoverContent`, `DialogContent`): `rounded-2xl` (o `rounded-[2rem]` en Dialog, modal de página completa)
- **Items internos** (`DropdownMenuItem`, `DropdownMenuRadioItem`, etc.): `rounded-xl`

### 5.3 Bug de contraste en hover — patrón recurrente y su fix

**Causa raíz:** componentes base de Radix/shadcn usan `focus:bg-accent` por defecto, mapeado a `--color-accent-token` (morado). Generaba hovers morados que rompían la consistencia de marca.

**Fix estándar:**
```
className="focus:bg-surface-2! focus:text-inherit!"
```
Necesario usar `!important` (sufijo `!` de Tailwind v4) porque Tailwind resuelve conflictos por orden de aparición en la hoja compilada, no por orden en el string de `className`.

### 5.4 Bug de centrado de Dialog por conflicto de `tailwind-merge`

**Causa raíz:** `DialogContent` base usa `fixed` para centrarse en viewport. Al agregar `relative` como clase adicional (para poder posicionar hijos `absolute` dentro, ej. el confeti de la pantalla "¡Pago liberado!"), `cn()`/`tailwind-merge` trató `relative` y `fixed` como el mismo grupo de conflicto de `position` y dejó ganar a `relative`, rompiendo el centrado (el modal aparecía pegado abajo, casi oculto).

**Fix:** no agregar `relative` al `DialogContent` — el ancestro `fixed` que ya trae la clase base es suficiente contenedor para posicionar hijos `absolute` dentro.

### 5.5 Input numérico controlado — bug del cero fantasma y su fix estándar

**Causa raíz:** un `<input type="number" value={x}>` muestra literalmente `"0"` en el DOM cuando `x === 0`. Al escribir sobre ese campo sin que el usuario lo borre antes, el navegador nunca muestra un campo vacío de verdad, así que el primer dígito tecleado se concatena después del cero visible (`"0"` + `"9"` → el usuario ve `09` un instante, y dependiendo del manejo, puede terminar guardando `90` en vez de `9`).

**Fix estándar** (aplicado en: precio de reventa y precio original al publicar/editar, monto del cargo confirmado en "Mis operaciones", número de documento del formulario de endoso):
```tsx
value={x === 0 ? "" : x}
onChange={(e) => setX(e.target.value === "" ? 0 : Number(e.target.value))}
```
**Este es el patrón a replicar** ante cualquier input numérico controlado nuevo que pueda arrancar o pasar por el valor `0`.

### 5.6 Otros ajustes de diseño notables

- **Chevron de `<select>` nativos:** reemplazado por `appearance-none` + ícono `ChevronDown` de lucide posicionado manualmente.
- **Línea punteada partida por el ícono del avión** (detalle de vuelo): dos segmentos de línea (`flex-1` cada uno) con el ícono como elemento normal del flujo entre ambos.
- **Botón de intercambiar Origen/Destino:** alineado replicando la altura del label invisible + alto real del input.
- **Stepper de "Publicar pasaje" clickeable:** tanto el número como el label son clickeables, pero solo hasta el paso máximo ya visitado (`maxStepReached`) — no permite saltar hacia adelante sin completar los pasos previos.
- **Confeti sutil en "¡Pago liberado!":** animación ligera con `gsap` (dependencia ya existente en el proyecto, sin librería nueva) sobre divs absolutos dentro del modal de éxito — ver 5.4 para el bug que causó al implementarlo.

### 5.7 Dirección visual general

Identidad de consumo masivo (sectores B y C), inspirada en Airbnb/inDrive. Explícitamente evita clichés de "startup de viajes" (sin íconos de avión de stock, sin gradientes azul-cielo genéricos). Mobile-first.

## 6. Módulos funcionales — estado real

| Módulo | Descripción | Estado |
|---|---|---|
| **Autenticación real** | Registro/login con Supabase Auth (email/password), apellido dividido en paterno/materno, sesión persistente real, "Cerrar sesión" funcional | **Implementado** |
| Búsqueda dual → presets de rango | Presets (`semana`, `quince`, `mes`, `fecha`) + filtrado en vivo | **Implementado** |
| Reglas de vigencia (`active`/`last_call`/`expired`) | Ver sección 7.1 | **Implementado** |
| Flujo de pago retenido en garantía (escrow) | Máquina de estados real, persistida en Postgres | **Implementado** |
| **Backend real de vuelos y transacciones** | Tablas `flights` y `transactions` en Postgres con RLS; ya no hay estado en memoria que se pierda al recargar | **Implementado** |
| Publicar pasaje | Formulario de 3 pasos (Vuelo, Precio, Listo) — ver 6.1 sobre por qué bajó de 4 a 3 | **Implementado** |
| **Revisión manual de publicaciones antes de salir al marketplace** | Estado `pendiente_revision` → panel admin aprueba/rechaza (ver sección 7.9) | **Implementado** |
| **Panel de administración** (`/admin/revisiones`) | Cola de publicaciones pendientes + cola de cargos de aerolínea pendientes de revisión, gateado por `profiles.is_admin` | **Implementado** |
| Editar publicación existente | Reutiliza los mismos campos que publicar (`PublishFormFields.tsx`) | **Implementado** |
| Tope de precio de reventa | Estrictamente menor al original, no menor al 10% | **Implementado** |
| Cálculo de cargo de aerolínea — estimado + confirmado | Modelo híbrido completo (ver sección 7.5) | **Implementado** |
| **Verificación real del cargo de aerolínea confirmado** | Vendedor sube evidencia real a Storage (`cargo-evidence`), admin acepta/rechaza desde el panel, con notificación al vendedor del resultado | **Implementado** |
| Regla de piso en S/0 y comisión efectiva compartida | La comisión de la plataforma se reduce, nunca el cargo de aerolínea | **Implementado** |
| Regla de revisión manual por umbral (>50%) | `REVISION_MANUAL_UMBRAL = 0.5` | **Implementado** |
| Datos del comprador para el endoso (formulario estructurado) | Visible solo al vendedor de esa transacción | **Implementado** |
| **Chat interno real por transacción** | Persistido en tabla `chat_messages`, con adjuntos reales a Storage (`chat-attachments`), suscripción realtime (llega sin recargar), auto-scroll al último mensaje, preview de imagen/PDF en modal | **Implementado** |
| Máquina de estados de transacción | `pago_retenido` → `vendedor_inicia` → `confirmado` → `liberado`, persistida en Postgres | **Implementado** |
| **Gate de confirmación del comprador antes de liberar el pago** | El vendedor no puede liberar el pago hasta que el comprador marque "Todo OK" (ver sección 7.7) | **Implementado** |
| **Reembolso manual ante rechazo de la aerolínea** | Nuevo estado `reembolsado`, marcado manualmente por quien reportó el problema (ver sección 7.8) | **Implementado** |
| Autocompletar con IA al publicar | Simulación de subir voucher → loading (~1.8s) → autocompleta datos (no email/teléfono) | **Simulación visual** — sin integración real de visión por computadora; el mismo archivo subido sirve también como evidencia real para la revisión manual (ver 7.9) |
| **Notificaciones en tiempo real** | Tabla `notifications` + triggers de Postgres (compra confirmada, endoso enviado, cambio de estado, disputa abierta, resultado de cargo de aerolínea) + suscripción realtime + campanita en el header + página `/alertas` | **Implementado** |
| **Alertas de ruta reales** | Tabla `route_alerts`; trigger notifica automáticamente cuando se publica un vuelo nuevo que calza con una alerta guardada | **Implementado** |
| **Viajes guardados reales** | Tabla `saved_flights`; corazón en card y detalle; sección en `/profile`; incrementa/decrementa `flights.saved_count` (fix reciente — antes no se reflejaba en las métricas del vendedor) | **Implementado** |
| Header / navegación | Nav reducido a Inicio/Explorar/Cómo funciona; resto en dropdown de avatar; ícono "Publicar pasaje" es un megáfono; link "Revisiones" visible solo si `profile.is_admin` | **Implementado** |
| Perfil (`/profile`) | Segmented control (Mis datos/Preferencias/Guardados), teléfono editable con selector de país, badges de reputación con etiquetas neutras ("Compras"/"Ventas" en vez de "Compradora"/"Vendedora") | **Implementado** |
| **Métodos de pago/cobro guardados reales** | Tabla `payment_methods`, migrado de `localStorage` | **Implementado** |
| Modal de método de pago | Yape/Plin, Tarjeta, Transferencia — el pago en sí sigue sin pasarela real (ver sección 8) | **Simulación visual del cargo** — la retención en Postgres sí es real |
| Nota del vendedor al publicar | Campo `seller_note`, persistido de verdad (antes se perdía tras publicar) | **Implementado** |
| Vista "Publicados" del vendedor | Chips `En proceso` / `Finalizados` / `Publicados` / `Retirados`; métricas reales (Vistas, Interesados, Guardados) leídas de Postgres | **Implementado** |
| Retirar publicación (danger zone) | Solo para ofertas sin comprador aún; cambia `status` a `cancelled` en Postgres | **Implementado** |
| **Editar y volver a publicar una publicación rechazada** | Estado `rechazado` (distinto de `cancelled`), con motivo + detalle visibles al vendedor, editable y reenviable a revisión | **Implementado** |
| "Reportar problema" / disputas | Modal con categorías predefinidas por rol, pausa el escrow (`state = "disputa"` en BD / `"en_disputa"` en frontend), notificación a la contraparte | **Implementado** — resolución vía reembolso manual (7.8), sin panel de mediación con más opciones todavía |
| **Cards de resumen de "Mis operaciones" (Retenido/Liberado/Transacciones)** | Fix reciente: antes solo sumaban el array mock (vacío), ahora combinan transacciones reales + mock | **Implementado** |
| **Timeline "Protección Escrow" en el detalle del vuelo** | Fix reciente: antes era un contador local falso que no reflejaba nada real; ahora, si quien mira es comprador o vendedor de la transacción real, muestra el estado verdadero; si no, y el vuelo ya no está disponible, muestra un badge simple "Vendido" (ver 7.10) | **Implementado** |
| Honestidad del precio mostrado al comprador | El precio "hero" en card y detalle es siempre el **total a pagar** (precio + comisión), no el precio base solo — ver sección 7.11 | **Implementado** |
| Home — "Disponibles ahora" y "Destino Top" | Migrado de array mock a datos reales de Supabase + lógica de destino top computada | **Implementado** |

### 6.1 Nota sobre el stepper de "Publicar pasaje": de 4 pasos a 3

Originalmente había un paso "Reserva" separado que pedía subir el mismo tipo de comprobante (voucher/captura) que ya se pedía en el paso anterior para el autocompletado por IA. Se fusionó en un solo paso "Vuelo" con un único archivo que sirve para **dos propósitos**: (1) alimentar la simulación de autocompletado, y (2) quedar como evidencia real que revisa el admin al aprobar la publicación (ver 7.9). El comprobante sigue siendo obligatorio.

## 7. Reglas de negocio críticas

### 7.1 Estados de un vuelo (`FlightStatus`)
Enum real en Postgres: `active`, `last_call`, `expired` (nunca se persiste — se computa por fecha), `sold`, `cancelled`, `pendiente_revision`, `rechazado`.

`active` → `last_call` (<24h, si el vendedor lo permite) → `expired` (oculto siempre, calculado client-side, no un valor de BD). Un vuelo recién publicado nace en `pendiente_revision` y no aparece en el marketplace hasta que un admin lo aprueba (pasa a `active`) o lo rechaza (pasa a `rechazado`). `cancelled` es el resultado de que el propio vendedor lo retire ("Retirar publicación"), no de un rechazo de admin — son casos semánticamente distintos y usan enums distintos a propósito.

### 7.2 Ida y vuelta (`tipoBoleto`, `tramoAVender`)
Boleto `solo_ida` o `ida_y_vuelta`. Si es ida y vuelta, el vendedor decide `tramoAVender: "ida" | "regreso" | "ambos"`. `tramoVigente(flight)` resuelve qué tramo gobierna el estado/countdown.

**Fuera de alcance (pendiente de validación legal/operativa):** vender el tramo de ida y el de regreso por separado a dos compradores distintos.

### 7.3 Asiento por tramo
`asientoIda`/`asientoRegreso` independientes. `asientoVigente(flight)` resuelve el asiento principal para contextos que solo necesitan un valor. Solo la categoría "ventana" con asiento **seleccionado** obtiene el badge "Ventana confirmada".

### 7.4 Tope de precio de reventa
Estrictamente menor al precio original, no menor al 10% del original. Bloqueo duro en el formulario, tanto al publicar como al editar.

### 7.5 Cargo de aerolínea por endoso (modelo híbrido, Ley N° 32325)
- **Estimado** (`airline_fee_estimate` en `flights`): privado, opcional, ingresado por el vendedor al publicar, sin evidencia requerida. El comprador nunca lo ve.
- **Confirmado** (`confirmed_airline_fee` en `transactions`, no en `flights`): solo existe post-compra. Requiere evidencia real subida a Storage (`cargo-evidence`), pasa por `cargo_verification_status` (`no_aplica` → `pendiente_revision` → `aceptado`/`rechazado`).
- **Umbral de revisión manual** (`REVISION_MANUAL_UMBRAL = 0.5`): cargo confirmado que supere el 50% del precio de venta nunca se acepta automáticamente — se marca `cargo_manual_review_required = true` y entra a la cola del panel admin.
- **Neto nunca negativo:**
  ```
  comision_efectiva = min(comision_normal, max(0, precio_venta - cargo_aerolinea_confirmado))
  neto_final = max(0, precio_venta - cargo_aerolinea_confirmado - comision_efectiva)
  ```
- **El comprador nunca ve el monto del cargo de aerolínea**, en ningún momento del flujo.
- **Resultado de la revisión se notifica al vendedor** (aceptado/rechazado) vía el sistema de notificaciones real (trigger de Postgres).

### 7.6 Chat interno y datos de endoso
Chat real (tabla `chat_messages`, RLS restringido a comprador/vendedor de esa transacción específica), nunca WhatsApp ni expone el teléfono real. Soporta adjuntos reales (imagen o PDF) a Storage — usado, entre otros casos, para cuando la aerolínea exige una foto del DNI para el endoso (caso real confirmado, no se agregó como campo fijo del formulario porque no todas las aerolíneas lo piden).

`datosCompradorEndoso`: formulario estructurado (nombres, apellido paterno, apellido materno, tipo y número de documento), con validación de longitud exacta según tipo de documento — el botón "Enviar mis datos al vendedor" queda deshabilitado hasta que el número tenga la longitud completa esperada (ver 7.12). Solo lo ve el vendedor de esa transacción.

### 7.7 Estado de la transacción (`Transaction.state`) y el gate de confirmación del comprador
Enum real en Postgres: `pago_retenido`, `vendedor_inicia`, `confirmado`, `liberado`, `disputa`, `reembolsado` (el frontend traduce `disputa` → `en_disputa` al mapear, ver `mapDbTransactionToFrontend`).

Transiciones del lado del vendedor:
1. **"Iniciar trámite con la aerolínea"** — visible cuando el comprador ya envió sus datos de endoso.
2. **"Confirmar traspaso"** — visible en estado `vendedor_inicia`.
3. **"Liberar pago retenido"** — visible en estado `confirmado`, **pero bloqueada hasta que el comprador confirme** (ver siguiente párrafo).

**Gate de confianza (`buyer_confirmed_ok`):** el vendedor no puede liberar el pago retenido hasta que el comprador presione "Todo OK, liberar pago" desde su lado — el comprador es quien revisó que el endoso realmente se completó. Mientras `buyer_confirmed_ok` sea `false`, el vendedor ve un estado de espera ("Esperando confirmación del comprador") en vez del botón de liberar. Al confirmar, se notifica al **vendedor** (no al comprador — es el vendedor quien gana la habilidad de actuar, decisión tomada explícitamente tras una ambigüedad inicial sobre a quién debía llegarle el aviso).

### 7.8 Disputas, estado `disputa` y reembolso manual
Alcanzable desde "Reportar problema", disponible en cualquier estado previo a `liberado`/`reembolsado`. Se guarda `state_before_dispute` para congelar el timeline visual en el paso correcto mientras se resuelve. Ninguna acción de gestión del trámite está disponible mientras está activo.

Categorías de reporte predefinidas y distintas según el rol (`MOTIVOS_REPORTE`): comprador reporta "vendedor no responde", "vuelo/asiento no coincide", "boleto inválido", "sospecho de fraude" u "otro"; vendedor reporta el set espejo. Copy deliberadamente no técnico: **"Pago en pausa"** / **"Soporte está revisando"**.

**Caso de uso real que originó el reembolso:** el comprador ya pagó, pero durante el trámite la aerolínea le informa al vendedor que el cambio de nombre no es posible. Solución implementada: **el vendedor (o quien reportó el problema) marca "Reembolsar" manualmente** desde el panel de la transacción — nuevo estado `reembolsado`, terminal, fuera del `stateOrder` lineal igual que antes lo estaba `en_disputa`. No hay pasarela de reembolso real (es solo el cambio de estado, ya que el dinero nunca salió de una pasarela real — ver sección 8) ni un panel de soporte con más opciones de mediación todavía.

### 7.9 Revisión manual de publicaciones nuevas
Toda publicación nueva nace en `pendiente_revision` — no aparece en el marketplace hasta que un admin la revisa desde `/admin/revisiones` (gateado por `profiles.is_admin`, cuenta administradora actual: `vendedor.prueba@traspaso.pe`).

- **Aprobar** → `status = "active"`.
- **Rechazar** → `status = "rechazado"` (enum distinto de `cancelled`, ver 7.1), con **motivo obligatorio** (select de motivos predefinidos) + **detalle opcional** (textarea). El vendedor ve el motivo y el detalle en su publicación rechazada, puede **editarla y volver a enviarla a revisión**.
- **Decisión de alcance:** por ahora la verificación es 100% manual — se evaluó automatizarla (ingresando a la web de la aerolínea con el código de reserva) pero se descartó para esta etapa por complejidad/fragilidad de scraping contra sistemas de aerolíneas.

### 7.10 Timeline "Protección Escrow" en el detalle del vuelo — realismo por audiencia
Antes, el bloque "Protección Escrow" en `flight.$id.tsx` mostraba un timeline de 4 pasos cuyo estado (`done`) dependía de un contador local (`useState`) nunca conectado a ninguna transacción real — siempre mostraba el mismo estado sin importar quién mirara ni si el vuelo ya estaba vendido.

**Comportamiento actual:**
- Si quien mira **es** el comprador o vendedor real de la transacción asociada a ese vuelo (verificado vía `getTransactionForFlight`, que se apoya en RLS — un tercero simplemente no recibe la fila): el timeline muestra el **estado real** de la transacción, incluyendo "Pago liberado" solo si de verdad ya se liberó, y una nota si está reembolsada o en disputa.
- Si el vuelo ya no está disponible (`sold`/`cancelled`/`rechazado`) y quien mira **no** es parte de la transacción: se reemplaza el timeline completo por un badge simple **"Este pasaje ya fue vendido"**.
- Si el vuelo sigue disponible y no hay transacción todavía (comprador potencial explorando): se mantiene el timeline como explicación genérica de cómo funciona el escrow, sin ningún paso marcado como ya completado (antes el paso 1 se mostraba falsamente completado siempre).

### 7.11 Honestidad del precio mostrado al comprador
El precio destacado ("hero") en la card de vuelo y en el detalle es siempre `totalAPagar(flight) = resalePrice + comisionPlataforma(resalePrice)` — el monto real y final que el comprador paga, nunca el precio base del vendedor solo. `discountPct()` también se calcula sobre ese total, no sobre el precio base, para que el porcentaje de descuento mostrado sea comparable de verdad contra la tarifa oficial. Se eliminó un bloque redundante de "Total a pagar hoy" que repetía la misma cifra ya mostrada como precio principal.

**Motivación:** mostrar un precio base más bajo como cifra principal, con la comisión aplicada después, generaba la sensación de "sorpresa" en el monto final — se decidió que el número grande y visible sea siempre el que el usuario efectivamente paga.

### 7.12 Validación de longitud de documento de identidad
El campo "Número de documento" (tanto al publicar/vender — datos del pasajero — como al llenar los datos de endoso del comprador) tiene un largo máximo esperado según tipo de documento (`DOCUMENTO_MAX_LEN`). El botón de continuar/enviar queda **deshabilitado** hasta que el número tenga exactamente esa longitud, no solo "no vacío".

### 7.13 Publicaciones activas del vendedor y retiro
Un `Flight` "pertenece" al vendedor logueado cuando `flight.seller.id === user.id`. Métricas reales por publicación: `views`, `interested_count`, `saved_count` (incrementados/decrementados por acciones reales de otros usuarios — ver 6, fix reciente de `saved_count`).

**Retirar publicación** solo está permitido si la oferta **no tiene comprador** (no existe `Transaction` asociada) — cambia `status` a `cancelled`, se oculta del marketplace pero no se borra, queda en "Retirados" como historial de solo lectura. Las cards de "Retirados" (y de "Rechazados") no muestran métricas de vistas/interesados/guardados — no aportan valor una vez que la publicación ya no está activa.

## 8. Limitaciones conocidas del prototipo (no resueltas a propósito)

- **Sin pasarela de pago real:** el modal de método de pago (Yape/Plin, Tarjeta, Transferencia) sigue siendo una simulación visual — no se procesa dinero real, aunque la transacción y su estado sí quedan persistidos de verdad en Postgres.
- **Autocompletar con IA es simulado:** no hay llamada real a un modelo de visión. El archivo subido sí se usa después como evidencia real para la revisión manual (ver 7.9), pero el autocompletado de campos en sí es una animación de carga + valores de ejemplo.
- **Revisión de publicaciones y de cargos de aerolínea es 100% manual:** no hay verificación automática contra las webs de las aerolíneas.
- **Sin panel de soporte con mediación real:** las disputas se resuelven hoy solo con "reembolsar manualmente" — no hay más opciones (ej. reasignar, negociar un monto parcial) ni un rol de soporte separado del propio vendedor/comprador que reportó.
- **Equipaje no es 100% por tramo:** `baggage` sigue siendo un solo campo por boleto, a diferencia de `asientoIda`/`asientoRegreso`.
- **Sin verificación de identidad real:** se removió el bloque de UI que simulaba "Identidad verificada" con DNI/selfie falsos — no existe todavía una verificación real que lo reemplace.

## 9. Roadmap sugerido

1. **Pasarela de pago real** (Yape/Plin, tarjeta, transferencia) integrada al flujo de escrow ya funcionando sobre Postgres.
2. **Integración real de autocompletado por IA** (modelo de visión + manejo de archivos) para reemplazar la simulación actual.
3. **Automatizar (parcial o totalmente) la verificación de publicaciones y cargos de aerolínea**, hoy 100% manual vía panel admin.
4. **Panel de soporte con más opciones de resolución de disputas** que el reembolso manual binario actual.
5. **Verificación de identidad real** en el perfil de usuario.
6. **Equipaje por tramo**, replicando el tratamiento ya dado al asiento.
7. **Definición del modelo de comisión con cifras reales** (rangos por urgencia todavía sin definir).
8. **Validaciones externas pendientes** (sección 10) antes de comprometer más desarrollo sobre supuestos no verificados.
9. **Piloto acotado** (posiblemente por ruta o volumen limitado) antes de un lanzamiento amplio.

## 10. Decisiones y validaciones pendientes

- **Modelo de comisión:** rangos exactos por definir según urgencia.
- **Cargo real de aerolíneas en la práctica actual:** verificar directamente con LATAM, Sky y JetSmart si están cobrando algo por endoso doméstico tras la Ley 32325.
- **Viabilidad de vender tramos de ida/vuelta por separado a compradores distintos:** confirmar con al menos una aerolínea.
- **Automatización de la verificación** (publicaciones y cargos de aerolínea): evaluada y descartada por ahora a favor de revisión manual — reconsiderar si el volumen lo justifica.
- **Alcance de la resolución de disputas:** hoy solo existe "reembolsar" — definir si se necesitan más desenlaces posibles (ej. liberar parcialmente, mediar montos).

## 11. Contexto para un agente de IA que retome el proyecto

- Este proyecto usa **React + Vite + TanStack Router + TanStack Query + Tailwind CSS v4**, con **backend real en Supabase** (Postgres + Auth + Storage + Realtime). No asumas que algo "vive solo en memoria" sin comprobarlo primero contra `src/lib/services/*.ts` — la gran mayoría de los módulos de la sección 6 son reales, no mocks.
- **No tienes acceso directo a la base de datos.** Cualquier cambio de esquema, RLS o trigger debe entregarse como SQL para que el fundador lo ejecute manualmente en el SQL Editor de Supabase, y luego debe verificarse (ej. con un script Node desechable usando las credenciales de `.env.local`) antes de dar el cambio por confirmado.
- `ALTER TYPE ... ADD VALUE` debe ejecutarse como sentencia aislada, nunca combinada con otro DDL/DML en el mismo paste, por las reglas transaccionales del editor SQL de Supabase.
- Todo objeto nuevo (tabla o bucket de Storage) necesita sus políticas de RLS creadas explícitamente — un error recurrente en este proyecto fue escribir las políticas antes de crear la tabla/bucket, causando fallos silenciosos difíciles de diagnosticar.
- Todas las reglas de negocio de la sección 7 son restricciones de diseño ya decididas, no sugerencias — en particular: el comprador nunca ve el cargo de aerolínea, el gate de confirmación del comprador antes de liberar el pago, el precio "hero" mostrado siempre incluye la comisión, y el tope de precio de reventa (10%–100% del original) es un bloqueo duro.
- El sistema de diseño (sección 5) define tokens de color reales, convención de corner radius, y **tres patrones de bug conocidos y su fix** (hover morado, centrado de Dialog roto por `relative`+`tailwind-merge`, cero fantasma en inputs numéricos controlados) — revisar antes de "redescubrir" el mismo bug.
- Las decisiones pendientes (sección 10) no deben resolverse arbitrariamente por un agente de código — son decisiones de negocio que le corresponden al fundador (Gianca).
- Las limitaciones conocidas (sección 8) son intencionales para esta etapa del prototipo — no "arreglarlas" sin que el fundador lo pida explícitamente (ej. no conectar una pasarela de pago real sin que se solicite).
