import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Star, ChevronRight, User } from "lucide-react";
import { currentUser } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mi perfil — Traspaso" },
      { name: "description", content: "Verificación de identidad y reputación como comprador y vendedor." },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
      <div className="flex flex-wrap items-center gap-6 p-6 md:p-8 rounded-[2rem] border border-border bg-white shadow-sm">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-white shadow-sm">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback className="font-display text-4xl">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          {currentUser.verifiedId && (
            <div className="absolute -bottom-2 -right-2 bg-[var(--color-secondary-token)] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--color-ink)]">{currentUser.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
            <span className="text-[var(--color-primary-token)] font-bold">{currentUser.handle}</span>
            <span>·</span>
            <span>miembro desde {currentUser.memberSince}</span>
            {currentUser.verifiedId && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-secondary-token)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-secondary-token)]">
                  <ShieldCheck className="h-3.5 w-3.5" /> Identidad verificada
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
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

      <section className="mt-10 rounded-[2rem] border border-border bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">Verificación</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Estos datos no son públicos. Solo mostramos que tu perfil está verificado para mayor seguridad en la comunidad.
        </p>
        <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
          <VerifyRow label="DNI peruano" value={currentUser.dni} done />
          <VerifyRow label="Teléfono móvil" value={currentUser.phone} done />
          <VerifyRow label="Correo electrónico" value={currentUser.email} done />
          <VerifyRow label="Selfie con documento" value="Aprobada" done />
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-border bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">Preferencias</h2>
        <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
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
    <div className="rounded-[2rem] border border-border bg-white p-6 md:p-8 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]">{role}</div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1 bg-[var(--color-warning-token)]/10 text-[var(--color-warning-token)] px-3 py-1.5 rounded-full">
          <Star className="h-5 w-5 fill-current" />
          <span className="font-display text-2xl font-bold">{rating.toFixed(2)}</span>
        </div>
        <span className="text-sm font-bold text-muted-foreground">{reviews} reseñas</span>
      </div>
      <div className="mt-6 space-y-3">
        {quotes.map((q, i) => (
          <div key={i} className="relative rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-700 italic border border-gray-100">
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
    <div className="flex items-center justify-between px-5 py-4 text-sm bg-white">
      <span className="font-bold text-gray-500">{label}</span>
      <span className="flex items-center gap-2 font-mono font-semibold text-[var(--color-ink)]">
        {value}
        {done && <ShieldCheck className="h-5 w-5 text-[var(--color-secondary-token)] ml-1" />}
      </span>
    </div>
  );
}

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <button className="flex w-full items-center justify-between px-5 py-4 text-sm hover:bg-gray-50 transition-colors bg-white">
      <span className="font-bold text-gray-500">{label}</span>
      <span className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
        {value}
        <ChevronRight className="h-5 w-5 text-gray-400 ml-1" />
      </span>
    </button>
  );
}
