# Traspaso — PRD (Product Requirements Document)

**Estado:** Prototipo funcional construido en Google Antigravity (sin backend real)
**Última actualización:** agosto 2026
**Propósito de este documento:** que cualquier persona o agente de IA (Antigravity, Claude Code, etc.) pueda retomar el proyecto sin perder contexto, aunque haya pasado tiempo sin tocarlo. Este PRD está construido a partir de un `CHANGELOG.md` interno del proyecto, que es la fuente de verdad más reciente sobre el estado real del código.

---

## 1. Resumen ejecutivo

Traspaso es un marketplace P2P peruano donde usuarios que no van a usar su pasaje aéreo nacional lo endosan y venden con descuento a otros usuarios. La plataforma verifica el traspaso, retiene el pago en garantía (escrow) hasta confirmarlo, y cobra una comisión variable al vendedor. Alcance: solo vuelos nacionales, en LATAM, Sky Airline y JetSmart.

El prototipo cubre hoy el recorrido completo de punta a punta (explorar, publicar, comprar, gestionar el trámite de endoso, liberar el pago), pero sin backend, pasarela de pago ni autenticación reales — ver sección 8, Limitaciones conocidas.

Proyecto con doble propósito: negocio real a validar, y pieza de portafolio de producto/diseño.

## 2. Stack técnico y entorno de desarrollo

- **Frontend:** React + Vite + TanStack Router + Tailwind CSS (v4, dado el uso de sufijo `!` para overrides — ver sección 5)
- **Entorno de desarrollo:** Google Antigravity (IDE agéntico, opera directo sobre el repo, con modo Plan/Execute y navegador integrado para verificación visual)
- **Origen del prototipo:** primera versión visual generada con un prompt para Lovable (UI con datos mock); desarrollo posterior trasladado a Antigravity, incluyendo un rediseño visual completo y la evolución funcional documentada en este PRD.
- **Componentes base:** Radix/shadcn (`Dialog`, `DropdownMenu`, `Popover`, `Slider`, etc.), en `src/components/ui/`.

### Estructura de archivos (fuente: changelog del proyecto)

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

Ver Documento Maestro. Nota técnica: no hay modelo de autenticación real — "Cerrar sesión" es solo un toast visual, sin lógica de auth detrás (ver sección 8).

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

**Decisión clave:** el fondo del `body` usa `--surface-2` (gris suave) mientras que tarjetas y buscador usan blanco puro, para contraste real entre contenido y fondo. `--color-background` (blanco) se sigue usando dentro de inputs/selects para que floten sobre las tarjetas blancas.

**Efecto secundario documentado:** al cambiar el fondo global a gris, elementos que usaban `bg-gray-100` como "inactivo" (ej. bullets del stepper de Publicar pasaje) se volvían casi invisibles. Corregido a `bg-white` + borde sutil.

### 5.2 Corner radius — convención homologada

- **Contenedores** (`DropdownMenuContent`, `PopoverContent`, `DialogContent`): `rounded-2xl` (o `rounded-[2rem]` en Dialog, modal de página completa)
- **Items internos** (`DropdownMenuItem`, `DropdownMenuRadioItem`, etc.): `rounded-xl`
- Cambios a nivel de componente base (`dropdown-menu.tsx`, `popover.tsx`, `dialog.tsx`), se propagan automáticamente a todos los usos.

### 5.3 Bug de contraste en hover — patrón recurrente y su fix

**Causa raíz:** componentes base de Radix/shadcn usan `focus:bg-accent` por defecto, mapeado a `--color-accent-token` (morado). Generaba hovers morados que rompían la consistencia de marca.

**Fix estándar** (aplicado en dropdown de notificaciones, menú de avatar, dropdown "Ordenar"):
```
className="focus:bg-surface-2! focus:text-inherit!"
```
Necesario usar `!important` (sufijo `!` de Tailwind v4) porque Tailwind resuelve conflictos por orden de aparición en la hoja compilada, no por orden en el string de `className` — sin `!`, la clase base a veces ganaba igual. **Este es el patrón a replicar** ante cualquier bug similar de estilo de un componente base de shadcn.

### 5.4 Otros ajustes de diseño notables

- **Chevron de `<select>` nativos:** reemplazado por `appearance-none` + ícono `ChevronDown` de lucide posicionado manualmente (el navegador ignora `padding-right` para la flecha nativa).
- **Línea punteada partida por el ícono del avión** (detalle de vuelo): dos segmentos de línea (`flex-1` cada uno) con el ícono como elemento normal del flujo entre ambos.
- **Botón de intercambiar Origen/Destino:** alineado replicando la altura del label invisible + alto real del input, no posicionamiento absoluto estimado a ojo.

### 5.5 Dirección visual general

Identidad de consumo masivo (sectores B y C), inspirada en Airbnb/inDrive. Explícitamente evita clichés de "startup de viajes" (sin íconos de avión de stock, sin gradientes azul-cielo genéricos). Mobile-first.

## 6. Módulos funcionales — estado real (fuente: changelog del proyecto)

| Módulo | Descripción | Estado |
|---|---|---|
| Búsqueda dual → rediseñada a presets de rango | Presets (`semana`, `quince`, `mes`, `fecha`) + selector de fecha específica en el mismo slot; filtros secundarios en Popover "Más filtros"; filtrado en vivo sin botón "Buscar" | **Implementado** |
| Reglas de vigencia (`active`/`last_call`/`expired`) | Ver sección 7 | **Implementado** |
| Flujo de pago retenido en garantía (escrow) | Máquina de estados real (ver sección 7) | **Implementado** |
| Rediseño visual mass-market | Ver sección 5 | **Implementado** |
| Soporte ida y vuelta (`tipoBoleto`, `tramoAVender`) | Selección de tramo(s) a vender, resolución de tramo vigente para estado/countdown | **Implementado** |
| Información de asiento por tramo (`asientoIda`, `asientoRegreso`) | Independientes entre sí; badge "Ventana confirmada" solo si ventana + seleccionado | **Implementado** |
| Tope de precio de reventa | Estrictamente menor al original, no menor al 10% — bloqueo duro con validación visual | **Implementado** |
| Datos del pasajero (vendedor) al publicar | Vía autocompletado por IA (simulado) o manual | **Implementado** |
| Cálculo de cargo de aerolínea — estimado + confirmado | Modelo híbrido completo (ver sección 7) | **Implementado** |
| Regla de piso en S/0 y comisión efectiva compartida | La comisión de la plataforma se reduce, nunca el cargo de aerolínea | **Implementado** |
| Regla de revisión manual por umbral (>50%) | `REVISION_MANUAL_UMBRAL = 0.5` | **Implementado** |
| Datos del comprador para el endoso (formulario estructurado) | Visible solo al vendedor de esa transacción | **Implementado** |
| Chat interno por transacción | Nunca WhatsApp, nunca expone teléfono real; soporta adjuntar una imagen (ej. foto del DNI cuando la aerolínea la exige para el endoso) | **Implementado** |
| Máquina de estados de transacción | `pago_retenido` → `vendedor_inicia` → `confirmado` → `liberado`, con 3 transiciones reales del lado del vendedor | **Implementado** (antes era decorativa) |
| Autocompletar con IA al publicar | Simulación de subir voucher → loading (~1.8s) → autocompleta datos de vuelo y pasajero (no email/teléfono) | **Implementado como simulación visual** — sin integración real de visión por computadora |
| Alertas de búsqueda + notificaciones | Contexto global, CTA solo si origen y destino completos, campanita con badge, página `/alertas` separada de transacciones | **Implementado** |
| Viajes guardados (favoritos) | Corazón en card y detalle, sección en `/profile`, toast con link a guardados | **Implementado** |
| Header / navegación | Nav reducido a Inicio/Explorar/Cómo funciona; resto en dropdown de avatar | **Implementado** |
| Perfil (`/profile`) | Segmented control (Verificación/Preferencias/Guardados), reputación con modal de reseñas | **Implementado** |
| Modal de método de pago | Yape/Plin, Tarjeta, Transferencia — solo simula el pago inicial, no los pasos siguientes del escrow | **Implementado como simulación visual** — sin pasarela de pago real |
| Nota del vendedor al publicar | Campo `Flight.note`, textarea opcional (280 caracteres) en el paso de confirmación de Publicar pasaje | **Implementado** |
| Vista "Publicados" del vendedor | Chips `En proceso` / `Publicados` / `Retirados` dentro de "Como vendedor"; métricas reales por oferta (Vistas, Interesados, Guardados) | **Implementado** |
| Retirar publicación (danger zone) | Solo para ofertas sin comprador aún; modal de confirmación; oculta del marketplace pero queda en historial ("Retirados"), sin borrado real | **Implementado** |
| "Reportar problema" / disputas | Modal con categorías predefinidas por rol, pausa el escrow (`Transaction.state = "en_disputa"`), copy no técnico ("Pago en pausa" / "Soporte está revisando") | **Implementado** — sin panel de resolución de soporte real (ver Roadmap) |
| Autenticación / cuentas de usuario | "Cerrar sesión" es solo un toast | **No implementado** — sin auth real |
| Backend / persistencia real | Todo el estado vive en `useState`/Context de React | **No implementado** — se pierde al recargar la página |

## 7. Reglas de negocio críticas

### 7.1 Estados de un vuelo (`FlightStatus`)
`active` → `last_call` (<24h, si el vendedor lo permite) → `expired` (oculto siempre). Nunca queda en un estado "pendiente" ambiguo: o está disponible o no se muestra. Ningún vuelo vencido aparece en listados, buscador ni recomendaciones; el countdown solo se activa en ofertas con vigencia real.

### 7.2 Ida y vuelta (`tipoBoleto`, `tramoAVender`)
Boleto `solo_ida` o `ida_y_vuelta`. Si es ida y vuelta, el vendedor decide `tramoAVender: "ida" | "regreso" | "ambos"` — una sola oferta, para un solo comprador, nunca se vende el mismo tramo dos veces. `tramoVigente(flight)` resuelve qué tramo gobierna el estado/countdown (ida por defecto, salvo que se venda solo el regreso). Cuando `tramoAVender === "ambos"`, el detalle muestra dos bloques completos e independientes (Ida y Vuelta), cada uno con su propia ruta, fecha, hora, equipaje y asiento.

**Fuera de alcance (pendiente de validación legal/operativa):** vender el tramo de ida y el de regreso por separado a dos compradores distintos. Depende de si las aerolíneas permiten nombres distintos por tramo en un mismo boleto — no confirmado.

### 7.3 Asiento por tramo
`asientoIda: Asiento | null` y `asientoRegreso: Asiento | null`, independientes entre sí (el vendedor puede haber elegido asientos distintos en cada tramo, o ninguno si ese tramo no se vende). `asientoVigente(flight)` resuelve "el asiento principal" para contextos que solo necesitan un valor (card compacta, filtro, badge). El formulario de Publicar pide "Asiento de ida" y "Asiento de vuelta" por separado cuando corresponde, vía componente reutilizable `AsientoFields`.

**Regla del badge:** solo la categoría "ventana" con asiento **seleccionado** obtiene el badge "Ventana confirmada". Las categorías "medio"/"pasillo" seleccionadas se muestran tal cual (son datos reales, no se degradan). Solo `asiento.tipo === "aleatorio"` muestra "Asignación aleatoria" — nunca un estado "por confirmar más adelante", porque ese dato llega recién con la tarjeta de embarque (~24h antes), el mismo momento en que ya se cierra la ventana legal de endoso.

### 7.4 Tope de precio de reventa
El precio de reventa debe ser **estrictamente menor** al precio original (nunca igual ni mayor), y **no menor al 10%** del original. Bloqueo duro en el formulario de Publicar: input en rojo, mensaje de error, botón "Continuar" deshabilitado hasta corregir. Estados del input: neutro → verde (válido) → rojo (fuera de rango).

### 7.5 Cargo de aerolínea por endoso (modelo híbrido, Ley N° 32325)
- **Estimado** (`cargoAerolineaEstimado`): privado, opcional, ingresado por el vendedor al publicar, sin evidencia requerida. Solo para calcular el neto estimado — el comprador nunca lo ve.
- **Confirmado** (`cargoAerolineaConfirmado`, a nivel de `Transaction`, no de `Flight`): solo existe post-compra (cuando ya hay comprador y el vendedor está haciendo el trámite real), requiere evidencia (`evidenciaUrl`), pasa por `estadoVerificacion` (`no_aplica` → `pendiente_revision` → `aceptado`/`rechazado`).
- **Umbral de revisión manual** (`REVISION_MANUAL_UMBRAL = 0.5`): cargo confirmado que supere el 50% del precio de venta nunca se acepta automáticamente, aunque tenga evidencia.
- **Neto nunca negativo** (`montoNetoFinal`, `comisionEfectiva`): la comisión de la plataforma se reduce (nunca el cargo de aerolínea) para que el vendedor nunca reciba un neto negativo:
  ```
  comision_efectiva = min(comision_normal, max(0, precio_venta - cargo_aerolinea_confirmado))
  neto_final = max(0, precio_venta - cargo_aerolinea_confirmado - comision_efectiva)
  ```
- **Variación favorable** (cargo real menor al estimado, incluido S/0): no requiere ninguna lógica de corrección — el vendedor simplemente recibe más de lo que su estimado privado sugería.
- **El comprador nunca ve el monto del cargo de aerolínea**, en ningún momento del flujo — paga un precio fijo garantizado, con reembolso 100% si el trámite falla (constante `cargoAerolineaLoAsumeVendedor: true`).

### 7.6 Chat interno y datos de endoso
Chat ligado a la transacción específica — nunca WhatsApp ni expone el teléfono real. `datosCompradorEndoso`: formulario estructurado (nombres, apellidos, tipo y número de documento) que el comprador llena para el trámite — nunca se pide por chat en texto libre. Solo lo ve el vendedor de esa transacción.

**Foto del documento de identidad (agregado tras validación real):** un caso real confirmó que, para iniciar un endoso, se pidió una foto del DNI del comprador (fuera de esta plataforma, por WhatsApp). Como no todas las aerolíneas la exigen, no se agregó como campo fijo del formulario de endoso — se maneja como adjunto opcional dentro del chat interno (`ChatMensaje.adjunto: { nombre, url }`), que el vendedor solicita puntualmente cuando la aerolínea la pide y el comprador responde subiendo la imagen directo en el hilo. El formulario de endoso muestra un aviso informativo, no bloqueante, anticipando que esto podría pasar. Mismo nivel de privacidad que el resto de sus datos de endoso: visible solo para el vendedor de esa transacción específica.

### 7.7 Estado de la transacción (`Transaction.state`)
`pago_retenido` → `vendedor_inicia` → `confirmado` → `liberado`. Transiciones reales, todas del lado del vendedor:
1. **"Iniciar trámite con la aerolínea"** — visible cuando el comprador ya envió sus datos de endoso.
2. **"Confirmar traspaso"** — visible en estado `vendedor_inicia`.
3. **"Liberar pago retenido"** — visible en estado `confirmado`, muestra el neto final antes de liberar.

Transacción demo `t-102` (JetSmart JA411) pre-configurada como "happy path" completo para demos en vivo.

### 7.8 Disputas y estado `en_disputa`
Alcanzable desde "Reportar problema", disponible en cualquier estado previo a `liberado`/`reembolsado`. No es parte del `stateOrder` lineal — es un estado de interrupción, igual que `reembolsado`: se guarda `estadoAnteriorDisputa` para congelar el timeline visual en el paso correcto. Mientras está activo, ninguna acción de gestión del trámite está disponible (`puedeGestionar` lo excluye explícitamente).

Categorías de reporte predefinidas y distintas según el rol (`MOTIVOS_REPORTE` en `dashboard.tsx`): comprador reporta "vendedor no responde", "vuelo/asiento no coincide", "boleto inválido", "sospecho de fraude" u "otro"; vendedor reporta el set espejo. Copy deliberadamente no técnico: **"Pago en pausa"** (label de estado) y **"Soporte está revisando · pago en pausa"** (badge en la card) — se descartó "En disputa" por sonar legal/alarmante.

**Sin resolución real:** el reporte queda guardado en la transacción (`motivo`, `detalle`, `createdAt`) y el pago queda pausado indefinidamente en este prototipo — no existe panel de soporte ni lógica para reabrir/resolver el caso (ver sección 9, Roadmap).

### 7.9 Publicaciones activas del vendedor y retiro
Un `Flight` "pertenece" al vendedor actual (`currentUser`/`u-me`) cuando `flight.seller.id === currentUser.id` y no tiene ninguna `Transaction` asociada — ese conjunto se muestra en la pestaña "Publicados" de Mis operaciones, con sus métricas reales (`views`, `interested`, `savedCount`).

**Retirar publicación** solo está permitido si la oferta **no tiene comprador** — una vez existe `Transaction`, retirarla requeriría un flujo de cancelación/reembolso distinto (fuera de alcance de este prototipo). Al confirmar el retiro (modal con advertencia explícita), el vuelo se oculta del marketplace pero no se borra: pasa a un array local `withdrawnIds` y queda visible en la pestaña "Retirados" como historial de solo lectura.

## 8. Limitaciones conocidas del prototipo (no resueltas a propósito)

- **Sin backend real:** todo el estado vive en `useState`/Context de React — se pierde al recargar la página (transacciones, alertas, guardados, chat, etc.).
- **Autocompletar con IA es simulado:** no hay llamada real a un modelo de visión. Implementarlo requeriría backend + manejo de API key + upload de archivos.
- **Sin pasarela de pago real:** el modal de método de pago es una simulación visual completa.
- **Equipaje no es 100% por tramo:** `baggage` sigue siendo un solo campo por boleto (a diferencia de `asientoIda`/`asientoRegreso`, que sí se separaron). Si se necesita equipaje distinto por tramo, requiere el mismo tratamiento que se le dio al asiento.
- **"Cerrar sesión" no tiene auth real** — es un toast, no una acción funcional.

## 9. Roadmap sugerido

1. **Backend real** — persistencia de transacciones, ofertas, usuarios (hoy todo vive en memoria del navegador).
2. **Autenticación real** de usuarios.
3. **Integración real de autocompletado por IA** (modelo de visión + manejo de archivos) para reemplazar la simulación actual.
4. **Pasarela de pago real** (Yape/Plin, tarjeta, transferencia) integrada al flujo de escrow ya diseñado.
5. **Equipaje por tramo**, replicando el tratamiento ya dado al asiento.
6. **Definición del modelo de comisión con cifras reales.**
7. **Validaciones externas pendientes** (sección 10) antes de comprometer más desarrollo sobre supuestos no verificados.
8. **Panel de soporte para resolver disputas:** hoy "Reportar problema" pausa el escrow y guarda el motivo (sección 7.8), pero no hay ninguna forma de reabrir, resolver o comunicar una decisión sobre el caso — requiere un panel (interno o de soporte) que decida el desenlace (liberar, reembolsar, mediar) y lo refleje de vuelta en la transacción.
9. **Verificación de identidad** real en el perfil de usuario.
10. **Piloto acotado** (posiblemente por ruta o volumen limitado) antes de un lanzamiento amplio.

## 10. Decisiones y validaciones pendientes

- **Modelo de comisión:** rangos exactos por definir según urgencia.
- **Cargo real de aerolíneas en la práctica actual:** verificar directamente con LATAM, Sky y JetSmart si están cobrando algo por endoso doméstico tras la Ley 32325, documentando fecha y canal de la consulta.
- **Viabilidad de vender tramos de ida/vuelta por separado a compradores distintos:** confirmar con al menos una aerolínea si se puede endosar un tramo no usado a un tercero manteniendo el otro tramo con el nombre original.
- **Resolución real de disputas:** el reporte de un problema (sección 7.8) pausa el escrow y queda registrado, pero no existe todavía un panel de soporte que decida el desenlace del caso (liberar, reembolsar, mediar entre las partes) — pendiente de diseñar.
- **Verificación de identidad** en el perfil de usuario: sección presente en la UI, lógica real no desarrollada.

## 11. Contexto para un agente de IA que retome el proyecto

- Este proyecto usa **React + Vite + TanStack Router + Tailwind CSS v4**, desarrollado dentro de **Google Antigravity**. Antes de proponer cambios, revisa los archivos de la sección 2 — la mayoría de los módulos de la sección 6 ya están **implementados**, no son propuestas.
- Todas las reglas de negocio de la sección 7 son restricciones de diseño ya decididas, no sugerencias — en particular: el comprador nunca ve el cargo de aerolínea, el cargo estimado nunca requiere evidencia, el cargo confirmado siempre la requiere, el neto nunca puede ser negativo, y el tope de precio de reventa (10%–100% del original) es un bloqueo duro.
- El sistema de diseño (sección 5) define tokens de color reales, convención de corner radius, y un **patrón de bug conocido y su fix** (hover morado por `focus:bg-accent` de shadcn → override con `focus:bg-surface-2! focus:text-inherit!`) — revisar antes de "redescubrir" el mismo bug.
- Antes de asumir que algo no está construido, revisar la sección 6 y correr el proyecto — este PRD fue reconciliado contra un `CHANGELOG.md` real del código, no contra especificaciones sin confirmar.
- Las decisiones pendientes (sección 10) no deben resolverse arbitrariamente por un agente de código — son decisiones de negocio que le corresponden al fundador (Gianca).
- Las limitaciones conocidas (sección 8) son intencionales para esta etapa del prototipo — no "arreglarlas" sin que el fundador lo pida explícitamente (ej. no conectar una pasarela de pago real sin que se solicite).
