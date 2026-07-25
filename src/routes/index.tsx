import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Lock, Clock3, Sparkles } from "lucide-react";
import { flights, testimonials } from "@/lib/mock-data";
import { activeFlights, lastCallFlights } from "@/lib/flight-utils";
import { FlightCard } from "@/components/site/FlightCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Traspaso — Vuelos que otros no pueden usar, a mitad de precio para ti" },
      {
        name: "description",
        content:
          "Marketplace peruano para transferir pasajes aéreos entre personas. Pago retenido hasta confirmar el endoso ante la aerolínea.",
      },
      { property: "og:title", content: "Traspaso — Endoso P2P de pasajes aéreos en Perú" },
      {
        property: "og:description",
        content:
          "Compra o vende pasajes nacionales de último minuto con descuentos reales y pago en escrow.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const highlighted = activeFlights(flights).slice(0, 4);
  const lastCallCount = lastCallFlights(flights).length;
  const totalActive = activeFlights(flights).length;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, var(--color-signal), transparent 70%)",
            }}
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 md:pt-24">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
            {totalActive} pasajes disponibles ahora en Perú
          </div>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl md:text-[92px]">
            Vuelos que otros no pueden usar,
            <br />
            <em className="text-signal">a mitad de precio</em> para ti.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Traspaso es el marketplace peruano para transferir pasajes aéreos entre
            personas. Tu pago queda retenido hasta que la aerolínea confirme el endoso
            a tu nombre.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/explore"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Explorar vuelos disponibles
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/publish"
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3 text-sm font-medium hover:bg-surface-2"
            >
              Publicar mi pasaje
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <Trust icon={<Lock className="h-3.5 w-3.5" />} text="Pago retenido en escrow" />
            <Trust icon={<ShieldCheck className="h-3.5 w-3.5" />} text="Endoso verificado con la aerolínea" />
            <Trust icon={<Sparkles className="h-3.5 w-3.5" />} text="1,842 traspasos completados" />
          </div>
        </div>
      </section>

      {/* Featured feed */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Disponibles ahora</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ofertas activas con al menos 24h para completar el endoso.
              </p>
            </div>
            <Link
              to="/explore"
              className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlighted.map((f) => (
              <FlightCard key={f.id} flight={f} />
            ))}
          </div>

          {lastCallCount > 0 && (
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-[color-mix(in_oklab,var(--warn)_35%,transparent)] bg-[color-mix(in_oklab,var(--warn)_6%,transparent)] px-5 py-4">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-warn" />
                <div>
                  <div className="text-sm font-medium text-warn">
                    {lastCallCount} pasajes en última llamada
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Salen en menos de 24h. Sección separada con advertencia de tiempo real para el trámite.
                  </div>
                </div>
              </div>
              <Link
                to="/explore"
                search={{ mode: "flexible", lane: "last_call" } as never}
                className="text-sm text-warn hover:underline"
              >
                Ver ahora
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-hairline bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2">
            <HowColumn
              tone="signal"
              title="Para compradores"
              steps={[
                ["Encuentra un pasaje", "Filtra por ruta, fecha o mira las ofertas del día."],
                ["Paga con protección", "Tu dinero queda retenido, no llega al vendedor todavía."],
                ["Recibe el boleto a tu nombre", "Liberamos el pago solo cuando la aerolínea confirma."],
              ]}
            />
            <HowColumn
              tone="neutral"
              title="Para quien vende"
              steps={[
                ["Publica en 2 minutos", "Sube tu código de reserva y define tu precio."],
                ["Recibe interesados", "Verificamos su identidad antes del pago."],
                ["Cobra al confirmar", "Cuando el endoso queda registrado, liberamos tu dinero."],
              ]}
            />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-6"
              >
                <blockquote className="font-display text-lg leading-snug">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 text-sm">
                  <div className="text-foreground">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat n="1,842" label="Traspasos completados" />
            <Stat n="S/ 486k" label="Retenidos y liberados" />
            <Stat n="4.9 ★" label="Rating promedio" />
            <Stat n="< 2h" label="Tiempo medio de endoso" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-3xl border border-hairline bg-surface p-10 md:p-16">
            <h3 className="max-w-2xl font-display text-4xl leading-tight md:text-5xl">
              ¿Tienes un vuelo que ya no puedes tomar?{" "}
              <span className="text-signal">Recupera hasta el 80%.</span>
            </h3>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/publish"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                Publicar mi pasaje <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/trust"
                className="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3 text-sm"
              >
                Ver cómo protegemos el trámite
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Trust({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-signal">
        {icon}
      </span>
      {text}
    </div>
  );
}

function HowColumn({
  title,
  steps,
  tone,
}: {
  title: string;
  steps: [string, string][];
  tone: "signal" | "neutral";
}) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface p-8">
      <div className="mb-6 text-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <ol className="space-y-6">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-lg ${
                tone === "signal"
                  ? "bg-signal text-[var(--color-signal-foreground)]"
                  : "border border-hairline text-foreground"
              }`}
            >
              {i + 1}
            </span>
            <div>
              <div className="font-display text-2xl leading-tight">{t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{d}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">
      <div className="font-display text-3xl">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
