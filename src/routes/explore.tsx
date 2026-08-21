import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  CheckCircle2,
  ChevronDown,
  Mail,
  SlidersHorizontal,
  AlertTriangle,
  ArrowLeftRight,
  ArrowUpDown,
} from "lucide-react";
import { z } from "zod";
import gsap from "gsap";

import {
  airportsList,
  airlines,
  currentUser,
  type AsientoCategoria,
  type Flight,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { getActiveFlights } from "@/lib/services/flights";
import {
  activeFlights,
  lastCallFlights,
  S,
  tramoVigente,
  asientoVigente,
  discountPct,
  ASIENTO_CATEGORIA_LABEL,
} from "@/lib/flight-utils";
import { FlightCard } from "@/components/site/FlightCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { createRouteAlert } from "@/lib/services/route-alerts";
import { toast } from "sonner";

type RangoPreset = "semana" | "quince" | "mes" | "fecha";
type SortBy = "relevancia" | "precio_asc" | "precio_desc" | "salida_proxima" | "descuento";

const RANGO_LABEL: Record<RangoPreset, string> = {
  semana: "Próxima semana",
  quince: "Próximos 15 días",
  mes: "Próximo mes",
  fecha: "Ingresar fecha",
};

const RANGO_DIAS: Record<"semana" | "quince" | "mes", number> = {
  semana: 7,
  quince: 15,
  mes: 30,
};

const SORT_LABEL: Record<SortBy, string> = {
  relevancia: "Relevancia",
  precio_asc: "Precio: menor a mayor",
  precio_desc: "Precio: mayor a menor",
  salida_proxima: "Salida más próxima",
  descuento: "Mayor descuento",
};

function sortFlights(list: Flight[], sortBy: SortBy): Flight[] {
  const arr = [...list];
  switch (sortBy) {
    case "precio_asc":
      return arr.sort((a, b) => a.resalePrice - b.resalePrice);
    case "precio_desc":
      return arr.sort((a, b) => b.resalePrice - a.resalePrice);
    case "salida_proxima":
      return arr.sort(
        (a, b) =>
          new Date(tramoVigente(a).departureAt).getTime() -
          new Date(tramoVigente(b).departureAt).getTime(),
      );
    case "descuento":
      return arr.sort((a, b) => discountPct(b) - discountPct(a));
    default:
      return arr;
  }
}

const searchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  rango: z.enum(["semana", "quince", "mes", "fecha"]).optional(),
  date: z.string().optional(),
});

export const Route = createFileRoute("/explore")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Explorar vuelos disponibles — Traspaso" },
      {
        name: "description",
        content: "Encuentra pasajes aéreos nacionales endosables por otras personas.",
      },
    ],
  }),
  component: Explore,
});

function Explore() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const { user } = useAuth();
  const rango = search.rango ?? "mes";

  const [airlineFilter, setAirlineFilter] = useState<string>("all");
  const [seatFilter, setSeatFilter] = useState<AsientoCategoria | "all">("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([50, 500]);
  const [sortBy, setSortBy] = useState<SortBy>("relevancia");
  const [alertSaved, setAlertSaved] = useState(false);
  const [creandoAlerta, setCreandoAlerta] = useState(false);

  const { data: fetchedFlights = [], isLoading } = useQuery({
    queryKey: ["flights", "active"],
    queryFn: getActiveFlights,
  });

  const active = useMemo(() => activeFlights(fetchedFlights), [fetchedFlights]);
  const lastCall = useMemo(() => lastCallFlights(fetchedFlights), [fetchedFlights]);

  // El tope del slider no puede quedar fijo en 500 — un vuelo real puede
  // publicarse por más, y quedaría invisible en el marketplace sin que nadie
  // lo note. Se calcula sobre lo que realmente hay a la venta ahora mismo.
  const precioMaxDisponible = useMemo(
    () => Math.max(500, ...active.map((f) => Math.ceil(f.resalePrice / 10) * 10)),
    [active],
  );
  useEffect(() => {
    setPriceRange(([lo, hi]) =>
      hi === 500 && precioMaxDisponible > 500 ? [lo, precioMaxDisponible] : [lo, hi],
    );
  }, [precioMaxDisponible]);

  const rangoLimite = rango === "fecha" ? null : Date.now() + RANGO_DIAS[rango] * 86400_000;
  const selectedDate = rango === "fecha" && search.date ? new Date(search.date) : null;

  const filtered = active.filter((f) => {
    if (airlineFilter !== "all" && f.airline !== airlineFilter) return false;
    if (seatFilter !== "all" && asientoVigente(f).categoria !== seatFilter) return false;
    if (f.resalePrice < priceRange[0] || f.resalePrice > priceRange[1]) return false;
    const tramo = tramoVigente(f);
    if (search.from && tramo.origin.code !== search.from) return false;
    if (search.to && tramo.destination.code !== search.to) return false;
    const departureAt = new Date(tramo.departureAt);
    if (rango === "fecha") {
      if (!selectedDate) return false;
      if (
        departureAt.getFullYear() !== selectedDate.getFullYear() ||
        departureAt.getMonth() !== selectedDate.getMonth() ||
        departureAt.getDate() !== selectedDate.getDate()
      )
        return false;
    } else if (rangoLimite !== null && departureAt.getTime() > rangoLimite) {
      return false;
    }
    return true;
  });

  const results = sortFlights(filtered, sortBy);
  const filtrosActivos =
    (airlineFilter !== "all" ? 1 : 0) +
    (seatFilter !== "all" ? 1 : 0) +
    (priceRange[0] !== 50 || priceRange[1] !== precioMaxDisponible ? 1 : 0);

  const ciudad = (code?: string) =>
    code ? (airportsList.find((a) => a.code === code)?.city ?? code) : null;
  const rutaResumen =
    ciudad(search.from) && ciudad(search.to)
      ? `${ciudad(search.from)} → ${ciudad(search.to)}`
      : (ciudad(search.from) ?? ciudad(search.to) ?? "cualquier ruta");
  const CUANDO_PREPOSICION: Record<RangoPreset, string> = {
    semana: "en la próxima semana",
    quince: "en los próximos 15 días",
    mes: "en el próximo mes",
    fecha: "",
  };
  const cuandoResumen =
    rango === "fecha" && search.date
      ? `el ${new Date(search.date).toLocaleDateString("es-PE", { day: "numeric", month: "long" })}`
      : CUANDO_PREPOSICION[rango];

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
        clearProps: "all",
      });
    }, gridRef);
    return () => ctx.revert();
  }, [results, lastCall]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12" ref={gridRef}>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary-token)] border-t-transparent"></div>
        </div>
      )}
      <div
        className="relative overflow-hidden rounded-[2rem] p-6 shadow-sm md:p-10"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-token), var(--color-accent-token))",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-white/5"
          aria-hidden
        />

        <div className="relative">
          <h1 className="font-display text-4xl font-extrabold text-white md:text-5xl">
            Explorar vuelos
          </h1>
          <p className="mt-2 text-sm font-medium text-white/80">
            Solo mostramos pasajes con endoso viable. Los vencidos se ocultan automáticamente.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mt-8 grid gap-3 rounded-2xl bg-white p-5 shadow-lg md:grid-cols-[2fr_1fr_auto]">
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <SelectField
                label="Origen"
                value={search.from ?? ""}
                onChange={(v) => navigate({ search: { ...search, from: v || undefined } })}
                options={[
                  ["", "Cualquiera"],
                  ...airportsList.map((a) => [a.code, `${a.city} (${a.code})`] as [string, string]),
                ]}
              />
            </div>
            <div className="hidden w-8 shrink-0 flex-col overflow-hidden md:flex">
              <span className="invisible whitespace-nowrap text-[11px] font-bold uppercase tracking-widest">
                Intercambiar
              </span>
              <div className="mt-1.5 flex h-[38px] items-center justify-center">
                <button
                  type="button"
                  onClick={() =>
                    navigate({ search: { ...search, from: search.to, to: search.from } })
                  }
                  aria-label="Intercambiar origen y destino"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:border-[var(--color-primary-token)] hover:text-[var(--color-primary-token)]"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <SelectField
                label="Destino"
                value={search.to ?? ""}
                onChange={(v) => navigate({ search: { ...search, to: v || undefined } })}
                options={[
                  ["", "Cualquiera"],
                  ...airportsList.map((a) => [a.code, `${a.city} (${a.code})`] as [string, string]),
                ]}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Rango
              </label>
              {rango === "fecha" && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({ search: { ...search, rango: undefined, date: undefined } })
                  }
                  className="text-[11px] font-bold text-[var(--color-primary-token)] hover:underline"
                >
                  Cambiar
                </button>
              )}
            </div>
            {rango === "fecha" ? (
              <input
                type="date"
                autoFocus
                className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                value={search.date ?? ""}
                onChange={(e) =>
                  navigate({ search: { ...search, date: e.target.value || undefined } })
                }
              />
            ) : (
              <div className="relative mt-1.5">
                <select
                  value={rango}
                  onChange={(e) => {
                    const next = e.target.value as RangoPreset;
                    navigate({
                      search: {
                        ...search,
                        rango: next,
                        date: next === "fecha" ? search.date : undefined,
                      },
                    });
                  }}
                  className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                >
                  {(Object.keys(RANGO_LABEL) as RangoPreset[]).map((r) => (
                    <option key={r} value={r}>
                      {RANGO_LABEL[r]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex items-end">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-[38px] items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-bold text-[var(--color-ink)] hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Más filtros
                  {filtrosActivos > 0 && (
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--color-primary-token)] text-[10px] font-bold text-white">
                      {filtrosActivos}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-5" align="end">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)]">
                  Más filtros
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Aerolínea
                  </label>
                  <div className="relative">
                    <select
                      value={airlineFilter}
                      onChange={(e) => setAirlineFilter(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    >
                      <option value="all">Todas</option>
                      {airlines.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Asiento
                  </label>
                  <div className="relative">
                    <select
                      value={seatFilter}
                      onChange={(e) => setSeatFilter(e.target.value as AsientoCategoria | "all")}
                      className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    >
                      <option value="all">Todos</option>
                      {(["ventana", "medio", "pasillo"] as AsientoCategoria[]).map((c) => (
                        <option key={c} value={c}>
                          {ASIENTO_CATEGORIA_LABEL[c]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Precio
                    </label>
                    <span className="font-mono text-xs font-bold text-[var(--color-ink)]">
                      {S(priceRange[0])} – {S(priceRange[1])}
                    </span>
                  </div>
                  <Slider
                    min={50}
                    max={precioMaxDisponible}
                    step={10}
                    value={priceRange}
                    onValueChange={(v) => setPriceRange([v[0], v[1]])}
                    className="py-2"
                  />
                </div>
                {filtrosActivos > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAirlineFilter("all");
                      setSeatFilter("all");
                      setPriceRange([50, precioMaxDisponible]);
                    }}
                    className="text-xs font-bold text-[var(--color-primary-token)] hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Result count + sort */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase text-[var(--color-primary-token)] bg-white px-3 py-1.5 rounded-full border border-border">
          {results.length} pasaje{results.length === 1 ? "" : "s"} disponible
          {results.length === 1 ? "" : "s"}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortBy === "relevancia" ? "Ordenar" : SORT_LABEL[sortBy]}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              {(Object.keys(SORT_LABEL) as SortBy[]).map((s) => (
                <DropdownMenuRadioItem
                  key={s}
                  value={s}
                  className="focus:bg-surface-2! focus:text-inherit!"
                >
                  {SORT_LABEL[s]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Empty state */}
      {results.length === 0 && rango === "fecha" && !selectedDate && (
        <div className="mt-8 rounded-[2rem] border border-border bg-white p-8 md:p-10 shadow-sm text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]">
            Un paso más
          </div>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-[var(--color-ink)]">
            Elige una fecha para ver los pasajes disponibles
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-muted-foreground leading-relaxed">
            Ya seleccionaste "Ingresar fecha" en el buscador — ahora escribe el día exacto y te
            mostramos al instante las ofertas que salen ese día.
          </p>
        </div>
      )}

      {results.length === 0 && !(rango === "fecha" && !selectedDate) && (
        <div className="mt-8 rounded-[2rem] border border-border bg-white p-8 md:p-10 shadow-sm text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]">
            Sin resultados
          </div>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-[var(--color-ink)]">
            No encontramos pasajes con estos filtros
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-muted-foreground leading-relaxed">
            Este es un marketplace: el inventario depende de lo que otras personas publican. Prueba
            ampliando el rango de fechas o quitando algún filtro.
          </p>

          {!(search.from && search.to) && (
            <p className="mx-auto mt-4 max-w-xs text-xs font-medium text-muted-foreground/80">
              Elige origen y destino para activar una alerta de este pasaje.
            </p>
          )}

          {search.from && search.to && (
            <>
              {alertSaved ? (
                <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-[1.5rem] border border-[var(--color-secondary-token)]/25 bg-gradient-to-br from-[var(--color-secondary-token)]/8 to-transparent text-left shadow-sm">
                  <div className="flex items-start gap-3 p-5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-secondary-token)]/15">
                      <CheckCircle2 className="h-5 w-5 text-[var(--color-secondary-token)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-display text-base font-extrabold text-[var(--color-ink)]">
                          Alerta activada
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--color-ink)] shadow-sm">
                          {rutaResumen}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        Te avisaremos por notificación cuando aparezca
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  disabled={creandoAlerta}
                  onClick={async () => {
                    if (!user || user.id.startsWith("sim-")) {
                      toast.error("Inicia sesión para activar alertas de búsqueda.");
                      return;
                    }
                    setCreandoAlerta(true);
                    try {
                      await createRouteAlert(user.id, search.from!, search.to!);
                      setAlertSaved(true);
                      toast.custom((toastId) => (
                        <div className="flex w-full gap-3 rounded-lg bg-white p-4 shadow-lg border border-border">
                          <BellRing className="h-5 w-5 shrink-0 text-[var(--color-secondary-token)]" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-[var(--color-ink)]">
                              Alerta creada
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              Te avisaremos cuando aparezca un pasaje para {rutaResumen}.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                navigate({ to: "/profile", search: { tab: "preferencias" } });
                                toast.dismiss(toastId);
                              }}
                              className="mt-1.5 text-sm font-bold text-[var(--color-primary-token)] hover:underline"
                            >
                              Ver alertas
                            </button>
                          </div>
                        </div>
                      ));
                    } catch {
                      toast.error("No se pudo crear la alerta.");
                    } finally {
                      setCreandoAlerta(false);
                    }
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary-token)] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-50"
                >
                  <Bell className="h-4 w-4" /> Avísame cuando aparezcan pasajes
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Active grid */}
      {results.length > 0 && (
        <section className="mt-8">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold text-[var(--color-ink)]">
              Ofertas activas
            </h2>
            <span className="text-xs font-bold uppercase text-[var(--color-secondary-token)]">
              +24h para el endoso
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((f) => (
              <div key={f.id} className="flight-anim h-full">
                <FlightCard flight={f} isOwnListing={user?.id === f.seller.id} />
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
                <h2 className="font-display text-2xl font-extrabold text-[var(--color-ink)]">
                  Última llamada
                </h2>
                <p className="mt-2 text-sm font-medium text-[var(--color-ink)]/70 leading-relaxed">
                  Estos pasajes salen en menos de 24 horas. El trámite de endoso puede ser ajustado
                  — solo compra si puedes coordinar en cuestión de horas.{" "}
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
                <FlightCard
                  flight={f}
                  variant="last_call"
                  isOwnListing={user?.id === f.seller.id}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
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
      <div className="relative mt-1.5">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
        >
          {options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
