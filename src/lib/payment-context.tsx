import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import {
  getPaymentMethods,
  upsertPaymentMethods,
  type DbPaymentMethods,
} from "./services/payment-methods";

// Cómo el vendedor recibe el neto liberado de una venta — configurado una sola vez
// en su perfil y reutilizado en cualquier "Liberar pago retenido". Con sesión real
// de Supabase se guarda en `payment_methods`; en modo simulado (sin auth.uid())
// sigue viviendo en localStorage, igual que el resto del estado simulado.
export type MetodoCobroTipo = "yape" | "cuenta_bancaria";

export interface MetodoCobro {
  tipo: MetodoCobroTipo;
  yapeNumero?: string;
  bancoNombre?: string;
  cci?: string;
}

// Método de pago guardado del comprador — se preselecciona (no obliga) en el modal
// de pago al comprar un vuelo.
export type MetodoPagoTipo = "yape" | "tarjeta" | "transferencia";

export interface MetodoPagoGuardado {
  tipo: MetodoPagoTipo;
  detalle: string;
}

const COBRO_KEY = "traspaso_metodo_cobro";
const PAGO_KEY = "traspaso_metodo_pago_guardado";

function dbToMetodoCobro(row: DbPaymentMethods | null): MetodoCobro | null {
  if (!row?.cobro_tipo) return null;
  if (row.cobro_tipo === "yape") {
    return { tipo: "yape", yapeNumero: row.cobro_yape_numero ?? "" };
  }
  return {
    tipo: "cuenta_bancaria",
    bancoNombre: row.cobro_banco_nombre ?? "",
    cci: row.cobro_cci ?? "",
  };
}

function dbToMetodoPago(row: DbPaymentMethods | null): MetodoPagoGuardado | null {
  if (!row?.pago_tipo || !row.pago_detalle) return null;
  return { tipo: row.pago_tipo, detalle: row.pago_detalle };
}

interface PaymentContextType {
  metodoCobro: MetodoCobro | null;
  setMetodoCobro: (m: MetodoCobro) => void;
  metodoPago: MetodoPagoGuardado | null;
  setMetodoPago: (m: MetodoPagoGuardado) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isRealUser = !!user && !user.id.startsWith("sim-");
  const [metodoCobro, setMetodoCobroState] = useState<MetodoCobro | null>(null);
  const [metodoPago, setMetodoPagoState] = useState<MetodoPagoGuardado | null>(null);

  useEffect(() => {
    if (isRealUser) {
      getPaymentMethods(user!.id)
        .then((row) => {
          setMetodoCobroState(dbToMetodoCobro(row));
          setMetodoPagoState(dbToMetodoPago(row));
        })
        .catch(() => {
          // Silencioso: si falla, simplemente no hay método precargado.
        });
      return;
    }
    const c = localStorage.getItem(COBRO_KEY);
    if (c) setMetodoCobroState(JSON.parse(c));
    const p = localStorage.getItem(PAGO_KEY);
    if (p) setMetodoPagoState(JSON.parse(p));
  }, [isRealUser, user]);

  const setMetodoCobro = (m: MetodoCobro) => {
    setMetodoCobroState(m);
    if (isRealUser) {
      upsertPaymentMethods(user!.id, {
        cobro_tipo: m.tipo,
        cobro_yape_numero: m.tipo === "yape" ? (m.yapeNumero ?? null) : null,
        cobro_banco_nombre: m.tipo === "cuenta_bancaria" ? (m.bancoNombre ?? null) : null,
        cobro_cci: m.tipo === "cuenta_bancaria" ? (m.cci ?? null) : null,
      }).catch(() => {});
      return;
    }
    localStorage.setItem(COBRO_KEY, JSON.stringify(m));
  };

  const setMetodoPago = (m: MetodoPagoGuardado) => {
    setMetodoPagoState(m);
    if (isRealUser) {
      upsertPaymentMethods(user!.id, { pago_tipo: m.tipo, pago_detalle: m.detalle }).catch(
        () => {},
      );
      return;
    }
    localStorage.setItem(PAGO_KEY, JSON.stringify(m));
  };

  return (
    <PaymentContext.Provider value={{ metodoCobro, setMetodoCobro, metodoPago, setMetodoPago }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const ctx = useContext(PaymentContext);
  if (ctx === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return ctx;
}
