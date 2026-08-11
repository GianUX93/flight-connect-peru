import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import {
  ShieldCheck,
  Star,
  ChevronRight,
  Heart,
  Plane,
  X,
  BadgeCheck,
  SlidersHorizontal,
} from "lucide-react";
import { currentUser, flights, type Flight } from "@/lib/mock-data";
import { computeStatus, tramoVigente, S } from "@/lib/flight-utils";
import { useSaved } from "@/lib/saved-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const REVIEWS = {
  buyer: ["Pagó de inmediato, muy comunicativa durante el endoso.", "Todo rápido y claro."],
  seller: [
    "Envió el código de reserva de una y respondió al toque.",
    "Cero fricción, la aerolínea confirmó en menos de una hora.",
  ],
};

const searchSchema = z.object({
  tab: z.enum(["verificacion", "preferencias", "guardados"]).optional(),
});

export const Route = createFileRoute("/profile")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Mi perfil — Traspaso" },
      {
        name: "description",
        content: "Verificación de identidad y reputación como comprador y vendedor.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<"verificacion" | "preferencias" | "guardados">(
    search.tab ?? "verificacion",
  );
  useEffect(() => {
    if (search.tab) setTab(search.tab);
  }, [search.tab]);
  const { savedIds } = useSaved();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
      <div className="flex flex-wrap items-center gap-6 p-6 md:p-8 rounded-[2rem] border border-border bg-white shadow-sm">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-white shadow-sm">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback className="font-display text-4xl">{currentUser.avatar}</AvatarFallback>
          </Avatar>
          {currentUser.verifiedId && (
            <div className="absolute -bottom-2 -right-2 bg-[var(--color-secondary-token)] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-[var(--color-ink)]">
            {currentUser.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
            <span className="text-[var(--color-primary-token)] font-bold">
              {currentUser.handle}
            </span>
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

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <RatingBadge label="Compradora" rating={currentUser.ratingBuyer} />
            <RatingBadge label="Vendedora" rating={currentUser.ratingSeller} />
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-sm font-bold text-[var(--color-primary-token)] hover:underline">
                  Ver reseñas
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-extrabold text-[var(--color-ink)]">
                    Reseñas de {currentUser.name}
                  </DialogTitle>
                </DialogHeader>
                <ReviewsBlock
                  role="Como compradora"
                  rating={currentUser.ratingBuyer}
                  reviews={currentUser.reviewsBuyer}
                  quotes={REVIEWS.buyer}
                />
                <ReviewsBlock
                  role="Como vendedora"
                  rating={currentUser.ratingSeller}
                  reviews={currentUser.reviewsSeller}
                  quotes={REVIEWS.seller}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="mt-8 inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
        {(
          [
            ["verificacion", "Verificación", BadgeCheck],
            ["preferencias", "Preferencias", SlidersHorizontal],
            ["guardados", "Viajes guardados", Heart],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              tab === key
                ? "bg-[var(--color-ink)] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {key === "guardados" && savedIds.length > 0 && (
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                  tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {savedIds.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <section className="mt-4 rounded-[2rem] border border-border bg-white p-6 md:p-8 shadow-sm">
        {tab === "verificacion" && (
          <>
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
              Verificación
            </h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Estos datos no son públicos. Solo mostramos que tu perfil está verificado para mayor
              seguridad en la comunidad.
            </p>
            <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
              <VerifyRow label="DNI peruano" value={currentUser.dni} done />
              <VerifyRow label="Teléfono móvil" value={currentUser.phone} done />
              <VerifyRow label="Correo electrónico" value={currentUser.email} done />
              <VerifyRow label="Selfie con documento" value="Aprobada" done />
            </div>
          </>
        )}

        {tab === "preferencias" && (
          <>
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
              Preferencias
            </h2>
            <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
              <PrefRow label="Rutas favoritas" value="LIM ↔ CUZ · LIM ↔ AQP" />
              <PrefRow label="Alertas activas" value="3 rutas" />
              <PrefRow label="Método de pago" value="Yape · •• 4821" />
            </div>
          </>
        )}

        {tab === "guardados" && <GuardadosSection />}
      </section>
    </div>
  );
}

function GuardadosSection() {
  const { savedIds, removeSaved } = useSaved();
  const guardados = savedIds
    .map((id) => flights.find((f) => f.id === id))
    .filter((f): f is Flight => Boolean(f));

  return (
    <>
      <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
        Viajes guardados
      </h2>

      {guardados.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Toca el corazón en cualquier pasaje para guardarlo aquí y volver a verlo después.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {guardados.map((f) => {
            const status = computeStatus(f);
            const disponible = status !== "expired";
            const tramo = tramoVigente(f);
            return (
              <div
                key={f.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4"
              >
                <Link
                  to="/flight/$id"
                  params={{ id: f.id }}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2">
                    <Plane className="h-5 w-5 text-[var(--color-primary-token)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--color-ink)]">
                        {tramo.origin.code} → {tramo.destination.code}
                      </span>
                      {!disponible && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          Ya no disponible
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {tramo.origin.city} → {tramo.destination.city}
                      {disponible && <> · {S(f.resalePrice)}</>}
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => removeSaved(f.id)}
                  aria-label="Quitar de guardados"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-gray-100 hover:text-[var(--color-ink)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function RatingBadge({ label, rating }: { label: string; rating: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-warning-token)]/40 px-3 py-1 text-[var(--color-warning-token)]">
      <Star className="h-3.5 w-3.5 fill-current" />
      <span className="font-display text-sm font-bold">{rating.toFixed(2)}</span>
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
    </div>
  );
}

function ReviewsBlock({
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
    <div className="mt-2">
      <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]">
        {role}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-full bg-[var(--color-warning-token)]/10 px-3 py-1.5 text-[var(--color-warning-token)]">
          <Star className="h-5 w-5 fill-current" />
          <span className="font-display text-2xl font-bold">{rating.toFixed(2)}</span>
        </div>
        <span className="text-sm font-bold text-muted-foreground">{reviews} reseñas</span>
      </div>
      <div className="mt-4 space-y-3">
        {quotes.map((q, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium italic text-gray-700"
          >
            "{q}"
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifyRow({ label, value, done }: { label: string; value: string; done?: boolean }) {
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
