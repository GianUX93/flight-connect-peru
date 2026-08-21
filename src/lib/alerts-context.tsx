import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToMyNotifications,
  type DbNotification,
} from "./services/notifications";

export type Alerta = {
  id: string;
  tipo: "busqueda" | "estado" | "match";
  titulo: string;
  detalle: string;
  timestamp: string;
  leida: boolean;
  href?: string;
};

function dbNotificationToAlerta(n: DbNotification): Alerta {
  return {
    id: n.id,
    tipo: "estado",
    titulo: n.title,
    detalle: n.detail,
    timestamp: n.created_at,
    leida: n.read,
    href: n.href ?? undefined,
  };
}

type AlertsContextValue = {
  alertas: Alerta[];
  unreadCount: number;
  addAlerta: (a: Omit<Alerta, "id" | "timestamp" | "leida">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Alertas locales (ej. "avísame cuando haya resultados") — no viven en
  // Supabase porque no le interesan a nadie más que a este usuario en esta
  // sesión, a diferencia de las notificaciones reales de compra/venta.
  const [localAlertas, setLocalAlertas] = useState<Alerta[]>([]);
  const [dbAlertas, setDbAlertas] = useState<Alerta[]>([]);

  useEffect(() => {
    // Solo usuarios con sesión real de Supabase (no simulada) tienen fila en
    // auth.users, así que solo ellos pueden tener notificaciones reales.
    if (!user || user.id.startsWith("sim-")) {
      setDbAlertas([]);
      return;
    }

    let cancelled = false;
    getMyNotifications(user.id)
      .then((rows) => {
        if (!cancelled) setDbAlertas(rows.map(dbNotificationToAlerta));
      })
      .catch(() => {
        // Silencioso: si falla, simplemente no hay notificaciones reales que mostrar.
      });

    const unsubscribe = subscribeToMyNotifications(user.id, (row) => {
      setDbAlertas((prev) => [dbNotificationToAlerta(row), ...prev]);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  function addAlerta(a: Omit<Alerta, "id" | "timestamp" | "leida">) {
    setLocalAlertas((prev) => [
      {
        ...a,
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        leida: false,
      },
      ...prev,
    ]);
  }

  function markRead(id: string) {
    setLocalAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)));
    setDbAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)));
    if (dbAlertas.some((a) => a.id === id)) {
      markNotificationRead(id).catch(() => {});
    }
  }

  function markAllRead() {
    setLocalAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
    setDbAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
    if (user && !user.id.startsWith("sim-")) {
      markAllNotificationsRead(user.id).catch(() => {});
    }
  }

  const alertas = useMemo(
    () =>
      [...localAlertas, ...dbAlertas].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [localAlertas, dbAlertas],
  );

  const unreadCount = useMemo(() => alertas.filter((a) => !a.leida).length, [alertas]);

  return (
    <AlertsContext.Provider value={{ alertas, unreadCount, addAlerta, markRead, markAllRead }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error("useAlerts debe usarse dentro de AlertsProvider");
  return ctx;
}
