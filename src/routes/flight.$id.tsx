import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Plane,
  Info,
  Bell,
} from "lucide-react";

import { flights } from "@/lib/mock-data";
import {
  computeStatus,
  discountPct,
  fmtDate,
  S,
  airlineTint,
} from "@/lib/flight-utils";
import { Countdown } from "@/components/site/Countdown";
import { toast } from "sonner";

export const Route = createFileRoute("/flight/$id")({
  head: ({ params }) => {
    const f = flights.find((x) => x.id === params.id);
    if (!f) {
      return {
        meta: [
          { title: "Vuelo no disponible — Traspaso" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        {
          title: `${f.origin.city} → ${f.destination.city} · ${S(f.resalePrice)} — Traspaso`,
        },
        {
          name: "description",
          content: `Pasaje ${f.airline} ${f.origin.code}-${f.destination.code} el ${fmtDate(f.departureAt)} en ${S(f.resalePrice)}. Pago retenido hasta confirmar el endoso.`,
        },
      ],
    };
  },
  loader: ({ params }) => {
    const f = flights.find((x) => x.id === params.id);
    if (!f) throw notFound();
    return { flight: f };
  },
  component: FlightDetail,
});

function FlightDetail() {
  const { flight } = Route.useLoaderData();
  const status = computeStatus(flight);
  const [step, setStep] = useState(0);

  // Ofertas expired nunca se muestran — bloqueamos con estado explícito
  if (status === "expired") {
    return <ExpiredNotice id={flight.id} route={`${flight.origin.code} → ${flight.destination.code}`} />;
  }

  const isWarn = status === "last_call";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <Link to="/explore" className="text-xs text-muted-foreground hover:text-foreground">
        ← Volver a resultados
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        {/* Left: flight info */}
        <div className="space-y-6">
          {isWarn && (
            <div className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--warn)_40%,transparent)] bg-[color-mix(in_oklab,var(--warn)_8%,transparent)] p-4 text-sm">
              <Info className="mt-0.5 h-5 w-5 text-warn" />
              <div>
                <div className="font-medium text-warn">Última llamada</div>
                <p className="mt-1 text-muted-foreground">
                  Este vuelo sale en menos de 24 horas. El trámite de endoso con la
                  aerolínea tomará entre 1 y 3 horas. Solo continúa si puedes
                  coordinar en tiempo real con el vendedor.
                </p>
                <div className="mt-2">
                  <Countdown iso={flight.departureAt} tone="warn" />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-hairline bg-surface p-6 md:p-8">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: airlineTint(flight.airline) }}
              />
              {flight.airline} · {flight.flightNumber} · asiento {flight.seat}
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div>
                <div className="font-display text-5xl md:text-6xl">{flight.origin.code}</div>
                <div className="mt-1 text-sm text-muted-foreground">{flight.origin.city}</div>
              </div>
              <div className="flex-1">
                <div className="relative h-px w-full bg-hairline">
                  <Plane className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-signal" />
                </div>
                <div className="mt-2 text-center text-xs text-muted-foreground">
                  {flight.durationMin} min · directo
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl md:text-6xl">{flight.destination.code}</div>
                <div className="mt-1 text-sm text-muted-foreground">{flight.destination.city}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-hairline pt-6 sm:grid-cols-4">
              <Meta label="Salida" value={fmtDate(flight.departureAt)} />
              <Meta label="Equipaje" value={flight.baggage} />
              <Meta label="Asiento" value={flight.seat} />
              <Meta label="Ruta" value="Directo" />
            </div>

            {flight.note && (
              <div className="mt-6 rounded-xl bg-background p-4 text-sm text-muted-foreground">
                <span className="text-foreground/70">Nota del vendedor: </span>
                {flight.note}
              </div>
            )}
          </div>

          {/* Seller */}
          <div className="rounded-3xl border border-hairline bg-surface p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 font-display text-xl">
                {flight.seller.avatar}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{flight.seller.name}</span>
                  {flight.seller.verifiedId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-2 py-0.5 text-[11px] text-signal">
                      <ShieldCheck className="h-3 w-3" /> ID verificado
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  ★ {flight.seller.rating.toFixed(2)} · {flight.seller.reviews} traspasos ·
                  miembro desde {flight.seller.memberSince}
                </div>
              </div>
            </div>
          </div>

          {/* How escrow works */}
          <div className="rounded-3xl border border-hairline bg-surface p-6">
            <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
              Cómo se protege tu dinero
            </div>
            <ol className="space-y-4 text-sm">
              <TimelineStep
                done
                title="Pago retenido"
                desc="Al pagar, Traspaso retiene el monto. El vendedor todavía no recibe nada."
              />
              <TimelineStep
                done={step >= 1}
                title="Vendedor inicia el endoso"
                desc="El vendedor solicita el cambio de titular a la aerolínea. Recibirás confirmación."
              />
              <TimelineStep
                done={step >= 2}
                title="Aerolínea confirma"
                desc="Verificamos con el sistema de la aerolínea que el boleto está a tu nombre."
              />
              <TimelineStep
                done={step >= 3}
                title="Pago liberado"
                desc="Recién ahí el vendedor recibe el dinero. Si algo falla, se te reembolsa el 100%."
              />
            </ol>
          </div>
        </div>

        {/* Right: checkout card */}
        <aside className="md:sticky md:top-20 md:self-start">
          <div
            className={`rounded-3xl border p-6 ${
              isWarn
                ? "border-[color-mix(in_oklab,var(--warn)_35%,transparent)] bg-[color-mix(in_oklab,var(--warn)_5%,var(--surface))]"
                : "border-hairline bg-surface"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-muted-foreground line-through">
                  {S(flight.originalPrice)}
                </div>
                <div className="font-display text-5xl">{S(flight.resalePrice)}</div>
              </div>
              <div className="rounded-full bg-signal px-3 py-1 text-sm font-medium text-[var(--color-signal-foreground)]">
                −{discountPct(flight)}%
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Ahorro de {S(flight.originalPrice - flight.resalePrice)} vs. precio actual en la aerolínea.
            </div>

            <div className="my-5 h-px bg-hairline" />

            <div className="space-y-2 text-sm">
              <Row label="Precio del pasaje" value={S(flight.resalePrice)} />
              <Row label="Comisión de Traspaso" value={S(Math.round(flight.resalePrice * 0.05))} />
              <Row label="Verificación de endoso" value="Incluido" muted />
            </div>
            <div className="my-4 h-px bg-hairline" />
            <div className="flex items-baseline justify-between">
              <div className="text-sm text-muted-foreground">Total a retener</div>
              <div className="font-display text-2xl">
                {S(flight.resalePrice + Math.round(flight.resalePrice * 0.05))}
              </div>
            </div>

            <button
              onClick={() => {
                setStep((s) => Math.min(3, s + 1));
                toast.success(
                  step === 0
                    ? "Pago retenido en escrow"
                    : step === 1
                      ? "Vendedor notificado"
                      : step === 2
                        ? "Endoso confirmado"
                        : "Pago liberado",
                );
              }}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${
                isWarn
                  ? "bg-warn text-[var(--warn-foreground)]"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {step === 0
                ? "Pagar y retener"
                : step === 1
                  ? "Confirmar endoso iniciado"
                  : step === 2
                    ? "Confirmar recepción del boleto"
                    : "Traspaso completado ✓"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-signal" />
              Pago retenido hasta que la aerolínea confirme el endoso.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : ""}>{value}</span>
    </div>
  );
}

function TimelineStep({
  done,
  title,
  desc,
}: {
  done?: boolean;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-3">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
      ) : (
        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      )}
      <div>
        <div className={done ? "text-foreground" : "text-muted-foreground"}>{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}

function ExpiredNotice({ route }: { id: string; route: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24">
      <div className="rounded-3xl border border-hairline bg-surface p-8 text-center md:p-12">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted-foreground">
          <Info className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-3xl">Oferta no disponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este pasaje ya no cumple los tiempos mínimos para completar el trámite de
          endoso de forma segura. Traspaso nunca vende inventario que no puedas usar.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() =>
              toast.success("Alerta creada", {
                description: `Te avisaremos si aparece otro vuelo ${route}.`,
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-[var(--color-signal-foreground)]"
          >
            <Bell className="h-4 w-4" /> Activa alertas para esta ruta
          </button>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm"
          >
            Ver otros vuelos disponibles
          </Link>
        </div>
      </div>
    </div>
  );
}
