import { supabase } from "../supabase";

export async function getMySavedFlightIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_flights")
    .select("flight_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching saved flights:", error);
    throw error;
  }

  return data.map((row) => row.flight_id as string);
}

export async function saveFlight(userId: string, flightId: string) {
  const { error } = await supabase
    .from("saved_flights")
    .insert([{ user_id: userId, flight_id: flightId }]);

  if (error) {
    console.error("Error saving flight:", error);
    throw error;
  }
}

export async function unsaveFlight(userId: string, flightId: string) {
  const { error } = await supabase
    .from("saved_flights")
    .delete()
    .eq("user_id", userId)
    .eq("flight_id", flightId);

  if (error) {
    console.error("Error unsaving flight:", error);
    throw error;
  }
}
