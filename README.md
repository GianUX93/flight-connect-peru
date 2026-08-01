# Flight Connect Peru

Quiero que diseñes y construyas el prototipo de interfaz completo (frontend, con datos mock, sin backend real) de una aplicación web llamada "Traspaso" (nombre provisional, puedes sugerir alternativas).

Concepto del producto

"Traspaso" es un marketplace P2P peruano donde personas que no pueden usar su pasaje aéreo nacional lo publican para transferírselo (endoso) a otra persona, recuperando parte del dinero. Compradores consiguen vuelos de último minuto con descuentos agresivos frente al precio oficial. La plataforma verifica la validez del boleto y retiene el pago (estilo escrow) hasta confirmar que el traspaso fue exitoso ante la aerolínea.

Usuarios objetivo

Vendedor: alguien con un pasaje que no puede usar, busca recuperar dinero rápido y sin fricción.

Comprador: viajero con planes flexibles buscando vuelos nacionales baratos de último minuto.

Público peruano, mobile-first, entre 20-45 años, cómodo con apps tipo fintech/marketplace (Yape, Mercado Libre, Airbnb).

Tono de marca y dirección de diseño

Estética premium, minimalista, con influencia Apple: mucho espacio en blanco (o dark mode elegante), tipografía cuidada, microinteracciones sutiles, nada de clichés genéricos de "startup de viajes" (evitar íconos de avión de stock, gradientes azul-cielo trillados).

Debe transmitir confianza y seguridad (se está manejando dinero y trámites legales), pero sin sentirse corporativo/aburrido — más cercano a una fintech moderna que a una aerolínea tradicional.

Paleta sugerida: base oscura o neutra sofisticada, con un color de acento vibrante único (evitar el azul genérico de aerolíneas). Tipografía sans-serif moderna para UI, con posible serif o display font para momentos de marca (hero, títulos grandes).

Usa mock data realista: nombres de aerolíneas peruanas (LATAM, Sky Airline, JetSmart), rutas nacionales (Lima-Cusco, Lima-Arequipa, Lima-Piura, Lima-Iquitos), precios en soles (S/).

Diferenciadores clave frente a la competencia (obligatorios, no opcionales)

Hice research sobre una plataforma peruana existente con el mismo modelo y detecté dos fallas de UX que debes evitar activamente en el diseño:

A. El buscador de fechas no puede comportarse como Google Flights. Este es un marketplace de inventario finito (depende de lo que otros usuarios publican), no un motor de búsqueda de vuelos ilimitados. El buscador debe separar claramente dos intenciones distintas desde el diseño de la interfaz, no como un filtro más:

"Tengo una fecha fija" (para quien tiene poca flexibilidad): si no hay resultados exactos, la interfaz debe ofrecer de forma prominente (a) fechas cercanas con disponibilidad real, y (b) un botón para "avisarme cuando aparezca" (alerta/lista de espera) — nunca un estado vacío tipo "no hay resultados" sin salida.

"Quiero ver ofertas disponibles" (para quien prioriza precio sobre fecha): una vista tipo feed/calendario flexible que muestre directamente lo que hay disponible por rango de fechas o por ruta, sin pedir una fecha exacta de entrada. No mezcles ambos flujos en un solo buscador rígido de "origen-destino-fecha exacta"; que el usuario elija su modo de búsqueda desde el inicio.

B. Reglas funcionales de vigencia y visibilidad de ofertas (obligatorias)

El modelo de datos mock debe incluir un campo status por publicación con tres valores posibles, y la interfaz debe comportarse de forma distinta para cada uno:

active — faltan más de 24 horas para la salida y el endoso sigue siendo viable. Se muestra como oferta estándar en listados, buscador y recomendaciones, con countdown visible.

last_call — faltan menos de 24 horas pero el negocio permite ofrecerla igual. NO se muestra como oferta estándar; debe vivir en una categoría/sección separada y explícita ("Última llamada"), con una advertencia visible sobre el tiempo real disponible para completar el trámite de endoso. El countdown aquí debe comunicar riesgo, no solo urgencia (ej. tono de advertencia, no de oferta atractiva).

expired — la salida ya pasó o el trámite de endoso ya no es operativamente viable. La oferta se oculta/archiva automáticamente: nunca debe aparecer en resultados activos, buscador ni módulo de recomendaciones, bajo ninguna circunstancia.

Reglas de interfaz derivadas (implementarlas tal cual, son criterios de aceptación del prototipo):

Ningún vuelo expired aparece en resultados activos, buscador ni recomendaciones — en ningún listado del producto.

Ningún vuelo con menos de 24 horas para su salida aparece mezclado con las ofertas estándar; solo puede aparecer en la sección separada de "última llamada" si el estado es last_call.

El countdown regresivo (component visual) solo se renderiza para ofertas active o last_call con vigencia real y verificable — nunca para una oferta expired. No se usa el countdown para generar urgencia artificial sobre inventario que ya no se puede comprar.

Si una oferta no cumple el umbral mínimo de vigencia para completar el traspaso de forma segura y no calificó como last_call, la interfaz debe reemplazar la card/oferta por uno de estos estados explícitos (nunca dejarla vacía o ambigua):

"Oferta no disponible"

"Salida muy próxima"

"Activa alertas para esta ruta" (conecta con el sistema de alertas mencionado en el punto A)

El principio rector del diseño aquí es: la plataforma nunca muestra inventario que el usuario no pueda comprar y transferir de forma realista — prioriza siempre claridad y confianza sobre urgencia artificial.

Pantallas a construir

Landing / Home

Hero claro explicando la propuesta de valor en una línea ("Vuelos que otros no pueden usar, a mitad de precio para ti" o similar, siéntete libre de mejorar el copy).

Sección de cómo funciona (3 pasos, para vendedor y para comprador).

Feed/grid de vuelos disponibles destacados (con badge de urgencia: "Sale en 6h", "Últimas horas").

Prueba social / confianza (contador de traspasos exitosos, testimonios).

Marketplace / Explorar vuelos

Buscador con dos modos claramente diferenciados (ver sección de diferenciadores arriba): "Fecha específica" vs. "Ver ofertas disponibles".

Si el modo de fecha específica no tiene resultados, muestra fechas cercanas con disponibilidad real + opción de crear alerta, nunca un estado vacío sin salida.

Lista/grid de pasajes disponibles con filtros (origen, destino, fecha, aerolínea, rango de precio) — solo muestra ofertas con status = active.

Sección separada y claramente diferenciada (visualmente distinta, no mezclada en el grid principal) para ofertas con status = last_call, con su propia advertencia de tiempo límite para el trámite.

Cada card de oferta active muestra: ruta, fecha/hora, aerolínea, precio original tachado vs precio de reventa, % de descuento, y countdown solo si aplica. Las ofertas expired nunca aparecen en ningún listado.

Detalle de vuelo / Checkout

Info completa del vuelo, detalle del descuento, explicación de cómo funciona el proceso de traspaso y el escrow (para generar confianza).

Flujo de pago (mock) con estado claro: "Tu pago está retenido de forma segura hasta que se confirme el traspaso".

Timeline de estados: Pago retenido → Vendedor inicia trámite → Traspaso confirmado → Pago liberado.

Publicar un pasaje (flujo del vendedor)

Formulario multi-step: datos del vuelo, subir comprobante/código de reserva, precio de reventa sugerido vs precio que quiere poner, confirmación.

Pantalla de "tu pasaje está publicado" con estado y métricas simuladas (vistas, interesados).

Dashboard / Mis transacciones

Vista unificada para el usuario como comprador y vendedor: transacciones activas, historial, estado de cada una (con la timeline de arriba), monto retenido/liberado.

Verificación / Confianza

Pantalla o modal explicando cómo la plataforma verifica el traspaso (aunque sea simulado), sellos de seguridad, FAQ corta sobre el respaldo legal del endoso gratuito en Perú.

Perfil de usuario

Datos básicos, verificación de identidad (mock), historial de reputación (rating como vendedor/comprador, estilo Airbnb/Mercado Libre).

Notas importantes

Todo con datos simulados (mock data / estado local), no necesitas conectar pagos reales, APIs de aerolíneas, ni backend.

Prioriza que el flujo de confianza y seguridad del dinero se sienta muy claro visualmente en cada pantalla relevante — es el punto más delicado del producto.

Diseño responsive, pero prioriza mobile-first.

Siéntete libre de proponer mejoras de copywriting, microcopy y nombres, siempre que mantengan el concepto central.

Tip de uso: si Lovable te da una primera versión genérica, pídele explícitamente "hazlo más premium y menos genérico, evita plantillas típicas de SaaS" — eso suele mejorar mucho el resultado visual.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9ec9c4f4-fc03-4258-9ca5-d6486a2ebe8f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
