import { supabase } from "../supabase";
import type { Flight } from "../mock-data"; // Usaremos temporalmente los tipos de mock-data hasta redefinirlos completamente

// Función para obtener vuelos activos
export async function getActiveFlights() {
  const { data, error } = await supabase
    .from("flights")
    .select(
      `
      *,
      profiles:seller_id (
        id,
        first_name,
        last_name,
        is_verified,
        avatar_url,
        created_at,
        completed_transfers
      )
    `,
    )
    .in("status", ["active", "last_call"])
    .order("departure_date", { ascending: true });

  if (error) {
    console.error("Error fetching flights:", error);
    throw error;
  }

  // Mapear el formato de BD al formato esperado por el frontend
  // Nota: Esto es un puente temporal para no romper la UI de un golpe
  return data.map((dbFlight) => mapDbFlightToFrontend(dbFlight));
}

export async function getFlightById(id: string) {
  const { data, error } = await supabase
    .from("flights")
    .select(
      `
      *,
      profiles:seller_id (
        id,
        first_name,
        last_name,
        is_verified,
        avatar_url,
        created_at,
        completed_transfers
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching flight ${id}:`, error);
    throw error;
  }

  return mapDbFlightToFrontend(data);
}

// Todas las publicaciones del vendedor (cualquier status: active, last_call,
// retirado) — usada en "Mis operaciones → Publicados/Retirados", a diferencia
// de getActiveFlights que solo trae lo visible en el marketplace.
export async function getMyFlights(sellerId: string) {
  const { data, error } = await supabase
    .from("flights")
    .select(
      `
      *,
      profiles:seller_id (
        id,
        first_name,
        last_name,
        is_verified,
        avatar_url,
        created_at,
        completed_transfers
      )
    `,
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my flights:", error);
    throw error;
  }

  return data.map((dbFlight) => mapDbFlightToFrontend(dbFlight));
}

// Retirar una publicación — no la borra, solo cambia su status a "cancelled"
// (el enum flight_status real no tiene "retirado"; "cancelled" ya existe y es
// el valor semánticamente correcto) para que desaparezca del marketplace
// (getActiveFlights solo trae active/last_call) mientras queda visible en el
// historial del vendedor.
export async function withdrawFlight(flightId: string) {
  // .select() es necesario para poder distinguir "sí actualizó una fila" de
  // "RLS bloqueó el update en silencio" — sin él, Supabase no reporta error
  // cuando la política de UPDATE no existe o no matchea, solo afecta 0 filas.
  const { data, error } = await supabase
    .from("flights")
    .update({ status: "cancelled" })
    .eq("id", flightId)
    .select();

  if (error) {
    console.error("Error withdrawing flight:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "No se pudo retirar el vuelo — probablemente falta la política de UPDATE en la tabla flights, o no eres el dueño de esta publicación.",
    );
  }
}

export interface NewFlightInput {
  ticket_type: "solo_ida" | "ida_y_vuelta";
  origin_code: string;
  origin_city: string;
  destination_code: string;
  destination_city: string;
  departure_date: string;
  return_date: string | null;
  sell_segment: "ida" | "regreso" | "ambos";
  airline: string;
  booking_code: string;
  original_price: number;
  resale_price: number;
  seat_outbound: unknown;
  seat_return: unknown;
  airline_fee_estimate: number | null;
  status: "active" | "last_call" | "pendiente_revision";
  seller_id: string;
  reservation_code: string;
  voucher_url: string | null;
  seller_note: string | null;
}

// Sube el comprobante de reserva (PDF o imagen) que se revisa manualmente
// antes de aprobar la publicación — sin esto, "Subir boleto" no subía nada
// de verdad, solo marcaba una casilla en el formulario.
export async function uploadFlightVoucher(userId: string, file: File): Promise<string> {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("flight-vouchers").upload(path, file);
  if (uploadError) {
    console.error("Error uploading flight voucher:", uploadError);
    throw uploadError;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("flight-vouchers").getPublicUrl(path);
  return publicUrl;
}

// Publicar un pasaje nuevo — requiere una sesión real de Supabase: la política de
// RLS de "flights" exige que seller_id coincida con auth.uid(), así que esto falla
// si el usuario está en modo simulado (ver auth-context.tsx).
export async function createFlight(input: NewFlightInput) {
  const { data, error } = await supabase.from("flights").insert([input]).select().single();

  if (error) {
    console.error("Error creating flight:", error);
    throw error;
  }

  return mapDbFlightToFrontend(data);
}

// Editar una publicación existente — solo campos que ya tenían columna real en
// la tabla (precio, fechas, aerolínea, asientos, cargo estimado); el flujo de
// creación también pide código de reserva/datos del pasajero/equipaje, pero esos
// nunca se persisten, así que no forman parte de esta edición. Misma política de
// UPDATE que withdrawFlight — falla en silencio sin el .select() de verificación.
export async function updateFlight(id: string, input: Partial<NewFlightInput>) {
  const { data, error } = await supabase
    .from("flights")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating flight:", error);
    throw error;
  }

  return mapDbFlightToFrontend(data);
}

// Publicaciones pendientes de revisión — solo una cuenta con profiles.is_admin
// puede leer estas filas de vendedores ajenos (ver política de RLS "Admin ve
// todos los vuelos"); para cualquier otro usuario esto simplemente no trae nada.
export async function getPendingFlights() {
  const { data, error } = await supabase
    .from("flights")
    .select(
      `
      *,
      profiles:seller_id ( id, first_name, last_name, email )
    `,
    )
    .eq("status", "pendiente_revision")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending flights:", error);
    throw error;
  }

  return data;
}

export async function approveFlight(id: string) {
  const { error } = await supabase.from("flights").update({ status: "active" }).eq("id", id);
  if (error) {
    console.error("Error approving flight:", error);
    throw error;
  }
}

export async function rejectFlight(id: string, motivo: string, detalle: string) {
  const { error } = await supabase
    .from("flights")
    .update({
      status: "rechazado",
      rejection_reason: motivo,
      rejection_detail: detalle.trim() || null,
    })
    .eq("id", id);
  if (error) {
    console.error("Error rejecting flight:", error);
    throw error;
  }
}

// Incrementa (o decrementa, con delta negativo) un contador de la oferta —
// vistas, interesados o guardados — vía función de Postgres, para evitar
// condiciones de carrera si dos personas actúan sobre el mismo vuelo a la vez.
export async function incrementFlightCounter(
  flightId: string,
  counter: "views" | "interested_count" | "saved_count",
  delta: number,
) {
  const { error } = await supabase.rpc("increment_flight_counter", {
    flight_id: flightId,
    counter_name: counter,
    delta,
  });
  if (error) {
    console.error(`Error incrementing ${counter}:`, error);
  }
}

// Función auxiliar para mapear de la DB al frontend
export function mapDbFlightToFrontend(dbFlight: any): any {
  return {
    id: dbFlight.id,
    tipoBoleto: dbFlight.ticket_type,
    tramoIda: {
      origin: { code: dbFlight.origin_code, city: dbFlight.origin_city, region: "" },
      destination: { code: dbFlight.destination_code, city: dbFlight.destination_city, region: "" },
      departureAt: dbFlight.departure_date,
      durationMin: 0, // A calcular luego o almacenar en BD
    },
    tramoRegreso:
      dbFlight.ticket_type === "ida_y_vuelta"
        ? {
            origin: {
              code: dbFlight.destination_code,
              city: dbFlight.destination_city,
              region: "",
            },
            destination: { code: dbFlight.origin_code, city: dbFlight.origin_city, region: "" },
            departureAt: dbFlight.return_date,
            durationMin: 0,
          }
        : null,
    tramoAVender: dbFlight.sell_segment,
    airline: dbFlight.airline,
    flightNumber: dbFlight.booking_code, // Usando PNR como flightNumber temporalmente
    originalPrice: Number(dbFlight.original_price),
    resalePrice: Number(dbFlight.resale_price),
    baggage: "cabina + 23kg", // Dummy por ahora
    asientoIda: dbFlight.seat_outbound || null,
    asientoRegreso: dbFlight.seat_return || null,
    seller: {
      // Siempre desde flights.seller_id (nunca null) — el join a profiles solo
      // aporta datos de despliegue (nombre/foto), no la identidad del vendedor.
      // Si el profile no existe, esto evita mandar un seller_id vacío al crear
      // una transacción (violaba el NOT NULL de la tabla transactions).
      id: dbFlight.seller_id,
      name: `${dbFlight.profiles?.first_name} ${dbFlight.profiles?.last_name}`,
      avatar: dbFlight.profiles?.first_name?.charAt(0) || "U",
      avatarUrl:
        dbFlight.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${dbFlight.seller_id}`,
      // Sin sistema de reseñas todavía — el rating sigue fijo hasta que exista.
      rating: 5.0,
      reviews: dbFlight.profiles?.completed_transfers ?? 0,
      verifiedId: dbFlight.profiles?.is_verified || false,
      memberSince: dbFlight.profiles?.created_at
        ? String(new Date(dbFlight.profiles.created_at).getFullYear())
        : "—",
    },
    note: dbFlight.seller_note || undefined,
    rejectionReason: dbFlight.rejection_reason || undefined,
    rejectionDetail: dbFlight.rejection_detail || undefined,
    sellerAllowsLastCall: dbFlight.status === "last_call",
    // Status crudo de la BD (incluye "cancelled"/"sold", que computeStatus() no
    // conoce — ese helper solo deriva active/last_call/expired a partir de la fecha).
    dbStatus: dbFlight.status,
    createdAt: dbFlight.created_at,
    views: dbFlight.views ?? 0,
    interested: dbFlight.interested_count ?? 0,
    savedCount: dbFlight.saved_count ?? 0,
    cargoAerolineaEstimado: {
      monto: Number(dbFlight.airline_fee_estimate),
      ingresadoPorVendedor: true,
      verificado: false,
    },
  };
}
