import { supabase } from "../supabase";

export type NotificationType =
  "compra_confirmada" | "endoso_enviado" | "estado_cambiado" | "disputa_abierta";

export interface DbNotification {
  id: string;
  user_id: string;
  transaction_id: string | null;
  type: NotificationType;
  title: string;
  detail: string;
  href: string | null;
  read: boolean;
  created_at: string;
}

export async function getMyNotifications(userId: string): Promise<DbNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  return data;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) {
    console.error("Error marking notification read:", error);
    throw error;
  }
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) {
    console.error("Error marking all notifications read:", error);
    throw error;
  }
}

// Suscripción en tiempo real: cuando el trigger de Postgres inserta una fila
// nueva para este usuario, la llamamos sin que tenga que recargar la página.
// El trigger corre con `security definer`, así que nunca hay un INSERT desde
// el cliente que pueda saltarse la policy de RLS.
export function subscribeToMyNotifications(
  userId: string,
  onInsert: (row: DbNotification) => void,
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as DbNotification),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
