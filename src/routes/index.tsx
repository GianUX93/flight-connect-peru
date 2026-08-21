import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Lock, Clock3, MapPin, Tag } from "lucide-react";
import { testimonials, airports } from "@/lib/mock-data";
import { activeFlights, lastCallFlights, tramoVigente } from "@/lib/flight-utils";
import { getActiveFlights } from "@/lib/services/flights";
import { FlightCard } from "@/components/site/FlightCard";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";

// Sin librería de fotos por ciudad todavía — un mapa curado a mano por código
// de aeropuerto es la forma más honesta de mostrar una foto real sin inventar
// una integración que no existe. El destino en sí (qué ciudad se muestra) sí
// es real: se calcula abajo según qué ruta tiene más publicaciones activas.
const DESTINO_FOTO: Record<string, string> = {
  CUZ: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80",
  AQP: "https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800&q=80",
  PIU: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80",
  IQT: "https://images.unsplash.com/photo-1601582589144-b6a4c0d5dccb?w=800&q=80",
  TRU: "https://images.unsplash.com/photo-1580889240911-ed861cbe6ee6?w=800&q=80",
  TPP: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80",
  CIX: "https://images.unsplash.com/photo-1533050487297-09b450131914?w=800&q=80",
  LIM: "https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800&q=80",
};
const DESTINO_DEFAULT = "CUZ";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Traspaso — Viaja por el Perú a mitad de precio" },
      {
        name: "description",
        content: "Marketplace peruano para comprar pasajes aéreos endosados.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const { data: fetchedFlights = [] } = useQuery({
    queryKey: ["flights", "active"],
    queryFn: getActiveFlights,
  });
  const highlighted = activeFlights(fetchedFlights).slice(0, 4);
  const lastCallCount = lastCallFlights(fetchedFlights).length;

  // Destino top real: el código de destino con más publicaciones activas
  // ahora mismo, no un dato inventado ni fijo.
  const destinoTopCode = useMemo(() => {
    const conteo: Record<string, number> = {};
    for (const f of fetchedFlights) {
      const code = tramoVigente(f).destination.code;
      conteo[code] = (conteo[code] ?? 0) + 1;
    }
    const [top] = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0] ?? [];
    return top ?? DESTINO_DEFAULT;
  }, [fetchedFlights]);
  const destinoTop = airports[destinoTopCode] ?? airports[DESTINO_DEFAULT];

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-elem", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
      gsap.from(".bento-card", {
        scale: 0.95,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "back.out(1.2)",
        delay: 0.2,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="pb-20">
      {/* Hero Bento Grid */}
      <section className="mx-auto max-w-7xl px-4 pt-8 md:pt-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[180px] md:auto-rows-[240px]">
          {/* Main Value Prop */}
          <div className="bento-card md:col-span-8 md:row-span-2 rounded-[2rem] bg-[var(--color-ink)] p-8 md:p-12 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-6">
                <span className="h-2 w-2 rounded-full bg-[var(--color-secondary-token)]" />
                El marketplace peruano de pasajes
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
                Vuelos que otros no pueden usar,
                <br />
                <span className="text-[var(--color-primary-token)]">a mitad de precio.</span>
              </h1>
              <p className="mt-4 max-w-md text-gray-300 font-medium">
                Compra boletos endosados con pago retenido en garantía o publica el tuyo en minutos.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-token)] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
                >
                  Explorar ofertas <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/publish"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
                >
                  Vender mi pasaje
                </Link>
              </div>
            </div>
            {/* Background Image subtle overlay */}
            <img
              src="https://images.unsplash.com/photo-1522814701227-6f8e77a16e5f?w=800&q=80"
              alt="People traveling"
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
            />
          </div>

          {/* Destino top: se calcula solo, según qué ruta tiene más publicaciones activas */}
          <div className="bento-card md:col-span-4 md:row-span-1 rounded-[2rem] relative overflow-hidden group">
            <img
              src={DESTINO_FOTO[destinoTopCode] ?? DESTINO_FOTO[DESTINO_DEFAULT]}
              alt={destinoTop.city}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/80 mb-1">
                <MapPin className="h-3.5 w-3.5" /> Destino Top
              </div>
              <div className="font-display text-3xl font-bold">{destinoTop.city}</div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="bento-card md:col-span-2 md:row-span-1 rounded-[2rem] bg-[var(--color-secondary-token)] p-6 text-white flex flex-col justify-center">
            <ShieldCheck className="h-8 w-8 mb-3" />
            <h3 className="font-display font-bold leading-tight">Endoso seguro y validado</h3>
          </div>

          {/* Promoción */}
          <div className="bento-card md:col-span-2 md:row-span-1 rounded-[2rem] bg-white border border-border p-6 flex flex-col justify-center shadow-sm">
            <Tag className="h-7 w-7 text-[var(--color-primary-token)] mb-3" />
            <h3 className="font-display font-bold text-[var(--color-ink)] leading-tight text-lg">
              Ahorra hasta 80%
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              En vuelos última llamada
            </p>
          </div>
        </div>
      </section>

      {/* Featured feed */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4 hero-elem">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
              Disponibles ahora
            </h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Vuelos confirmados listos para endoso seguro.
            </p>
          </div>
          <Link
            to="/explore"
            className="hidden items-center gap-1 text-sm font-bold text-[var(--color-primary-token)] hover:underline md:inline-flex"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 hero-elem">
          {highlighted.map((f) => (
            <FlightCard key={f.id} flight={f} isOwnListing={user?.id === f.seller.id} />
          ))}
        </div>

        {lastCallCount > 0 && (
          <div className="mt-8 hero-elem">
            <div className="flex items-center justify-between rounded-2xl border border-[var(--color-warning-token)] bg-yellow-50 px-6 py-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-[var(--color-warning-token)] p-3 rounded-full">
                  <Clock3 className="h-6 w-6 text-[var(--color-ink)]" />
                </div>
                <div>
                  <div className="text-base font-bold text-[var(--color-ink)]">
                    {lastCallCount} pasajes en{" "}
                    <span className="uppercase tracking-widest text-xs ml-1">Última Llamada</span>
                  </div>
                  <div className="text-sm font-medium text-[var(--color-ink)]/70 mt-0.5">
                    Salen en menos de 24h. Ofertas más agresivas con trámite inmediato.
                  </div>
                </div>
              </div>
              <Link
                to="/explore"
                search={{ mode: "flexible", lane: "last_call" } as never}
                className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm font-bold text-white hover:bg-black transition-colors"
              >
                Ver urgentes
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 hero-elem border-t border-dashed border-border pt-16">
        <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)] mb-8 text-center">
          Viajeros que ya traspasaron
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-[2rem] bg-white border border-border p-8 shadow-sm"
            >
              <blockquote className="font-sans text-lg font-medium leading-snug text-[var(--color-ink)]">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 text-sm flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={t.avatarUrl} alt={t.name} />
                  <AvatarFallback className="font-bold text-gray-500">{t.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-[var(--color-ink)] font-bold">{t.name}</div>
                  <div className="text-muted-foreground font-medium text-xs">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
