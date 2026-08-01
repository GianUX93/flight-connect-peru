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
  AlertTriangle
} from "lucide-react";

import { flights } from "@/lib/mock-data";
import {
  computeStatus,
  discountPct,
  fmtDate,
  S,
  airlineLogo,
  comisionPlataforma,
  tramoVigente,
  tramoAVenderLabel,
  asientoLabel,
  ASIENTO_ALEATORIO_MENSAJE,
} from "@/lib/flight-utils";
import { Countdown } from "@/components/site/Countdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    const tramo = tramoVigente(f);
    return {
      meta: [
        {
          title: `${tramo.origin.city} → ${tramo.destination.city} · ${S(f.resalePrice)} — Traspaso`,
        },
        {
          name: "description",
          content: `Pasaje ${f.airline} ${tramo.origin.code}-${tramo.destination.code} el ${fmtDate(tramo.departureAt)} en ${S(f.resalePrice)}. Pago retenido hasta confirmar el endoso.`,
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
  const tramo = tramoVigente(flight);
  const comision = comisionPlataforma(flight.resalePrice);
  const totalARetener = flight.resalePrice + comision;

  // Ofertas expired nunca se muestran — bloqueamos con estado explícito
  if (status === "expired") {
    return <ExpiredNotice id={flight.id} route={`${tramo.origin.code} → ${tramo.destination.code}`} />;
  }

  const isWarn = status === "last_call";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <Link to="/explore" className="text-sm font-bold text-[var(--color-primary-token)] hover:underline inline-flex items-center gap-1">
        ← Volver a resultados
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        {/* Left: flight info */}
        <div className="space-y-6">
          {isWarn && (
            <div className="flex items-start gap-4 rounded-[2rem] border border-[var(--color-warning-token)] bg-yellow-50 p-6 shadow-sm">
              <div className="bg-[var(--color-warning-token)] p-2 rounded-full mt-1">
                <AlertTriangle className="h-5 w-5 text-[var(--color-ink)]" />
              </div>
              <div>
                <div className="font-extrabold text-[var(--color-ink)] font-display text-xl">Última llamada</div>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]/80 leading-relaxed">
                  Este vuelo sale en menos de 24 horas. El trámite de endoso con la
                  aerolínea tomará entre 1 y 3 horas. Solo continúa si puedes
                  coordinar en tiempo real con el vendedor.
                </p>
                <div className="mt-3 font-mono text-sm font-bold text-[var(--color-warning-token)] bg-white px-3 py-1.5 inline-block rounded-md border border-[var(--color-warning-token)]/50 shadow-sm animate-pulse-last-call">
                  <Countdown iso={tramo.departureAt} tone="warn" />
                </div>
              </div>
            </div>
          )}

          <div className="tarjeta-boleto p-8 md:p-10 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <img
                src={airlineLogo(flight.airline)}
                alt={flight.airline}
                className="h-4 w-auto max-w-[80px] object-contain"
              />
              {flight.airline} · <span className="font-mono">{flight.flightNumber}</span> · asiento{" "}
              <span className="font-mono">{asientoLabel(flight.asiento)}</span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {flight.asiento.tipo === "seleccionado" &&
                  flight.asiento.categoria === "ventana" && (
                    <span className="rounded-full bg-[var(--color-secondary-token)]/10 px-2.5 py-1 text-[10px] font-bold normal-case tracking-normal text-[var(--color-secondary-token)]">
                      🪟 Ventana confirmada
                    </span>
                  )}
                {flight.tipoBoleto === "ida_y_vuelta" && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Esta oferta incluye: {tramoAVenderLabel(flight.tramoAVender)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <div className="font-display text-5xl md:text-7xl font-extrabold text-[var(--color-ink)]">{tramo.origin.code}</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{tramo.origin.city}</div>
              </div>
              <div className="flex-1 px-4">
                <div className="relative h-px w-full border-t-2 border-dashed border-gray-300">
                  <Plane className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-[var(--color-primary-token)]" />
                </div>
                <div className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {tramo.durationMin} min · directo
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl md:text-7xl font-extrabold text-[var(--color-ink)]">{tramo.destination.code}</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{tramo.destination.city}</div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-dashed border-border pt-8 sm:grid-cols-4">
              <Meta label="Salida" value={fmtDate(tramo.departureAt)} isMono />
              <Meta label="Equipaje" value={flight.baggage} />
              <Meta label="Asiento" value={asientoLabel(flight.asiento)} isMono />
              <Meta label="Ruta" value="Directo" />
            </div>

            {flight.asiento.tipo === "aleatorio" && (
              <div className="mt-8 rounded-xl bg-gray-50 border border-gray-200 p-5 text-sm font-medium text-gray-600">
                <span className="text-[var(--color-ink)] font-bold block mb-1">
                  Sobre el asiento:{" "}
                </span>
                {ASIENTO_ALEATORIO_MENSAJE}
              </div>
            )}

            {flight.note && (
              <div className="mt-8 rounded-xl bg-gray-50 border border-gray-200 p-5 text-sm font-medium text-gray-600">
                <span className="text-[var(--color-ink)] font-bold block mb-1">Nota del vendedor: </span>
                {flight.note}
              </div>
            )}
          </div>

          {/* Seller */}
          <div className="rounded-[2rem] border border-border bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 border border-border shadow-sm">
                <AvatarImage src={flight.seller.avatarUrl} alt={flight.seller.name} />
                <AvatarFallback className="font-display text-2xl font-bold text-[var(--color-ink)]">
                  {flight.seller.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[var(--color-ink)]">{flight.seller.name}</span>
                  {flight.seller.verifiedId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-secondary-token)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--color-secondary-token)]">
                      <ShieldCheck className="h-3.5 w-3.5" /> ID validado
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-muted-foreground mt-0.5">
                  ★ {flight.seller.rating.toFixed(2)} · {flight.seller.reviews} traspasos ·
                  miembro desde {flight.seller.memberSince}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: checkout card */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div
            className={`rounded-[2rem] border p-8 shadow-sm ${
              isWarn
                ? "border-[color-mix(in_srgb,var(--color-warning-token)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-warning-token)_5%,#FFFFFF)]"
                : "border-border bg-white"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm font-mono text-muted-foreground line-through decoration-gray-400">
                  {S(flight.originalPrice)}
                </div>
                <div className="font-mono text-5xl font-semibold text-[var(--color-primary-token)] mt-1">{S(flight.resalePrice)}</div>
              </div>
              <div className="rounded-md bg-[var(--color-secondary-token)] px-3 py-1.5 text-sm font-bold text-white shadow-sm">
                −{discountPct(flight)}% DTO
              </div>
            </div>
            {flight.tipoBoleto === "ida_y_vuelta" && (
              <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--color-primary-token)]">
                Precio por: {tramoAVenderLabel(flight.tramoAVender)}
              </div>
            )}
            <div className="mt-4 text-xs font-medium text-muted-foreground">
              Ahorro real de {S(flight.originalPrice - flight.resalePrice)} vs. precio actual en la aerolínea.
            </div>

            <div className="my-6 border-b border-dashed border-gray-200" />

            <div className="space-y-3 text-sm">
              <Row label="Precio del pasaje" value={S(flight.resalePrice)} />
              <Row label="Servicio Traspaso (5%)" value={S(comision)} />
              <Row label="Asiento" value={asientoLabel(flight.asiento)} muted />
              <Row label="Verificación aerolínea" value="Incluido" muted />
            </div>

            <div className="my-6 border-b border-dashed border-gray-200" />

            <div className="flex items-baseline justify-between bg-[var(--surface-2)] p-4 rounded-xl">
              <div className="text-sm font-bold text-[var(--color-ink)]">A retener hoy</div>
              <div className="font-mono text-2xl font-bold text-[var(--color-ink)]">
                {S(totalARetener)}
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
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-bold shadow-sm transition-transform hover:scale-[1.02] ${
                isWarn
                  ? "bg-[var(--color-ink)] text-white hover:bg-black"
                  : "bg-[var(--color-primary-token)] text-white hover:bg-[var(--color-primary-token)]/90"
              }`}
            >
              {step === 0
                ? "Pagar y retener dinero"
                : step === 1
                  ? "Confirmar endoso iniciado"
                  : step === 2
                    ? "Confirmar boleto recibido"
                    : "Traspaso exitoso ✓"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground bg-gray-50 p-3 rounded-xl border border-gray-100">
              <Lock className="h-4 w-4 text-[var(--color-secondary-token)]" />
              Tu pago no va al vendedor hasta confirmar.
            </div>
          </div>
          
          {/* How escrow works (moved below checkout for mobile flow) */}
          <div className="mt-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 text-xs font-bold uppercase tracking-widest text-[var(--color-ink)]">
              Protección Escrow
            </div>
            <ol className="space-y-5 text-sm">
              <TimelineStep
                done
                title="1. Pago retenido"
                desc="Traspaso guarda tu dinero seguro."
              />
              <TimelineStep
                done={step >= 1}
                title="2. Trámite iniciado"
                desc="Vendedor solicita cambio de titular."
              />
              <TimelineStep
                done={step >= 2}
                title="3. Verificación"
                desc="Validamos que el boleto está a tu nombre."
              />
              <TimelineStep
                done={step >= 3}
                title="4. Pago liberado"
                desc="El vendedor recibe su dinero."
              />
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1.5 text-sm font-medium text-[var(--color-ink)] ${isMono ? 'font-mono font-semibold' : ''}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-gray-600">{label}</span>
      <span className={muted ? "text-muted-foreground font-medium" : "font-mono font-bold text-[var(--color-ink)]"}>{value}</span>
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
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-secondary-token)]" />
      ) : (
        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-300" />
      )}
      <div>
        <div className={`font-bold ${done ? "text-[var(--color-ink)]" : "text-gray-400"}`}>{title}</div>
        <div className="text-xs font-medium text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </li>
  );
}

function ExpiredNotice({ route }: { id: string; route: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24">
      <div className="rounded-[2rem] border border-border bg-white p-8 text-center md:p-12 shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gray-100 text-gray-400">
          <Info className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold text-[var(--color-ink)]">Oferta ya no disponible</h1>
        <p className="mt-3 text-sm font-medium text-muted-foreground leading-relaxed">
          Este pasaje ya no cumple los tiempos mínimos para completar el trámite de
          endoso de forma segura. Traspaso nunca vende inventario que no puedas usar.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() =>
              toast.success("Alerta creada", {
                description: `Te avisaremos si aparece otro vuelo ${route}.`,
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary-token)] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105 shadow-sm"
          >
            <Bell className="h-4 w-4" /> Alertas para esta ruta
          </button>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Ver otros vuelos
          </Link>
        </div>
      </div>
    </div>
  );
}
