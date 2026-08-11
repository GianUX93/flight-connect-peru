# Traspaso — Documento Maestro

**Estado:** Prototipo funcional construido en Google Antigravity (sin backend real) · **Propósito:** negocio real + pieza de portafolio
**Última actualización:** agosto 2026

---

## 1. El problema

En Perú, cuando alguien compra un pasaje aéreo nacional y luego no puede viajar, en la práctica pierde ese dinero. Aunque existe un derecho legal a transferir (endosar) el pasaje a otra persona, el proceso es poco conocido, está disperso entre las políticas de cada aerolínea, y no hay ningún canal simple donde ese pasajero pueda encontrar a alguien interesado en comprarlo.

Del otro lado, hay viajeros con planes flexibles que estarían dispuestos a pagar mucho menos que la tarifa oficial por un vuelo de último minuto — pero hoy no tienen dónde buscar ese tipo de oferta de forma confiable.

**El resultado:** dinero perdido de un lado, oportunidades de ahorro invisibles del otro, y ninguna plataforma peruana que resuelva esto bien del todo (existe competencia directa, Rename Travel, con vacíos claros de transparencia — ver sección 4).

## 2. La solución

**Traspaso** es un marketplace P2P donde:
- Un **vendedor** publica el pasaje nacional que no va a usar, y recupera parte de su dinero.
- Un **comprador** encuentra ese vuelo con un descuento agresivo frente a la tarifa oficial.
- La plataforma **retiene el pago en garantía (escrow)** hasta confirmar que el endoso se completó con éxito, y gestiona todo el proceso de forma transparente y segura para ambas partes.

El prototipo ya cubre el recorrido completo: explorar y filtrar vuelos, publicar un pasaje (con autocompletado por IA a partir de un voucher), pagar y retener el dinero, gestionar el trámite de endoso con datos estructurados y chat interno, y liberar el pago — con alertas de búsqueda y viajes guardados como funciones de retención. El vendedor también puede ver el desempeño real de sus publicaciones activas (vistas, interesados, guardados) y retirarlas si cambia de planes, y cualquiera de las dos partes puede reportar un problema durante el trámite — lo que pausa el pago retenido de forma visible mientras se revisa el caso.

## 3. Propuesta de valor

| Para el vendedor | Para el comprador |
|---|---|
| Recupera dinero que hoy pierde por completo | Vuelos nacionales con descuento agresivo de último minuto |
| Ve un desglose real de cuánto va a recibir, no una cifra opaca | Precio fijo garantizado — nunca cambia después de pagar |
| Publica en minutos con autocompletado por IA desde su voucher | Reembolso 100% si el traspaso no se logra completar |
| Guía clara paso a paso del trámite de endoso, sin exponer sus datos personales por WhatsApp | Puede guardar vuelos y crear alertas para rutas que aún no tienen oferta |
| Ve vistas, interesados y guardados de cada publicación activa, y puede retirarla si cambia de planes | Si algo sale mal, puede reportarlo y el pago retenido queda protegido en pausa mientras se revisa |

## 4. Diferenciadores frente a la competencia (Rename Travel)

- **Desglose real vs. advertencia genérica**: Rename Travel advierte con un texto que "las aerolíneas cobran una tarifa", pero su cálculo de "monto neto a recibir" no la descuenta. Traspaso sí construye ese cálculo, con un estimado que el propio vendedor puede ingresar antes de publicar, y un monto verificado con evidencia una vez que el trámite es real.
- **Protección de precio para ambos lados**: tope de precio de reventa (nunca igual o mayor al original, nunca por debajo del 10%) evita publicaciones abusivas o irrisorias — algo que la competencia no controla.
- **Fechas y vigencia**: nunca se muestra inventario vencido ni ofertas sin margen de tiempo real para completar el trámite.
- **Búsqueda flexible**: presets de rango de fechas (semana, quince días, mes, fecha exacta) en vez de un buscador rígido tipo motor de vuelos, con filtrado en vivo sin fricción de "buscar" y esperar.
- **Privacidad y confianza**: comunicación entre comprador y vendedor por chat interno de la plataforma, nunca exponiendo el número de teléfono real ni derivando a WhatsApp; los datos de identidad para el endoso se piden en un formulario estructurado, no por chat. Cuando la aerolínea exige además una foto del documento (confirmado con un caso real, donde hoy ese pedido ocurre por WhatsApp fuera de cualquier plataforma), el chat interno permite adjuntarla directamente — sin salir de Traspaso ni exponer el dato en un canal externo.

## 5. Usuario objetivo

Público peruano de consumo masivo (sectores B y C), mobile-first, entre 20 y 45 años, cómodo con apps tipo fintech/marketplace (Yape, Mercado Libre, inDrive). Dos perfiles dentro de la misma base de usuarios:

- **Vendedor**: tiene un pasaje que no puede usar, quiere recuperar dinero rápido y sin fricción.
- **Comprador**: viajero con planes flexibles, prioriza precio sobre fecha exacta, busca vuelos nacionales de último minuto.

## 6. Alcance

Solo vuelos **nacionales** dentro de Perú, en las tres aerolíneas que operan rutas domésticas: LATAM, Sky Airline y JetSmart.

## 7. Modelo de negocio

Comisión por servicio cobrada al vendedor en cada transacción completada, con un modelo pensado para variar **según la urgencia del vuelo**. Los porcentajes exactos todavía están **por definir**.

El cargo que eventualmente cobre la aerolínea por el trámite de endoso lo asume el vendedor (se descuenta de su monto neto, con un piso de S/0 — nunca queda debiendo dinero) — el precio que paga el comprador es siempre fijo y no se ve afectado por este cargo.

## 8. Base legal

El derecho a transferir un pasaje nacional está respaldado por el Código de Protección y Defensa del Consumidor (Ley 29571) y, desde mayo de 2025, por la Ley N° 32325, que refuerza el carácter gratuito del endoso doméstico solicitado con 24 horas de anticipación. Existe cierta ambigüedad legal sobre si esa gratuidad cubre también los "gastos administrativos" del trámite — un punto que Traspaso maneja con transparencia en vez de asumir una respuesta única (ver PRD para el detalle).

## 9. Identidad de marca

Dirección visual de consumo masivo, inspirada en la claridad de Airbnb y la cercanía de inDrive — colores vibrantes (coral, teal, amarillo), iconografía amigable, mobile-first. Explícitamente alejada de clichés de "startup de viajes" (sin íconos de avión de stock ni gradientes azul-cielo genéricos).

## 10. Estado actual

Prototipo funcional con todos los flujos principales navegables de punta a punta (explorar, publicar, comprar, gestionar el trámite, liberar el pago), construido en React sobre Google Antigravity. Sin backend real todavía: el estado vive en memoria del navegador y se pierde al recargar la página; el autocompletado por IA, la pasarela de pago y la autenticación son simulaciones visuales completas, no integraciones reales. El PRD detalla el alcance técnico exacto y lo que falta para llevarlo a producción.
