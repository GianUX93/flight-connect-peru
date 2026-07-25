import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Star, ChevronRight } from "lucide-react";
import { currentUser } from "@/lib/mock-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mi perfil — Traspaso" },
      { name: "description", content: "Verificación de identidad y reputación como comprador y vendedor." },
      { property: "og:title", content: "Perfil verificado — Traspaso" },
      { property: "og:description", content: "Tu reputación pública en el marketplace peruano de endoso." },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
      <div className="flex flex-wrap items-center gap-5">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-surface-2 font-display text-3xl">
          {currentUser.avatar}
        </span>
        <div>
          <h1 className="font-display text-4xl">{currentUser.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {currentUser.handle} · miembro desde {currentUser.memberSince}
            {currentUser.verifiedId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-2 py-0.5 text-[11px] text-signal">
                <ShieldCheck className="h-3 w-3" /> Identidad verificada
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <RepCard
          role="Como compradora"
          rating={currentUser.ratingBuyer}
          reviews={currentUser.reviewsBuyer}
          quotes={[
            "Pagó de inmediato, muy comunicativa durante el endoso.",
            "Todo rápido y claro.",
          ]}
        />
        <RepCard
          role="Como vendedora"
          rating={currentUser.ratingSeller}
          reviews={currentUser.reviewsSeller}
          quotes={[
            "Envió el código de reserva de una y respondió al toque.",
            "Cero fricción, la aerolínea confirmó en menos de una hora.",
          ]}
        />
      </div>

      <section className="mt-10 rounded-3xl border border-hairline bg-surface p-6 md:p-8">
        <h2 className="font-display text-2xl">Verificación</h2>
        <p className="text-sm text-muted-foreground">
          Estos datos no son públicos. Solo mostramos que tu perfil está verificado.
        </p>
        <div className="mt-5 divide-y divide-hairline">
          <VerifyRow label="DNI peruano" value={currentUser.dni} done />
          <VerifyRow label="Teléfono móvil" value={currentUser.phone} done />
          <VerifyRow label="Correo electrónico" value={currentUser.email} done />
          <VerifyRow label="Selfie con documento" value="Aprobada" done />
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-hairline bg-surface p-6 md:p-8">
        <h2 className="font-display text-2xl">Preferencias</h2>
        <div className="mt-4 divide-y divide-hairline">
          <PrefRow label="Rutas favoritas" value="LIM ↔ CUZ · LIM ↔ AQP" />
          <PrefRow label="Alertas activas" value="3 rutas" />
          <PrefRow label="Método de pago" value="Yape · •• 4821" />
        </div>
      </section>
    </div>
  );
}

function RepCard({
  role,
  rating,
  reviews,
  quotes,
}: {
  role: string;
  rating: number;
  reviews: number;
  quotes: string[];
}) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface p-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{role}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <Star className="h-5 w-5 fill-signal text-signal" />
        <span className="font-display text-3xl">{rating.toFixed(2)}</span>
        <span className="text-sm text-muted-foreground">· {reviews} reseñas</span>
      </div>
      <div className="mt-4 space-y-3">
        {quotes.map((q, i) => (
          <div key={i} className="rounded-xl bg-background p-3 text-sm text-muted-foreground">
            "{q}"
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifyRow({
  label,
  value,
  done,
}: {
  label: string;
  value: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        {value}
        {done && <ShieldCheck className="h-4 w-4 text-signal" />}
      </span>
    </div>
  );
}

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <button className="flex w-full items-center justify-between py-3 text-sm hover:text-foreground">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        {value}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </span>
    </button>
  );
}
