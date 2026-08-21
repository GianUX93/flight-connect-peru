import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface SimulatedProfile {
  first_name: string;
  last_name: string;
  apellido_materno: string;
  email: string;
  phone: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null; // We will define a strict profile type later
  isLoading: boolean;
  signOut: () => Promise<void>;
  simulateLogin: (data: Partial<SimulatedProfile> & { email: string }) => void;
  refreshProfile: () => Promise<void>;
}

// Cuando un usuario anónimo intenta pagar un vuelo, guardamos aquí qué vuelo era —
// para retomar exactamente esa compra apenas termine de iniciar sesión o registrarse,
// sin carrito ni estado en servidor. Se limpia apenas se retoma la compra.
export const PENDING_PURCHASE_KEY = "traspaso_pending_purchase";

// El registro real contra Supabase depende del proveedor de email por defecto, que
// tiene un límite de envíos muy bajo — mientras eso no esté resuelto (SMTP propio),
// el login/registro se simula 100% en el navegador, igual que el resto del
// prototipo (pagos, autocompletado por IA, etc.). Nunca toca la red.
const SIMULATED_SESSION_KEY = "traspaso_simulated_session";
const SIMULATED_USERS_KEY = "traspaso_simulated_users";

function readSimulatedSession(): SimulatedProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SIMULATED_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Usado antes de un login real (ej. con una cuenta creada a mano en el dashboard
// de Supabase para pruebas) — evita que una sesión simulada previa le gane a la
// sesión real en el próximo arranque de AuthProvider.
export function clearSimulatedSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SIMULATED_SESSION_KEY);
}

function simulatedProfileToUser(profile: SimulatedProfile): User {
  return {
    id: `sim-${profile.email}`,
    email: profile.email,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as unknown as User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const simulated = readSimulatedSession();
    if (simulated) {
      setUser(simulatedProfileToUser(simulated));
      setProfile(simulated);
      setIsLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simula login/registro sin tocar la red: busca si ya existe un perfil local
  // para ese email (registro previo), si no, arma uno mínimo a partir del email —
  // así "iniciar sesión" con un correo nunca antes registrado igual funciona.
  const simulateLogin = (data: Partial<SimulatedProfile> & { email: string }) => {
    const usersRaw = localStorage.getItem(SIMULATED_USERS_KEY);
    const users: Record<string, SimulatedProfile> = usersRaw ? JSON.parse(usersRaw) : {};
    const existing = users[data.email];
    const merged: SimulatedProfile = {
      email: data.email,
      first_name: data.first_name || existing?.first_name || data.email.split("@")[0],
      last_name: data.last_name || existing?.last_name || "",
      apellido_materno: data.apellido_materno || existing?.apellido_materno || "",
      phone: data.phone ?? existing?.phone ?? null,
    };
    users[data.email] = merged;
    localStorage.setItem(SIMULATED_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify(merged));
    setUser(simulatedProfileToUser(merged));
    setProfile(merged);
    setIsLoading(false);
  };

  const signOut = async () => {
    if (readSimulatedSession()) {
      localStorage.removeItem(SIMULATED_SESSION_KEY);
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  };

  // Vuelve a leer el perfil real desde Supabase — usado tras editar un campo
  // (ej. teléfono) para que el resto de la app refleje el cambio sin recargar.
  const refreshProfile = async () => {
    if (!user || readSimulatedSession()) return;
    await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, isLoading, signOut, simulateLogin, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Guard de rutas protegidas, resuelto 100% en el cliente. La sesión (real o
// simulada) vive en localStorage, invisible durante el render en servidor de
// TanStack Start — un `beforeLoad` que la consulte ahí siempre falla en la
// primera carga o en un refresh. Este hook evita ese problema: redirige desde
// un efecto una vez que el cliente ya sabe si hay sesión o no.
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [isLoading, user, navigate]);

  return { ready: !isLoading && !!user, isLoading };
}
