import { supabase } from "../supabase";

export interface DbPaymentMethods {
  user_id: string;
  cobro_tipo: "yape" | "cuenta_bancaria" | null;
  cobro_yape_numero: string | null;
  cobro_banco_nombre: string | null;
  cobro_cci: string | null;
  pago_tipo: "yape" | "tarjeta" | "transferencia" | null;
  pago_detalle: string | null;
}

export async function getPaymentMethods(userId: string): Promise<DbPaymentMethods | null> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching payment methods:", error);
    throw error;
  }

  return data;
}

// Una sola fila por usuario (user_id es primary key) — upsert evita tener que
// distinguir "todavía no existe la fila" de "hay que actualizarla".
export async function upsertPaymentMethods(
  userId: string,
  fields: Partial<Omit<DbPaymentMethods, "user_id">>,
) {
  const { error } = await supabase
    .from("payment_methods")
    .upsert([{ user_id: userId, ...fields }], { onConflict: "user_id" });

  if (error) {
    console.error("Error saving payment methods:", error);
    throw error;
  }
}
