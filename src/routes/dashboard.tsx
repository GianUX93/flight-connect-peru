import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, Lock, ShoppingBag, Store, ChevronRight } from "lucide-react";
import { flights, transactions, type Transaction } from "@/lib/mock-data";
import { S, fmtDate, computeStatus } from "@/lib/flight-utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Mis traspasos — Traspaso" },
      { name: "description", content: "Tus transacciones activas e historial como comprador y vendedor." },
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
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]">
            Hola, Andrea
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold text-[var(--color-ink)]">Mis traspasos</h1>
        </div>
        <Link
          to="/publish"
          className="rounded-full bg-[var(--color-primary-token)] px-6 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105"
        >
          Publicar un pasaje
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card icon={<Lock className="h-5 w-5" />} label="Retenido en escrow" value={S(retained)} tone="signal" />
        <Card icon={<CheckCircle2 className="h-5 w-5" />} label="Liberado" value={S(released)} />
        <Card icon={<ShoppingBag className="h-5 w-5" />} label="Transacciones" value={String(transactions.length)} />
      </div>

      <div className="mt-10 inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
        {(["all", "buyer", "seller"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              tab === k ? "bg-[var(--color-ink)] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {k === "buyer" && <ShoppingBag className="h-4 w-4" />}
            {k === "seller" && <Store className="h-4 w-4" />}
            {k === "all" ? "Todas" : k === "buyer" ? "Como comprador" : "Como vendedor"}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {list.map((t) => {
          const flight = flights.find((f) => f.id === t.flightId)!;
          const status = computeStatus(flight);
          const stateIdx = stateOrder.indexOf(t.state);
          return (
            <div key={t.id} className="rounded-[2rem] border border-border bg-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span
                      className={`rounded-full px-2.5 py-0.5 ${
                        t.role === "buyer"
                          ? "bg-[var(--color-primary-token)]/10 text-[var(--color-primary-token)]"
                          : "bg-gray-100 text-[var(--color-ink)]"
                      }`}
                    >
                      {t.role === "buyer" ? "Compra" : "Venta"}
                    </span>
                    {flight.airline} · <span className="font-mono">{flight.flightNumber}</span>
                    {status === "last_call" && (
                      <span className="text-[var(--color-warning-token)]">· última llamada</span>
                    )}
                  </div>
                  <div className="mt-3 font-display text-2xl font-bold text-[var(--color-ink)]">
                    {flight.origin.city} <ChevronRight className="inline h-5 w-5 text-gray-400 mx-1" /> {flight.destination.city}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mt-1">
                    {fmtDate(flight.departureAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-bold text-[var(--color-ink)]">{S(t.amount)}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-token)] mt-1">
                    {stateLabels[t.state]}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-8 grid grid-cols-4 gap-2">
                {stateOrder.map((s, i) => {
                  const done = i <= stateIdx;
                  return (
                    <div key={s} className="flex flex-col items-start gap-2">
                      <div className="flex w-full items-center gap-2">
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-secondary-token)]" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-gray-200" />
                        )}
                        <div
                          className={`h-1 flex-1 rounded-full ${
                            i < stateIdx ? "bg-[var(--color-secondary-token)]" : "bg-gray-100"
                          }`}
                        />
                      </div>
                      <div
                        className={`text-[11px] font-bold uppercase tracking-wide pr-2 ${
                          done ? "text-[var(--color-ink)]" : "text-gray-400"
                        }`}
                      >
                        {stateLabels[s]}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/flight/$id"
                  params={{ id: flight.id }}
                  className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-[var(--color-ink)] hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Ver detalle
                </Link>
                <button className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-[var(--color-ink)] hover:bg-gray-50 transition-colors shadow-sm">
                  Contactar {t.role === "buyer" ? "vendedor" : "comprador"}
                </button>
                {t.state !== "liberado" && (
                  <button className="rounded-full bg-transparent px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-gray-900 transition-colors ml-auto">
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
    <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <span
          className={`grid h-10 w-10 place-items-center rounded-full ${
            tone === "signal" ? "bg-[var(--color-primary-token)]/10 text-[var(--color-primary-token)]" : "bg-gray-100 text-gray-500"
          }`}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className={`mt-4 font-mono text-4xl font-extrabold ${tone === "signal" ? "text-[var(--color-primary-token)]" : "text-[var(--color-ink)]"}`}>{value}</div>
    </div>
  );
}
