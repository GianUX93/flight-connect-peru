// Mock inventory for the Traspaso prototype.
// Status is computed relative to the departure of the tramo actually being sold
// (see `tramoVigente` in flight-utils) and the persisted business flag `sellerAllowsLastCall`.
// - active: > 24h to departure and endoso is viable
// - last_call: < 24h but seller opted to keep it available (separate lane)
// - expired: departure passed OR sellerAllowsLastCall=false and <24h

export type FlightStatus = "active" | "last_call" | "expired";

export interface Airport {
  code: string;
  city: string;
  region: string;
}

// Un tramo (ida o regreso) tal como lo carga el vendedor al publicar.
export interface FlightSegment {
  origin: Airport;
  destination: Airport;
  departureAt: string; // ISO — fecha + hora de salida
  durationMin: number;
}

export type TipoBoleto = "solo_ida" | "ida_y_vuelta";
// Una sola oferta, un solo comprador: qué tramo(s) incluye esta publicación específica.
export type TramoAVender = "ida" | "regreso" | "ambos";

export interface DatosPasajero {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
}

// En tarifas de asiento aleatorio, la aerolínea recién asigna el asiento en el boarding
// pass (~24h antes del vuelo) — el mismo momento en que se cierra la ventana legal del
// endoso. No hay ningún momento válido en el que este dato pueda "completarse después"
// mientras el pasaje siga siendo vendible, así que se resuelve por completo al publicar,
// sin ningún estado "pendiente".
export type AsientoTipo = "seleccionado" | "aleatorio";
export type AsientoCategoria = "ventana" | "medio" | "pasillo";

export interface Asiento {
  tipo: AsientoTipo;
  categoria: AsientoCategoria | null; // obligatorio si tipo="seleccionado", siempre null si "aleatorio"
  numero: string | null; // opcional, solo si tipo="seleccionado"
}

// Estimado privado del vendedor al publicar — nunca requiere evidencia, nunca lo ve
// el comprador, y solo alimenta el "neto estimado" que se muestra al publicar.
export interface CargoAerolineaEstimado {
  monto: number | null;
  ingresadoPorVendedor: boolean;
  verificado: false;
}

export const cargoAerolineaEstimadoDefault = (): CargoAerolineaEstimado => ({
  monto: null,
  ingresadoPorVendedor: false,
  verificado: false,
});

// Ley N° 32325 (may. 2025): el endoso de un pasaje nacional (hasta 24h antes del vuelo)
// es gratuito, incluida la emisión del nuevo boleto — línea base legal S/ 0 para las 3 aerolíneas.
// Este monto CONFIRMADO solo existe una vez que hay comprador y trámite en curso (ver
// Transaction.cargoAerolineaConfirmado): el vendedor puede reportar que le cobraron durante
// el trámite, pero el monto solo entra al cálculo del neto final una vez "aceptado" tras
// revisión — nunca mientras esté pendiente o rechazado.
export type CargoAerolineaOrigen = "default_legal" | "reportado_por_vendedor";
export type CargoAerolineaEstado = "no_aplica" | "pendiente_revision" | "aceptado" | "rechazado";

export interface CargoAerolineaConfirmado {
  monto: number;
  origen: CargoAerolineaOrigen;
  evidenciaUrl: string | null;
  estadoVerificacion: CargoAerolineaEstado;
  momentoDisponible: "confirmado_en_tramite";
  // true cuando el monto reportado superó el 50% del precio de venta al momento de
  // reportarlo — protección contra error de tipeo o evidencia manipulada. Un cargo así
  // nunca se acepta automáticamente aunque tenga evidencia adjunta; requiere que el panel
  // de revisión lo apruebe explícitamente.
  revisionManualRequerida: boolean;
}

export const cargoAerolineaConfirmadoDefault = (): CargoAerolineaConfirmado => ({
  monto: 0,
  origen: "default_legal",
  evidenciaUrl: null,
  estadoVerificacion: "no_aplica",
  momentoDisponible: "confirmado_en_tramite",
  revisionManualRequerida: false,
});

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  avatarUrl: string;
  rating: number;
  reviews: number;
  verifiedId: boolean;
  memberSince: string;
}

export interface Flight {
  id: string;
  tipoBoleto: TipoBoleto;
  tramoIda: FlightSegment;
  tramoRegreso: FlightSegment | null; // solo existe si tipoBoleto = "ida_y_vuelta"
  tramoAVender: TramoAVender;
  airline: "LATAM" | "Sky Airline" | "JetSmart";
  flightNumber: string;
  originalPrice: number; // soles
  resalePrice: number; // soles
  baggage: "solo cabina" | "23kg incluido" | "cabina + 23kg";
  asiento: Asiento;
  seller: Seller;
  sellerAllowsLastCall: boolean; // when <24h, whether it enters last_call lane
  createdAt: string;
  views: number;
  interested: number;
  note?: string;
  datosPasajero: DatosPasajero;
  cargoAerolineaEstimado: CargoAerolineaEstimado;
}

const airports: Record<string, Airport> = {
  LIM: { code: "LIM", city: "Lima", region: "Callao" },
  CUZ: { code: "CUZ", city: "Cusco", region: "Cusco" },
  AQP: { code: "AQP", city: "Arequipa", region: "Arequipa" },
  PIU: { code: "PIU", city: "Piura", region: "Piura" },
  IQT: { code: "IQT", city: "Iquitos", region: "Loreto" },
  TRU: { code: "TRU", city: "Trujillo", region: "La Libertad" },
  TPP: { code: "TPP", city: "Tarapoto", region: "San Martín" },
  CIX: { code: "CIX", city: "Chiclayo", region: "Lambayeque" },
};

const sellers: Seller[] = [
  {
    id: "s1",
    name: "Camila R.",
    avatar: "CR",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    rating: 4.9,
    reviews: 27,
    verifiedId: true,
    memberSince: "2024",
  },
  {
    id: "s2",
    name: "Diego M.",
    avatar: "DM",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    rating: 4.8,
    reviews: 12,
    verifiedId: true,
    memberSince: "2025",
  },
  {
    id: "s3",
    name: "Valeria P.",
    avatar: "VP",
    avatarUrl: "https://i.pravatar.cc/150?img=25",
    rating: 5.0,
    reviews: 41,
    verifiedId: true,
    memberSince: "2023",
  },
  {
    id: "s4",
    name: "Rodrigo A.",
    avatar: "RA",
    avatarUrl: "https://i.pravatar.cc/150?img=33",
    rating: 4.6,
    reviews: 8,
    verifiedId: false,
    memberSince: "2025",
  },
  {
    id: "s5",
    name: "Lucía Q.",
    avatar: "LQ",
    avatarUrl: "https://i.pravatar.cc/150?img=44",
    rating: 4.95,
    reviews: 63,
    verifiedId: true,
    memberSince: "2022",
  },
];

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

// Datos del titular actual del boleto (no el futuro comprador) — necesarios para el
// trámite real de endoso con la aerolínea más adelante.
const pasajeros: Record<string, DatosPasajero> = {
  camila: {
    nombres: "Camila",
    apellidoPaterno: "Ramírez",
    apellidoMaterno: "Torres",
    email: "camila.ramirez@correo.pe",
    telefono: "+51 987 654 321",
  },
  diego: {
    nombres: "Diego",
    apellidoPaterno: "Medina",
    apellidoMaterno: "Flores",
    email: "diego.medina@correo.pe",
    telefono: "+51 976 543 210",
  },
  valeria: {
    nombres: "Valeria",
    apellidoPaterno: "Paredes",
    apellidoMaterno: "Rojas",
    email: "valeria.paredes@correo.pe",
    telefono: "+51 965 432 109",
  },
  rodrigo: {
    nombres: "Rodrigo",
    apellidoPaterno: "Alvarado",
    apellidoMaterno: "Campos",
    email: "rodrigo.alvarado@correo.pe",
    telefono: "+51 954 321 098",
  },
  lucia: {
    nombres: "Lucía",
    apellidoPaterno: "Quispe",
    apellidoMaterno: "Vargas",
    email: "lucia.quispe@correo.pe",
    telefono: "+51 943 210 987",
  },
};

export const flights: Flight[] = [
  {
    id: "f-001",
    tipoBoleto: "solo_ida",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.CUZ,
      departureAt: hoursFromNow(72),
      durationMin: 85,
    },
    tramoRegreso: null,
    tramoAVender: "ida",
    airline: "LATAM",
    flightNumber: "LA 2043",
    originalPrice: 480,
    resalePrice: 219,
    baggage: "cabina + 23kg",
    asiento: { tipo: "seleccionado", categoria: "ventana", numero: "12A" },
    seller: sellers[0],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-8),
    views: 214,
    interested: 18,
    note: "Cambio de planes familiares. Endoso permitido sin costo por LATAM.",
    datosPasajero: pasajeros.camila,
    cargoAerolineaEstimado: cargoAerolineaEstimadoDefault(),
  },
  {
    id: "f-002",
    tipoBoleto: "solo_ida",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.AQP,
      departureAt: hoursFromNow(48),
      durationMin: 100,
    },
    tramoRegreso: null,
    tramoAVender: "ida",
    airline: "Sky Airline",
    flightNumber: "H2 831",
    originalPrice: 310,
    resalePrice: 149,
    baggage: "solo cabina",
    asiento: { tipo: "seleccionado", categoria: "pasillo", numero: "18C" },
    seller: sellers[1],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-4),
    views: 98,
    interested: 9,
    datosPasajero: pasajeros.diego,
    cargoAerolineaEstimado: { monto: 25, ingresadoPorVendedor: true, verificado: false },
  },
  {
    id: "f-003",
    tipoBoleto: "solo_ida",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.PIU,
      departureAt: hoursFromNow(120),
      durationMin: 105,
    },
    tramoRegreso: null,
    tramoAVender: "ida",
    airline: "JetSmart",
    flightNumber: "JA 411",
    originalPrice: 265,
    resalePrice: 129,
    baggage: "solo cabina",
    asiento: { tipo: "seleccionado", categoria: "ventana", numero: "07F" },
    seller: sellers[2],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-22),
    views: 341,
    interested: 24,
    datosPasajero: pasajeros.valeria,
    cargoAerolineaEstimado: cargoAerolineaEstimadoDefault(),
  },
  {
    id: "f-004",
    // Ida y vuelta, se vende como una sola oferta con ambos tramos.
    tipoBoleto: "ida_y_vuelta",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.IQT,
      departureAt: hoursFromNow(200),
      durationMin: 115,
    },
    tramoRegreso: {
      origin: airports.IQT,
      destination: airports.LIM,
      departureAt: hoursFromNow(272),
      durationMin: 115,
    },
    tramoAVender: "ambos",
    airline: "LATAM",
    flightNumber: "LA 2401",
    originalPrice: 520,
    resalePrice: 289,
    baggage: "23kg incluido",
    asiento: { tipo: "seleccionado", categoria: "medio", numero: "22B" },
    seller: sellers[4],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-2),
    views: 66,
    interested: 4,
    datosPasajero: pasajeros.lucia,
    cargoAerolineaEstimado: { monto: 18, ingresadoPorVendedor: true, verificado: false },
  },
  {
    id: "f-005",
    // Ida y vuelta, pero esta oferta vende SOLO el tramo de regreso (el de ida ya voló).
    // Prueba clave: el countdown/estado se calcula sobre tramoRegreso, no sobre tramoIda.
    tipoBoleto: "ida_y_vuelta",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.CUZ,
      departureAt: hoursFromNow(-50),
      durationMin: 85,
    },
    tramoRegreso: {
      origin: airports.CUZ,
      destination: airports.LIM,
      departureAt: hoursFromNow(19),
      durationMin: 90,
    }, // last_call
    tramoAVender: "regreso",
    airline: "Sky Airline",
    flightNumber: "H2 214",
    originalPrice: 360,
    resalePrice: 139,
    baggage: "solo cabina",
    asiento: { tipo: "seleccionado", categoria: "pasillo", numero: "09D" },
    seller: sellers[0],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-3),
    views: 402,
    interested: 31,
    note: "Ya no puedo tomarlo. Endoso rápido, respondo en minutos.",
    datosPasajero: pasajeros.camila,
    cargoAerolineaEstimado: cargoAerolineaEstimadoDefault(),
  },
  {
    id: "f-006",
    tipoBoleto: "solo_ida",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.TRU,
      departureAt: hoursFromNow(9),
      durationMin: 75,
    }, // last_call, close margin
    tramoRegreso: null,
    tramoAVender: "ida",
    airline: "JetSmart",
    flightNumber: "JA 502",
    originalPrice: 220,
    resalePrice: 79,
    baggage: "solo cabina",
    asiento: { tipo: "aleatorio", categoria: null, numero: null },
    seller: sellers[3],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-1),
    views: 89,
    interested: 6,
    datosPasajero: pasajeros.rodrigo,
    cargoAerolineaEstimado: cargoAerolineaEstimadoDefault(),
  },
  {
    id: "f-007",
    tipoBoleto: "solo_ida",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.TPP,
      departureAt: hoursFromNow(-6),
      durationMin: 95,
    }, // expired (past)
    tramoRegreso: null,
    tramoAVender: "ida",
    airline: "LATAM",
    flightNumber: "LA 2311",
    originalPrice: 410,
    resalePrice: 179,
    baggage: "cabina + 23kg",
    asiento: { tipo: "seleccionado", categoria: "pasillo", numero: "05C" },
    seller: sellers[1],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-40),
    views: 512,
    interested: 22,
    datosPasajero: pasajeros.diego,
    cargoAerolineaEstimado: cargoAerolineaEstimadoDefault(),
  },
  {
    id: "f-008",
    tipoBoleto: "solo_ida",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.CIX,
      departureAt: hoursFromNow(14),
      durationMin: 80,
    },
    tramoRegreso: null,
    tramoAVender: "ida",
    airline: "Sky Airline",
    flightNumber: "H2 640",
    originalPrice: 240,
    resalePrice: 99,
    baggage: "solo cabina",
    asiento: { tipo: "aleatorio", categoria: null, numero: null },
    seller: sellers[4],
    sellerAllowsLastCall: false, // <24h and seller withdrew → expired for the marketplace
    createdAt: hoursFromNow(-10),
    views: 61,
    interested: 2,
    datosPasajero: pasajeros.lucia,
    cargoAerolineaEstimado: cargoAerolineaEstimadoDefault(),
  },
  {
    id: "f-009",
    tipoBoleto: "solo_ida",
    tramoIda: {
      origin: airports.AQP,
      destination: airports.LIM,
      departureAt: hoursFromNow(96),
      durationMin: 95,
    },
    tramoRegreso: null,
    tramoAVender: "ida",
    airline: "LATAM",
    flightNumber: "LA 2088",
    originalPrice: 340,
    resalePrice: 169,
    baggage: "23kg incluido",
    asiento: { tipo: "seleccionado", categoria: "ventana", numero: "11F" },
    seller: sellers[2],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-14),
    views: 178,
    interested: 11,
    datosPasajero: pasajeros.valeria,
    cargoAerolineaEstimado: cargoAerolineaEstimadoDefault(),
  },
  {
    id: "f-010",
    tipoBoleto: "solo_ida",
    tramoIda: {
      origin: airports.LIM,
      destination: airports.CUZ,
      departureAt: hoursFromNow(240),
      durationMin: 85,
    },
    tramoRegreso: null,
    tramoAVender: "ida",
    airline: "JetSmart",
    flightNumber: "JA 220",
    originalPrice: 290,
    resalePrice: 155,
    baggage: "solo cabina",
    asiento: { tipo: "seleccionado", categoria: "ventana", numero: "20A" },
    seller: sellers[4],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-30),
    views: 89,
    interested: 5,
    datosPasajero: pasajeros.lucia,
    cargoAerolineaEstimado: cargoAerolineaEstimadoDefault(),
  },
];

export const airportsList = Object.values(airports);
export const airlines = ["LATAM", "Sky Airline", "JetSmart"] as const;

// Chat interno ligado a una transacción específica — nunca WhatsApp ni el teléfono real de
// nadie. Es el único canal de coordinación entre comprador y vendedor, y queda con historial
// revisable por la plataforma si alguna de las partes reporta un problema.
export interface ChatMensaje {
  autor: "comprador" | "vendedor";
  texto: string;
  timestamp: string; // ISO
}

// El documento de identidad del comprador nunca se pide por chat de texto libre — el
// vendedor lo necesita para el trámite de endoso (la aerolínea exige identificar al nuevo
// titular), así que va en un formulario estructurado propio, visible solo para el vendedor
// de esta transacción específica.
export type TipoDocumento = "DNI" | "Pasaporte" | "Carné de Extranjería";

export interface DatosCompradorEndoso {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  completadoPorComprador: boolean;
}

export const datosCompradorEndosoDefault = (): DatosCompradorEndoso => ({
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  tipoDocumento: "DNI",
  numeroDocumento: "",
  completadoPorComprador: false,
});

// Mock user transactions
export interface Transaction {
  id: string;
  flightId: string;
  role: "buyer" | "seller";
  state: "pago_retenido" | "vendedor_inicia" | "confirmado" | "liberado" | "reembolsado";
  amount: number;
  createdAt: string;
  // Solo existe una vez que hay comprador — el "trámite en curso" de esta transacción
  // específica es lo que determina el neto final que se libera del escrow.
  cargoAerolineaConfirmado: CargoAerolineaConfirmado;
  chatMensajes: ChatMensaje[];
  datosCompradorEndoso: DatosCompradorEndoso;
}

export const transactions: Transaction[] = [
  {
    id: "t-101",
    // Comprador con trámite recién iniciado: todavía no mandó sus datos de endoso ni
    // escribió al vendedor — caso interactivo para probar el formulario y el chat vacíos.
    flightId: "f-001",
    role: "buyer",
    state: "vendedor_inicia",
    amount: 219,
    createdAt: hoursFromNow(-3),
    cargoAerolineaConfirmado: cargoAerolineaConfirmadoDefault(),
    chatMensajes: [],
    datosCompradorEndoso: datosCompradorEndosoDefault(),
  },
  {
    id: "t-102",
    // Vendedor con datos del comprador ya recibidos y una conversación en curso por el
    // chat interno — nunca por WhatsApp ni exponiendo el teléfono real de nadie.
    flightId: "f-003",
    role: "seller",
    state: "pago_retenido",
    amount: 129,
    createdAt: hoursFromNow(-1),
    cargoAerolineaConfirmado: cargoAerolineaConfirmadoDefault(),
    chatMensajes: [
      {
        autor: "comprador",
        texto: "Hola! Ya te envié mis datos para el endoso, cualquier cosa avísame.",
        timestamp: hoursFromNow(-0.8),
      },
      {
        autor: "vendedor",
        texto: "Perfecto, gracias. Inicio el trámite con la aerolínea hoy mismo.",
        timestamp: hoursFromNow(-0.5),
      },
    ],
    datosCompradorEndoso: {
      nombres: "Fernando",
      apellidoPaterno: "Salazar",
      apellidoMaterno: "Vega",
      tipoDocumento: "DNI",
      numeroDocumento: "72841093",
      completadoPorComprador: true,
    },
  },
  {
    id: "t-103",
    flightId: "f-009",
    role: "buyer",
    state: "liberado",
    amount: 169,
    createdAt: hoursFromNow(-72),
    cargoAerolineaConfirmado: cargoAerolineaConfirmadoDefault(),
    chatMensajes: [],
    datosCompradorEndoso: { ...datosCompradorEndosoDefault(), completadoPorComprador: true },
  },
  {
    id: "t-104",
    // Trámite en curso como vendedor: acá es donde se reporta el cargo confirmado con
    // evidencia, y donde todavía se está esperando que el comprador mande sus datos.
    flightId: "f-004",
    role: "seller",
    state: "vendedor_inicia",
    amount: 289,
    createdAt: hoursFromNow(-1),
    cargoAerolineaConfirmado: cargoAerolineaConfirmadoDefault(),
    chatMensajes: [],
    datosCompradorEndoso: datosCompradorEndosoDefault(),
  },
  {
    id: "t-105",
    // Ejemplo con el cargo ya verificado y aceptado — el neto final ya refleja el descuento.
    flightId: "f-002",
    role: "seller",
    state: "confirmado",
    amount: 149,
    createdAt: hoursFromNow(-6),
    cargoAerolineaConfirmado: {
      monto: 12,
      origen: "reportado_por_vendedor",
      evidenciaUrl: "https://picsum.photos/seed/t-105-evidencia/600/400",
      estadoVerificacion: "aceptado",
      momentoDisponible: "confirmado_en_tramite",
      revisionManualRequerida: false,
    },
    chatMensajes: [
      {
        autor: "vendedor",
        texto: "¿Ya recibiste el correo de confirmación de la aerolínea?",
        timestamp: hoursFromNow(-2),
      },
    ],
    datosCompradorEndoso: {
      nombres: "Karla",
      apellidoPaterno: "Bravo",
      apellidoMaterno: "Núñez",
      tipoDocumento: "DNI",
      numeroDocumento: "68312450",
      completadoPorComprador: true,
    },
  },
  {
    id: "t-106",
    // Ejemplo de caso límite: el cargo reportado (S/76) supera el 50% del precio de
    // venta (S/79) → queda pendiente con revisionManualRequerida y, si se acepta, el
    // neto final se calcula con la comisión efectiva (piso en S/0, nunca negativo).
    flightId: "f-006",
    role: "seller",
    state: "confirmado",
    amount: 79,
    createdAt: hoursFromNow(-2),
    cargoAerolineaConfirmado: {
      monto: 76,
      origen: "reportado_por_vendedor",
      evidenciaUrl: "https://picsum.photos/seed/t-106-evidencia/600/400",
      estadoVerificacion: "pendiente_revision",
      momentoDisponible: "confirmado_en_tramite",
      revisionManualRequerida: true,
    },
    chatMensajes: [],
    datosCompradorEndoso: datosCompradorEndosoDefault(),
  },
];

export const currentUser = {
  id: "u-me",
  name: "Andrea Salazar",
  handle: "@andreasal",
  avatar: "AS",
  avatarUrl: "https://i.pravatar.cc/150?img=5",
  verifiedId: true,
  memberSince: "2024",
  ratingBuyer: 4.9,
  reviewsBuyer: 8,
  ratingSeller: 4.85,
  reviewsSeller: 12,
  dni: "•••••4821",
  phone: "+51 9•• ••1 342",
  email: "andrea@•••.pe",
};

export const testimonials = [
  {
    name: "Miguel A.",
    avatarUrl: "https://i.pravatar.cc/150?img=14",
    role: "Compró Lima → Cusco",
    quote:
      "Encontré un pasaje a Cusco por S/ 149 con 8 horas de anticipación. El pago quedó retenido hasta que la aerolínea me pasó el ticket a mi nombre. Cero fricción.",
  },
  {
    name: "Renata V.",
    avatarUrl: "https://i.pravatar.cc/150?img=29",
    role: "Vendió Lima → Piura",
    quote:
      "Recuperé el 70% de un pasaje que iba a perder. Todo el trámite con LATAM se manejó desde la app.",
  },
  {
    name: "Joaquín F.",
    avatarUrl: "https://i.pravatar.cc/150?img=51",
    role: "Compró Cusco → Lima",
    quote:
      "La sección de última llamada es honesta: te avisa cuánto tiempo real queda para completar el endoso. Nunca sentí que me apuraran a pagar.",
  },
];
