import { supabase } from "../supabase";

export interface DbRouteAlert {
  id: string;
  user_id: string;
  origin_code: string;
  destination_code: string;
  created_at: string;
}

export async function getMyRouteAlerts(userId: string): Promise<DbRouteAlert[]> {
  const { data, error } = await supabase
    .from("route_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching route alerts:", error);
    throw error;
  }

  return data;
}

export async function createRouteAlert(
  userId: string,
  originCode: string,
  destinationCode: string,
) {
  const { error } = await supabase
    .from("route_alerts")
    .insert([{ user_id: userId, origin_code: originCode, destination_code: destinationCode }]);

  if (error) {
    console.error("Error creating route alert:", error);
    throw error;
  }
}

export async function deleteRouteAlert(id: string) {
  const { error } = await supabase.from("route_alerts").delete().eq("id", id);
  if (error) {
    console.error("Error deleting route alert:", error);
    throw error;
  }
}
