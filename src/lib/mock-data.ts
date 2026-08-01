// Mock inventory for the Traspaso prototype.
// Status is computed relative to `departureAt` and the persisted business flag `sellerAllowsLastCall`.
// - active: > 24h to departure and endoso is viable
// - last_call: < 24h but seller opted to keep it available (separate lane)
// - expired: departure passed OR sellerAllowsLastCall=false and <24h

export type FlightStatus = "active" | "last_call" | "expired";

export interface Airport {
  code: string;
  city: string;
  region: string;
}

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
  origin: Airport;
  destination: Airport;
  airline: "LATAM" | "Sky Airline" | "JetSmart";
  flightNumber: string;
  departureAt: string; // ISO
  durationMin: number;
  originalPrice: number; // soles
  resalePrice: number; // soles
  baggage: "solo cabina" | "23kg incluido" | "cabina + 23kg";
  seat: string;
  seller: Seller;
  sellerAllowsLastCall: boolean; // when <24h, whether it enters last_call lane
  createdAt: string;
  views: number;
  interested: number;
  note?: string;
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

export const flights: Flight[] = [
  {
    id: "f-001",
    origin: airports.LIM,
    destination: airports.CUZ,
    airline: "LATAM",
    flightNumber: "LA 2043",
    departureAt: hoursFromNow(72),
    durationMin: 85,
    originalPrice: 480,
    resalePrice: 219,
    baggage: "cabina + 23kg",
    seat: "12A ventana",
    seller: sellers[0],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-8),
    views: 214,
    interested: 18,
    note: "Cambio de planes familiares. Endoso permitido sin costo por LATAM.",
  },
  {
    id: "f-002",
    origin: airports.LIM,
    destination: airports.AQP,
    airline: "Sky Airline",
    flightNumber: "H2 831",
    departureAt: hoursFromNow(48),
    durationMin: 100,
    originalPrice: 310,
    resalePrice: 149,
    baggage: "solo cabina",
    seat: "18C pasillo",
    seller: sellers[1],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-4),
    views: 98,
    interested: 9,
  },
  {
    id: "f-003",
    origin: airports.LIM,
    destination: airports.PIU,
    airline: "JetSmart",
    flightNumber: "JA 411",
    departureAt: hoursFromNow(120),
    durationMin: 105,
    originalPrice: 265,
    resalePrice: 129,
    baggage: "solo cabina",
    seat: "07F ventana",
    seller: sellers[2],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-22),
    views: 341,
    interested: 24,
  },
  {
    id: "f-004",
    origin: airports.LIM,
    destination: airports.IQT,
    airline: "LATAM",
    flightNumber: "LA 2401",
    departureAt: hoursFromNow(200),
    durationMin: 115,
    originalPrice: 520,
    resalePrice: 289,
    baggage: "23kg incluido",
    seat: "22B centro",
    seller: sellers[4],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-2),
    views: 66,
    interested: 4,
  },
  {
    id: "f-005",
    origin: airports.CUZ,
    destination: airports.LIM,
    airline: "Sky Airline",
    flightNumber: "H2 214",
    departureAt: hoursFromNow(19), // last_call
    durationMin: 90,
    originalPrice: 360,
    resalePrice: 139,
    baggage: "solo cabina",
    seat: "09D pasillo",
    seller: sellers[0],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-3),
    views: 402,
    interested: 31,
    note: "Ya no puedo tomarlo. Endoso rápido, respondo en minutos.",
  },
  {
    id: "f-006",
    origin: airports.LIM,
    destination: airports.TRU,
    airline: "JetSmart",
    flightNumber: "JA 502",
    departureAt: hoursFromNow(9), // last_call, close margin
    durationMin: 75,
    originalPrice: 220,
    resalePrice: 79,
    baggage: "solo cabina",
    seat: "14A ventana",
    seller: sellers[3],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-1),
    views: 89,
    interested: 6,
  },
  {
    id: "f-007",
    origin: airports.LIM,
    destination: airports.TPP,
    airline: "LATAM",
    flightNumber: "LA 2311",
    departureAt: hoursFromNow(-6), // expired (past)
    durationMin: 95,
    originalPrice: 410,
    resalePrice: 179,
    baggage: "cabina + 23kg",
    seat: "05C pasillo",
    seller: sellers[1],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-40),
    views: 512,
    interested: 22,
  },
  {
    id: "f-008",
    origin: airports.LIM,
    destination: airports.CIX,
    airline: "Sky Airline",
    flightNumber: "H2 640",
    departureAt: hoursFromNow(14),
    durationMin: 80,
    originalPrice: 240,
    resalePrice: 99,
    baggage: "solo cabina",
    seat: "16E centro",
    seller: sellers[4],
    sellerAllowsLastCall: false, // <24h and seller withdrew → expired for the marketplace
    createdAt: hoursFromNow(-10),
    views: 61,
    interested: 2,
  },
  {
    id: "f-009",
    origin: airports.AQP,
    destination: airports.LIM,
    airline: "LATAM",
    flightNumber: "LA 2088",
    departureAt: hoursFromNow(96),
    durationMin: 95,
    originalPrice: 340,
    resalePrice: 169,
    baggage: "23kg incluido",
    seat: "11F ventana",
    seller: sellers[2],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-14),
    views: 178,
    interested: 11,
  },
  {
    id: "f-010",
    origin: airports.LIM,
    destination: airports.CUZ,
    airline: "JetSmart",
    flightNumber: "JA 220",
    departureAt: hoursFromNow(240),
    durationMin: 85,
    originalPrice: 290,
    resalePrice: 155,
    baggage: "solo cabina",
    seat: "20A ventana",
    seller: sellers[4],
    sellerAllowsLastCall: true,
    createdAt: hoursFromNow(-30),
    views: 89,
    interested: 5,
  },
];

export const airportsList = Object.values(airports);
export const airlines = ["LATAM", "Sky Airline", "JetSmart"] as const;

// Mock user transactions
export interface Transaction {
  id: string;
  flightId: string;
  role: "buyer" | "seller";
  state: "pago_retenido" | "vendedor_inicia" | "confirmado" | "liberado" | "reembolsado";
  amount: number;
  createdAt: string;
}

export const transactions: Transaction[] = [
  {
    id: "t-101",
    flightId: "f-001",
    role: "buyer",
    state: "vendedor_inicia",
    amount: 219,
    createdAt: hoursFromNow(-3),
  },
  {
    id: "t-102",
    flightId: "f-003",
    role: "seller",
    state: "pago_retenido",
    amount: 129,
    createdAt: hoursFromNow(-1),
  },
  {
    id: "t-103",
    flightId: "f-009",
    role: "buyer",
    state: "liberado",
    amount: 169,
    createdAt: hoursFromNow(-72),
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
