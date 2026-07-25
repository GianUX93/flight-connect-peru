import { Link } from "@tanstack/react-router";
import { ShieldCheck, Plane } from "lucide-react";
import type { Flight } from "@/lib/mock-data";
import {
  computeStatus,
  discountPct,
  fmtDay,
  fmtTime,
  S,
  airlineTint,
} from "@/lib/flight-utils";
import { Countdown } from "./Countdown";

/**
 * FlightCard. Renderiza SOLO ofertas active o last_call.
 * Devuelve null si el vuelo es expired (guarda de seguridad — nunca debe llegar aquí).
 */
export function FlightCard({ flight, variant = "active" }: { flight: Flight; variant?: "active" | "last_call" }) {
  const status = computeStatus(flight);
  if (status === "expired") return null;
  // Enforce lane separation
  if (variant === "active" && status !== "active") return null;
  if (variant === "last_call" && status !== "last_call") return null;

  const isWarn = status === "last_call";

  return (
    <Link
      to="/flight/$id"
      params={{ id: flight.id }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all ${
        isWarn
          ? "border-[color-mix(in_oklab,var(--warn)_40%,transparent)] bg-[color-mix(in_oklab,var(--warn)_5%,var(--surface))]"
          : "border-hairline bg-surface hover:border-signal/40 hover:bg-surface-2"
      }`}
    >
      {isWarn && (
        <div className="flex items-center justify-between border-b border-[color-mix(in_oklab,var(--warn)_30%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-warn">
          <span>Última llamada · trámite de endoso ajustado</span>
          <Countdown iso={flight.departureAt} tone="warn" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: airlineTint(flight.airline) }}
            />
            {flight.airline} · {flight.flightNumber}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none">{flight.origin.code}</span>
            <Plane className="h-3.5 w-3.5 -rotate-45 text-muted-foreground" />
            <span className="font-display text-3xl leading-none">{flight.destination.code}</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {flight.origin.city} → {flight.destination.city}
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{fmtDay(flight.departureAt)}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />
            <span>{fmtTime(flight.departureAt)}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />
            <span>{flight.durationMin}m</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-muted-foreground line-through">
            {S(flight.originalPrice)}
          </div>
          <div className="font-display text-3xl leading-none text-foreground">
            {S(flight.resalePrice)}
          </div>
          <div className="mt-1 inline-block rounded-full bg-signal px-2 py-0.5 text-[11px] font-medium text-[var(--color-signal-foreground)]">
            −{discountPct(flight)}%
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-[10px] font-medium text-foreground">
            {flight.seller.avatar}
          </span>
          <span>
            {flight.seller.name} · ★ {flight.seller.rating.toFixed(1)}
          </span>
          {flight.seller.verifiedId && <ShieldCheck className="h-3.5 w-3.5 text-signal" />}
        </div>
        {!isWarn && status === "active" && <Countdown iso={flight.departureAt} />}
      </div>
    </Link>
  );
}
