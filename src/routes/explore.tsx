import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Calendar, Search, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { z } from "zod";

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
      {
        name: "description",
        content:
          "Encuentra pasajes aéreos nacionales endosables por otras personas. Dos modos de búsqueda: fecha específica u ofertas del día.",
      },
      { property: "og:title", content: "Explorar vuelos endosables — Traspaso" },
      {
        property: "og:description",
        content:
          "Descubre vuelos nacionales de último minuto con descuento real y pago protegido.",
      },
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Explorar vuelos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo mostramos pasajes con endoso viable. Los vencidos se ocultan automáticamente.
          </p>
        </div>
      </div>

      {/* Mode switch */}
      <div className="mt-6 inline-flex rounded-full border border-hairline bg-surface p-1">
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
      <div className="mt-4 grid gap-3 rounded-2xl border border-hairline bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
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
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Fecha exacta
            </label>
            <input
              type="date"
              className="mt-1 rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
              value={search.date ?? ""}
              onChange={(e) =>
                navigate({ search: { ...search, date: e.target.value || undefined } })
              }
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Rango
            </label>
            <div className="mt-1 rounded-lg border border-hairline bg-background px-3 py-2 text-sm text-muted-foreground">
              Próximos 14 días
            </div>
          </div>
        )}
        <div className="flex items-end">
          <button className="inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground md:w-auto">
            <Search className="h-4 w-4" /> Buscar
          </button>
        </div>
      </div>

      {/* Secondary filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <PillSelect
          label="Aerolínea"
          value={airlineFilter}
          onChange={setAirlineFilter}
          options={[["all", "Todas"], ...airlines.map((a) => [a, a] as [string, string])]}
        />
        <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5">
          <span className="text-muted-foreground">Máx. {S(maxPrice)}</span>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-32 accent-[color:var(--color-signal)]"
          />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {results.length} pasaje{results.length === 1 ? "" : "s"} disponible
          {results.length === 1 ? "" : "s"}
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
        <section className="mt-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Ofertas activas</h2>
            <span className="text-xs text-muted-foreground">
              Todas con más de 24h para el endoso
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((f) => (
              <FlightCard key={f.id} flight={f} />
            ))}
          </div>
        </section>
      )}

      {/* Last call — visually separated lane */}
      {lastCall.length > 0 && (
        <section className="mt-16">
          <div className="mb-4 rounded-2xl border border-[color-mix(in_oklab,var(--warn)_35%,transparent)] bg-[color-mix(in_oklab,var(--warn)_6%,transparent)] p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-warn" />
              <div>
                <h2 className="font-display text-2xl text-warn">Última llamada</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Estos pasajes salen en menos de 24 horas. El trámite de endoso puede
                  ser ajustado — solo compra si puedes coordinar en cuestión de horas.
                  <br />
                  <span className="text-warn/90">
                    No se recomiendan para quien busca certeza total.
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lastCall.map((f) => (
              <FlightCard key={f.id} flight={f} variant="last_call" />
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
      className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-left transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-full ${
          active ? "bg-[var(--primary-foreground)]/10" : "bg-surface-2"
        }`}
      >
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium">{title}</span>
        <span
          className={`text-[11px] ${
            active ? "opacity-70" : "text-muted-foreground"
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
      <label className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
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
    <label className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-foreground focus:outline-none"
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
    <div className="mt-8 rounded-3xl border border-hairline bg-surface p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Sin coincidencias exactas
          </div>
          <h2 className="mt-1 font-display text-3xl">
            Nadie ha publicado un pasaje para {fmtDay(date.toISOString())}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Este es un marketplace: el inventario depende de lo que otras personas
            publican. Te mostramos las fechas cercanas con disponibilidad real, o
            puedes activar una alerta para esta fecha.
          </p>
        </div>
        <button
          onClick={onAlert}
          className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-medium text-[var(--color-signal-foreground)]"
        >
          <Bell className="h-4 w-4" /> Avísame cuando aparezca
        </button>
      </div>

      {nearby.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Fechas cercanas con disponibilidad
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map((f) => (
              <Link
                key={f.id}
                to="/flight/$id"
                params={{ id: f.id }}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-background p-4 hover:border-signal/40"
              >
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {f.origin.code} → {f.destination.code}
                  </div>
                  <div className="mt-1 font-display text-lg leading-tight">
                    {fmtDate(f.departureAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl">{S(f.resalePrice)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
