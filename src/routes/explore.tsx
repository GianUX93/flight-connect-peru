import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { Bell, Calendar, Search, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { z } from "zod";
import gsap from "gsap";

import { flights, airportsList, airlines } from "@/lib/mock-data";
import {
  activeFlights,
  lastCallFlights,
  fmtDay,
  fmtDate,
  S,
} from "@/lib/flight-utils";
import { FlightCard } from "@/components/site/FlightCard";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["specific", "flexible"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
  lane: z.enum(["active", "last_call"]).optional(),
});

export const Route = createFileRoute("/explore")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Explorar vuelos disponibles — Traspaso" },
      { name: "description", content: "Encuentra pasajes aéreos nacionales endosables por otras personas." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const mode = search.mode ?? "flexible";

  const [airlineFilter, setAirlineFilter] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(400);

  const active = useMemo(() => activeFlights(flights), []);
  const lastCall = useMemo(() => lastCallFlights(flights), []);

  const filtered = active.filter((f) => {
    if (airlineFilter !== "all" && f.airline !== airlineFilter) return false;
    if (f.resalePrice > maxPrice) return false;
    if (search.from && f.origin.code !== search.from) return false;
    if (search.to && f.destination.code !== search.to) return false;
    return true;
  });

  const specificDate = search.date ? new Date(search.date) : null;
  const specificMatches = specificDate
    ? filtered.filter((f) => {
        const d = new Date(f.departureAt);
        return (
          d.getDate() === specificDate.getDate() &&
          d.getMonth() === specificDate.getMonth()
        );
      })
    : [];

  const nearby =
    mode === "specific" && specificDate && specificMatches.length === 0
      ? filtered
          .slice()
          .sort(
            (a, b) =>
              Math.abs(new Date(a.departureAt).getTime() - specificDate.getTime()) -
              Math.abs(new Date(b.departureAt).getTime() - specificDate.getTime()),
          )
          .slice(0, 4)
      : [];

  const results = mode === "specific" ? specificMatches : filtered;

  // GSAP animation
  const gridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!gridRef.current) return;
    // Animate cards inside gridRef
    const ctx = gsap.context(() => {
      gsap.from(".flight-anim", {
        y: 40,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all"
      });
    }, gridRef);
    return () => ctx.revert();
  }, [results, lastCall, mode]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12" ref={gridRef}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--color-ink)]">Explorar vuelos</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Solo mostramos pasajes con endoso viable. Los vencidos se ocultan automáticamente.
          </p>
        </div>
      </div>

      {/* Mode switch */}
      <div className="mt-8 inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
        <ModeTab
          active={mode === "specific"}
          onClick={() => navigate({ search: { ...search, mode: "specific" } })}
          icon={<Calendar className="h-4 w-4" />}
          title="Tengo una fecha fija"
          subtitle="Poca flexibilidad"
        />
        <ModeTab
          active={mode === "flexible"}
          onClick={() => navigate({ search: { ...search, mode: "flexible" } })}
          icon={<Search className="h-4 w-4" />}
          title="Ver ofertas disponibles"
          subtitle="Prioriza precio"
        />
      </div>

      {/* Search bar */}
      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto]">
        <SelectField
          label="Origen"
          value={search.from ?? ""}
          onChange={(v) => navigate({ search: { ...search, from: v || undefined } })}
          options={[["", "Cualquiera"], ...airportsList.map((a) => [a.code, `${a.city} (${a.code})`] as [string, string])]}
        />
        <SelectField
          label="Destino"
          value={search.to ?? ""}
          onChange={(v) => navigate({ search: { ...search, to: v || undefined } })}
          options={[["", "Cualquiera"], ...airportsList.map((a) => [a.code, `${a.city} (${a.code})`] as [string, string])]}
        />
        {mode === "specific" ? (
          <div className="flex flex-col">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Fecha exacta
            </label>
            <input
              type="date"
              className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium"
              value={search.date ?? ""}
              onChange={(e) =>
                navigate({ search: { ...search, date: e.target.value || undefined } })
              }
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Rango
            </label>
            <div className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-[var(--color-ink)]">
              Próximos 14 días
            </div>
          </div>
        )}
        <div className="flex items-end">
          <button className="inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-token)] px-6 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-token)]/90 md:w-auto">
            <Search className="h-4 w-4" /> Buscar
          </button>
        </div>
      </div>

      {/* Secondary filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground bg-white px-3 py-1.5 rounded-full border border-border">
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </div>
        <PillSelect
          label="Aerolínea"
          value={airlineFilter}
          onChange={setAirlineFilter}
          options={[["all", "Todas"], ...airlines.map((a) => [a, a] as [string, string])]}
        />
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5">
          <span className="text-muted-foreground font-medium text-xs">Máx. {S(maxPrice)}</span>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-24 accent-[var(--color-primary-token)]"
          />
        </div>
        <span className="ml-auto text-xs font-bold text-[var(--color-primary-token)] bg-white px-3 py-1.5 rounded-full border border-border">
          {results.length} pasaje{results.length === 1 ? "" : "s"} disponible{results.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Specific date: empty state with nearby + alert */}
      {mode === "specific" && specificDate && specificMatches.length === 0 && (
        <NoExactResults
          date={specificDate}
          nearby={nearby}
          onAlert={() =>
            toast.success("Alerta creada", {
              description: `Te avisaremos apenas alguien publique un vuelo para ${fmtDay(
                specificDate.toISOString(),
              )}.`,
            })
          }
        />
      )}

      {/* Active grid */}
      {results.length > 0 && (
        <section className="mt-12">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold text-[var(--color-ink)]">Ofertas activas</h2>
            <span className="text-xs font-bold uppercase text-[var(--color-secondary-token)]">
              +24h para el endoso
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((f) => (
              <div key={f.id} className="flight-anim h-full">
                <FlightCard flight={f} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Last call — visually separated lane */}
      {lastCall.length > 0 && (
        <section className="mt-20">
          <div className="mb-6 rounded-2xl border border-[var(--color-warning-token)] bg-yellow-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-[var(--color-warning-token)] p-3 rounded-full mt-1">
                <AlertTriangle className="h-6 w-6 text-[var(--color-ink)]" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-[var(--color-ink)]">Última llamada</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--color-ink)]/70 leading-relaxed">
                  Estos pasajes salen en menos de 24 horas. El trámite de endoso puede
                  ser ajustado — solo compra si puedes coordinar en cuestión de horas.
                  <br />
                  <span className="text-[var(--color-primary-token)] font-bold">
                    No se recomiendan para quien busca certeza total.
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lastCall.map((f) => (
              <div key={f.id} className="flight-anim h-full">
                <FlightCard flight={f} variant="last_call" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-full px-5 py-2.5 text-left transition-colors ${
        active ? "bg-[var(--color-ink)] text-white shadow-md" : "text-muted-foreground hover:bg-gray-50"
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold">{title}</span>
        <span
          className={`text-[11px] font-medium ${
            active ? "text-gray-300" : "text-gray-400"
          }`}
        >
          {subtitle}
        </span>
      </span>
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function PillSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5">
      <span className="text-muted-foreground font-bold text-xs">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[var(--color-ink)] text-xs font-medium focus:outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="bg-background">
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function NoExactResults({
  date,
  nearby,
  onAlert,
}: {
  date: Date;
  nearby: ReturnType<typeof activeFlights>;
  onAlert: () => void;
}) {
  return (
    <div className="mt-12 rounded-[2rem] border border-border bg-white p-8 md:p-10 shadow-sm text-center md:text-left">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]">
            Sin coincidencias exactas
          </div>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-[var(--color-ink)]">
            Nadie ha publicado un pasaje para {fmtDay(date.toISOString())}
          </h2>
          <p className="mt-3 max-w-xl text-sm font-medium text-muted-foreground leading-relaxed">
            Este es un marketplace: el inventario depende de lo que otras personas
            publican. Te mostramos las fechas cercanas con disponibilidad real, o
            puedes activar una alerta para esta fecha.
          </p>
        </div>
        <button
          onClick={onAlert}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-secondary-token)] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
        >
          <Bell className="h-4 w-4" /> Avísame cuando aparezca
        </button>
      </div>

      {nearby.length > 0 && (
        <div className="mt-10 pt-8 border-t border-dashed border-border">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Fechas cercanas con disponibilidad
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map((f) => (
              <Link
                key={f.id}
                to="/flight/$id"
                params={{ id: f.id }}
                className="flex items-center justify-between gap-3 tarjeta-boleto p-4 hover:border-[var(--color-secondary-token)]"
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {f.origin.code} → {f.destination.code}
                  </div>
                  <div className="mt-1 font-display text-lg font-bold leading-tight text-[var(--color-ink)]">
                    {fmtDate(f.departureAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-bold text-[var(--color-primary-token)]">{S(f.resalePrice)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
