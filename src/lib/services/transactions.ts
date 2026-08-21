import { supabase } from "../supabase";
import { mapDbFlightToFrontend } from "./flights";
import type { Transaction, CargoAerolineaEstado } from "../mock-data";

// Estados reales confirmados contra la tabla `transactions` de Supabase — la
// disputa se llama "disputa", no "en_disputa" (confirmado probando el enum
// directamente, ver memoria de la migración). "reembolsado" se agregó después
// para el caso de la aerolínea rechazando el cambio de nombre a mitad de trámite.
export type TransactionState =
  "pago_retenido" | "vendedor_inicia" | "confirmado" | "liberado" | "disputa" | "reembolsado";

export interface NewTransactionInput {
  flight_id: string;
  buyer_id: string;
  seller_id: string;
  agreed_price: number;
  platform_fee: number;
}

// IDs de vuelos que ya tienen comprador (transacción real creada) — se usa para
// no mostrar en "Publicados" una oferta que ya se vendió.
export async function getSoldFlightIds(sellerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("flight_id")
    .eq("seller_id", sellerId);

  if (error) {
    console.error("Error fetching sold flight ids:", error);
    throw error;
  }

  return data.map((row) => row.flight_id as string);
}

// La transacción real de un vuelo, vista por el usuario logueado — RLS ("Participantes
// ven la transacción": buyer_id=auth.uid() OR seller_id=auth.uid()) hace que esto
// devuelva null tanto si el vuelo no tiene comprador todavía como si quien mira no es
// parte de la transacción, sin necesitar distinguir ambos casos a mano.
export async function getTransactionForFlight(flightId: string, userId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("flight_id", flightId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching transaction for flight:", error);
    throw error;
  }

  return data ? mapDbTransactionToFrontend(data, userId) : null;
}

// Crea la transacción al confirmar el pago — requiere sesión real de Supabase,
// igual que createFlight: la política de RLS exige que buyer_id = auth.uid().
export async function createTransaction(input: NewTransactionInput) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([{ ...input, state: "pago_retenido" satisfies TransactionState }])
    .select()
    .single();

  if (error) {
    console.error("Error creating transaction:", error);
    // 23505 = unique_violation — alguien más ya compró este mismo vuelo
    // (constraint transactions_flight_id_unique), casi siempre porque dos
    // personas confirmaron el pago casi al mismo tiempo.
    if (error.code === "23505") {
      throw new Error(
        "Este pasaje ya fue vendido a otra persona. Actualiza la página e intenta con otro.",
      );
    }
    throw error;
  }

  return data;
}

// Todas mis transacciones (como comprador o vendedor), con el vuelo asociado
// ya incluido — evita tener que cruzarlas a mano contra la lista de vuelos.
export async function getMyTransactions(userId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      flights (
        *,
        profiles:seller_id ( id, first_name, last_name, is_verified )
      )
    `,
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my transactions:", error);
    throw error;
  }

  return data;
}

// Mapea una fila cruda de la tabla `transactions` (con su `flights` embebido)
// al formato que ya espera la UI (el mismo shape que el `Transaction` mock) —
// así el resto del dashboard no necesita dos rutas de renderizado distintas.
// `isReal: true` marca lo que todavía no está conectado de verdad (chat,
// disputas, verificación detallada del cargo de aerolínea) para poder ocultar
// esas partes en vez de fingir que funcionan.
export function mapDbTransactionToFrontend(dbTx: any, currentUserId: string): Transaction {
  const role: "buyer" | "seller" = dbTx.buyer_id === currentUserId ? "buyer" : "seller";
  const state = dbTx.state === "disputa" ? "en_disputa" : dbTx.state;

  return {
    id: dbTx.id,
    flightId: dbTx.flight_id,
    role,
    state,
    amount: Number(dbTx.agreed_price),
    createdAt: dbTx.created_at,
    cargoAerolineaConfirmado: {
      monto: Number(dbTx.confirmed_airline_fee ?? 0),
      origen: dbTx.confirmed_airline_fee
        ? ("reportado_por_vendedor" as const)
        : ("default_legal" as const),
      evidenciaUrl: dbTx.transfer_evidence_url,
      estadoVerificacion: (dbTx.cargo_verification_status ?? "no_aplica") as CargoAerolineaEstado,
      momentoDisponible: "confirmado_en_tramite" as const,
      revisionManualRequerida: dbTx.cargo_manual_review_required ?? false,
    },
    chatMensajes: [],
    datosCompradorEndoso: dbTx.buyer_transfer_data ?? {
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      tipoDocumento: "DNI" as const,
      numeroDocumento: "",
      completadoPorComprador: false,
    },
    isReal: true,
    flight: dbTx.flights ? mapDbFlightToFrontend(dbTx.flights) : null,
    buyerConfirmedOk: dbTx.buyer_confirmed_ok ?? false,
    estadoAnteriorDisputa: dbTx.state_before_dispute ?? undefined,
    reporte: dbTx.report_reason
      ? {
          motivo: dbTx.report_reason,
          detalle: dbTx.report_detail ?? "",
          createdAt: dbTx.report_created_at ?? dbTx.created_at,
        }
      : undefined,
  };
}

// El vendedor (o comprador) reporta un problema — pausa el pago retenido
// congelando el paso del timeline en el que estaba antes de la disputa, para
// no perderlo mientras se resuelve el caso.
export async function reportProblem(
  id: string,
  previousState: TransactionState,
  motivo: string,
  detalle: string,
) {
  const { error } = await supabase
    .from("transactions")
    .update({
      state: "disputa" satisfies TransactionState,
      state_before_dispute: previousState,
      report_reason: motivo,
      report_detail: detalle,
      report_created_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Error reporting problem:", error);
    throw error;
  }
}

// Sin panel de soporte real todavía — quien reportó el problema (normalmente
// el vendedor, tras confirmar con la aerolínea que el cambio no procede) es
// quien marca la resolución. No hay transferencia real: el dinero nunca salió
// de una pasarela de verdad, así que "reembolsar" es solo el cambio de estado.
export async function resolveRefund(id: string) {
  const { error } = await supabase
    .from("transactions")
    .update({ state: "reembolsado" satisfies TransactionState })
    .eq("id", id);
  if (error) {
    console.error("Error resolving refund:", error);
    throw error;
  }
}

// Evidencia (foto/PDF) que el vendedor sube para justificar el cargo que le
// cobró la aerolínea — nunca se acepta un monto reportado sin ella.
export async function uploadCargoEvidence(
  userId: string,
  transactionId: string,
  file: File,
): Promise<string> {
  const path = `${userId}/${transactionId}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("cargo-evidence").upload(path, file);
  if (uploadError) {
    console.error("Error uploading cargo evidence:", uploadError);
    throw uploadError;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("cargo-evidence").getPublicUrl(path);
  return publicUrl;
}

// El vendedor reporta el cargo real cobrado por la aerolínea. Si supera el 50%
// del precio de venta, no se acepta automáticamente (aunque tenga evidencia)
// y queda pendiente de que un admin lo confirme en /admin/revisiones.
export async function reportConfirmedCargo(
  id: string,
  monto: number,
  evidenciaUrl: string,
  requiereRevisionManual: boolean,
) {
  const { error } = await supabase
    .from("transactions")
    .update({
      confirmed_airline_fee: monto,
      transfer_evidence_url: evidenciaUrl,
      cargo_verification_status: requiereRevisionManual ? "pendiente_revision" : "aceptado",
      cargo_manual_review_required: requiereRevisionManual,
    })
    .eq("id", id);
  if (error) {
    console.error("Error reporting confirmed cargo:", error);
    throw error;
  }
}

// Transacciones con un cargo reportado que superó el umbral y espera revisión
// manual — solo una cuenta is_admin puede leerlas (política "Admin actualiza
// cualquier transacción" cubre también el select, ver RLS).
export async function getPendingCargoReviews() {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      flights ( origin_code, destination_code, airline, booking_code ),
      buyer:buyer_id ( first_name, last_name, email ),
      seller:seller_id ( first_name, last_name, email )
    `,
    )
    .eq("cargo_verification_status", "pendiente_revision")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending cargo reviews:", error);
    throw error;
  }

  return data;
}

export async function resolveCargoReview(id: string, decision: "aceptado" | "rechazado") {
  const { error } = await supabase
    .from("transactions")
    .update(
      decision === "aceptado"
        ? { cargo_verification_status: "aceptado" }
        : { cargo_verification_status: "rechazado", confirmed_airline_fee: 0 },
    )
    .eq("id", id);
  if (error) {
    console.error("Error resolving cargo review:", error);
    throw error;
  }
}

// El comprador confirma que revisó el pasaje/evidencia y está todo bien —
// recién ahí el vendedor puede liberar el pago retenido (ver buyerConfirmedOk).
export async function confirmBuyerOk(id: string) {
  const { error } = await supabase
    .from("transactions")
    .update({ buyer_confirmed_ok: true })
    .eq("id", id);
  if (error) {
    console.error("Error confirming buyer ok:", error);
    throw error;
  }
}

export async function updateTransactionState(id: string, state: TransactionState) {
  const { error } = await supabase.from("transactions").update({ state }).eq("id", id);
  if (error) {
    console.error("Error updating transaction state:", error);
    throw error;
  }
}

export async function updateBuyerTransferData(id: string, data: unknown) {
  const { error } = await supabase
    .from("transactions")
    .update({ buyer_transfer_data: data })
    .eq("id", id);
  if (error) {
    console.error("Error updating buyer transfer data:", error);
    throw error;
  }
}
