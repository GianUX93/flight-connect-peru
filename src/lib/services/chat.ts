import { supabase } from "../supabase";

export interface DbChatMessage {
  id: string;
  transaction_id: string;
  sender_id: string;
  text: string;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
}

export async function getChatMessages(transactionId: string): Promise<DbChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error);
    throw error;
  }

  return data;
}

export async function sendChatMessage(transactionId: string, senderId: string, text: string) {
  const { error } = await supabase
    .from("chat_messages")
    .insert([{ transaction_id: transactionId, sender_id: senderId, text }]);

  if (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
}

export async function sendChatAttachment(transactionId: string, senderId: string, file: File) {
  const path = `${transactionId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(path, file);

  if (uploadError) {
    console.error("Error uploading chat attachment:", uploadError);
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("chat-attachments").getPublicUrl(path);

  const { error } = await supabase.from("chat_messages").insert([
    {
      transaction_id: transactionId,
      sender_id: senderId,
      text: "",
      attachment_url: publicUrl,
      attachment_name: file.name,
    },
  ]);

  if (error) {
    console.error("Error saving chat attachment message:", error);
    throw error;
  }
}

// Suscripción en tiempo real por transacción — cada chat abierto se suscribe
// solo mientras está visible, así que el canal se cierra al cambiar de chat.
export function subscribeToChatMessages(
  transactionId: string,
  onInsert: (m: DbChatMessage) => void,
) {
  const channel = supabase
    .channel(`chat:${transactionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `transaction_id=eq.${transactionId}`,
      },
      (payload) => onInsert(payload.new as DbChatMessage),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
