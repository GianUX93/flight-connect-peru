import { supabase } from "../supabase";

export async function updatePhone(userId: string, phone: string) {
  const { error } = await supabase.from("profiles").update({ phone }).eq("id", userId);
  if (error) {
    console.error("Error updating phone:", error);
    throw error;
  }
}
