import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Alerta = {
  id: string;
  tipo: "busqueda" | "estado" | "match";
  titulo: string;
  detalle: string;
  timestamp: string;
  leida: boolean;
  href?: string;
};

const seedAlertas: Alerta[] = [
  {
    id: "al-seed-1",
    tipo: "estado",
    titulo: "Endoso confirmado",
    detalle: "Tu compra del pasaje Lima → Cusco fue confirmada por la aerolínea.",
    timestamp: new Date(Date.now() - 3 * 3600_000).toISOString(),
    leida: false,
    href: "/dashboard",
  },
  {
    id: "al-seed-2",
    tipo: "estado",
    titulo: "Pago liberado",
    detalle: "El pago de tu venta fue liberado a tu cuenta.",
    timestamp: new Date(Date.now() - 26 * 3600_000).toISOString(),
    leida: true,
    href: "/dashboard",
  },
];

type AlertsContextValue = {
  alertas: Alerta[];
  unreadCount: number;
  addAlerta: (a: Omit<Alerta, "id" | "timestamp" | "leida">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alertas, setAlertas] = useState<Alerta[]>(seedAlertas);

  function addAlerta(a: Omit<Alerta, "id" | "timestamp" | "leida">) {
    setAlertas((prev) => [
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
    setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)));
  }

  function markAllRead() {
    setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
  }

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
