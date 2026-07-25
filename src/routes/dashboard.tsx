import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, Lock, ShoppingBag, Store } from "lucide-react";
import { flights, transactions, type Transaction } from "@/lib/mock-data";
import { S, fmtDate, computeStatus } from "@/lib/flight-utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Mis traspasos — Traspaso" },
      { name: "description", content: "Tus transacciones activas e historial como comprador y vendedor." },
      { property: "og:title", content: "Mis traspasos — Traspaso" },
      { property: "og:description", content: "Sigue el estado de tus pagos retenidos y liberados." },
    ],
  }),
  component: Dashboard,
});

const stateLabels: Record<Transaction["state"], string> = {
  pago_retenido: "Pago retenido",
  vendedor_inicia: "Vendedor inicia trámite",
  confirmado: "Traspaso confirmado",
  liberado: "Pago liberado",
  reembolsado: "Reembolsado",
};

const stateOrder: Transaction["state"][] = [
  "pago_retenido",
  "vendedor_inicia",
  "confirmado",
  "liberado",
];

function Dashboard() {
  const [tab, setTab] = useState<"all" | "buyer" | "seller">("all");
  const list = transactions.filter((t) => tab === "all" || t.role === tab);

  const retained = transactions
    .filter((t) => t.state !== "liberado" && t.state !== "reembolsado")
    .reduce((s, t) => s + t.amount, 0);
  const released = transactions
    .filter((t) => t.state === "liberado")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Hola, Andrea
          </div>
          <h1 className="mt-1 font-display text-4xl md:text-5xl">Mis traspasos</h1>
        </div>
        <Link
          to="/publish"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Publicar un pasaje
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card icon={<Lock className="h-4 w-4" />} label="Retenido en escrow" value={S(retained)} tone="signal" />
        <Card icon={<CheckCircle2 className="h-4 w-4" />} label="Liberado" value={S(released)} />
        <Card icon={<ShoppingBag className="h-4 w-4" />} label="Transacciones" value={String(transactions.length)} />
      </div>

      <div className="mt-8 inline-flex rounded-full border border-hairline bg-surface p-1">
        {(["all", "buyer", "seller"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ${
              tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {k === "buyer" && <ShoppingBag className="h-3.5 w-3.5" />}
            {k === "seller" && <Store className="h-3.5 w-3.5" />}
            {k === "all" ? "Todas" : k === "buyer" ? "Como comprador" : "Como vendedor"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {list.map((t) => {
          const flight = flights.find((f) => f.id === t.flightId)!;
          const status = computeStatus(flight);
          const stateIdx = stateOrder.indexOf(t.state);
          return (
            <div key={t.id} className="rounded-2xl border border-hairline bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        t.role === "buyer"
                          ? "bg-signal/15 text-signal"
                          : "bg-surface-2 text-foreground"
                      }`}
                    >
                      {t.role === "buyer" ? "Compra" : "Venta"}
                    </span>
                    {flight.airline} · {flight.flightNumber}
                    {status === "last_call" && (
                      <span className="text-warn">· última llamada</span>
                    )}
                  </div>
                  <div className="mt-2 font-display text-2xl">
                    {flight.origin.city} → {flight.destination.city}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {fmtDate(flight.departureAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl">{S(t.amount)}</div>
                  <div className="text-xs text-muted-foreground">
                    {stateLabels[t.state]}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-5 grid grid-cols-4 gap-2">
                {stateOrder.map((s, i) => {
                  const done = i <= stateIdx;
                  return (
                    <div key={s} className="flex flex-col items-start gap-1.5">
                      <div className="flex w-full items-center gap-2">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-signal" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        )}
                        <div
                          className={`h-0.5 flex-1 ${
                            i < stateIdx ? "bg-signal" : "bg-hairline"
                          }`}
                        />
                      </div>
                      <div
                        className={`text-[11px] ${
                          done ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {stateLabels[s]}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/flight/$id"
                  params={{ id: flight.id }}
                  className="rounded-full border border-hairline px-4 py-1.5 text-xs hover:bg-surface-2"
                >
                  Ver detalle
                </Link>
                <button className="rounded-full border border-hairline px-4 py-1.5 text-xs hover:bg-surface-2">
                  Contactar {t.role === "buyer" ? "vendedor" : "comprador"}
                </button>
                {t.state !== "liberado" && (
                  <button className="rounded-full border border-hairline px-4 py-1.5 text-xs text-muted-foreground hover:bg-surface-2">
                    Reportar problema
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "signal";
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`grid h-6 w-6 place-items-center rounded-full ${
            tone === "signal" ? "bg-signal/15 text-signal" : "bg-surface-2"
          }`}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-2 font-display text-3xl">{value}</div>
    </div>
  );
}
