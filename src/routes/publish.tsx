import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { airportsList, airlines } from "@/lib/mock-data";
import { S } from "@/lib/flight-utils";

export const Route = createFileRoute("/publish")({
  head: () => ({
    meta: [
      { title: "Publicar mi pasaje — Traspaso" },
      {
        name: "description",
        content:
          "Publica tu pasaje aéreo en 2 minutos y recupera hasta el 80% de su valor. Pago retenido hasta confirmar el endoso.",
      },
      { property: "og:title", content: "Publica tu pasaje — Traspaso" },
      {
        property: "og:description",
        content:
          "Convierte un vuelo que no vas a usar en dinero de vuelta, con verificación de identidad y pago protegido.",
      },
    ],
  }),
  component: Publish,
});

function Publish() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    airline: "LATAM",
    flightNumber: "",
    from: "LIM",
    to: "CUZ",
    date: "",
    time: "",
    original: 380,
    price: 179,
    baggage: "solo cabina",
    seat: "",
    booking: "",
    idUploaded: false,
  });

  const suggested = useMemo(() => Math.round(data.original * 0.48), [data.original]);

  const steps = ["Datos del vuelo", "Comprobante", "Precio", "Confirmar"];

  if (step === 4) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-hairline bg-surface p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-signal text-[var(--color-signal-foreground)]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-4xl">Tu pasaje está publicado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Empezaremos a mostrarlo en el marketplace. Recibirás notificaciones cuando
            aparezcan interesados verificados.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <MiniStat n="0" label="Vistas" />
            <MiniStat n="0" label="Interesados" />
            <MiniStat n={S(data.price)} label="Precio" />
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Ir a mis traspasos <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm"
            >
              Ver marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Publicar pasaje
      </div>
      <h1 className="mt-1 font-display text-4xl md:text-5xl">
        Convierte tu vuelo en dinero de vuelta.
      </h1>

      {/* Stepper */}
      <div className="mt-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                i <= step
                  ? "bg-signal text-[var(--color-signal-foreground)]"
                  : "bg-surface-2 text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <div className={`hidden text-xs sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
              {s}
            </div>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-hairline" />}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-hairline bg-surface p-6 md:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl">Datos del vuelo</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Aerolínea">
                <select
                  className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
                  value={data.airline}
                  onChange={(e) => setData({ ...data, airline: e.target.value })}
                >
                  {airlines.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Número de vuelo">
                <input
                  className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
                  placeholder="LA 2043"
                  value={data.flightNumber}
                  onChange={(e) => setData({ ...data, flightNumber: e.target.value })}
                />
              </Field>
              <Field label="Origen">
                <select
                  className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
                  value={data.from}
                  onChange={(e) => setData({ ...data, from: e.target.value })}
                >
                  {airportsList.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.city} ({a.code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Destino">
                <select
                  className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
                  value={data.to}
                  onChange={(e) => setData({ ...data, to: e.target.value })}
                >
                  {airportsList.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.city} ({a.code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha">
                <input
                  type="date"
                  className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                />
              </Field>
              <Field label="Hora">
                <input
                  type="time"
                  className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
                  value={data.time}
                  onChange={(e) => setData({ ...data, time: e.target.value })}
                />
              </Field>
              <Field label="Asiento">
                <input
                  className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
                  placeholder="12A"
                  value={data.seat}
                  onChange={(e) => setData({ ...data, seat: e.target.value })}
                />
              </Field>
              <Field label="Equipaje">
                <select
                  className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm"
                  value={data.baggage}
                  onChange={(e) => setData({ ...data, baggage: e.target.value })}
                >
                  <option>solo cabina</option>
                  <option>23kg incluido</option>
                  <option>cabina + 23kg</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl">Comprobante de reserva</h2>
            <p className="text-sm text-muted-foreground">
              Sube el PDF o pega el código de reserva. Verificamos que el pasaje sea
              válido y endosable antes de mostrarlo al público.
            </p>
            <Field label="Código de reserva (PNR)">
              <input
                className="w-full rounded-lg border border-hairline bg-background px-3 py-2 text-sm uppercase tracking-widest"
                placeholder="ABC123"
                value={data.booking}
                onChange={(e) =>
                  setData({ ...data, booking: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <button
              onClick={() => {
                setData({ ...data, idUploaded: true });
                toast.success("Boleto verificado con la aerolínea");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-background px-4 py-8 text-sm text-muted-foreground hover:border-signal/50 hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              {data.idUploaded ? "Boleto verificado ✓" : "Subir boleto (PDF o imagen)"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl">Precio de reventa</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Precio original que pagaste">
                <div className="flex items-center gap-2 rounded-lg border border-hairline bg-background px-3 py-2 text-sm">
                  <span className="text-muted-foreground">S/</span>
                  <input
                    type="number"
                    className="w-full bg-transparent focus:outline-none"
                    value={data.original}
                    onChange={(e) =>
                      setData({ ...data, original: Number(e.target.value) })
                    }
                  />
                </div>
              </Field>
              <Field label="Tu precio de reventa">
                <div className="flex items-center gap-2 rounded-lg border border-hairline bg-background px-3 py-2 text-sm">
                  <span className="text-muted-foreground">S/</span>
                  <input
                    type="number"
                    className="w-full bg-transparent focus:outline-none"
                    value={data.price}
                    onChange={(e) =>
                      setData({ ...data, price: Number(e.target.value) })
                    }
                  />
                </div>
              </Field>
            </div>
            <div className="rounded-2xl border border-hairline bg-background p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-signal" />
                <div className="flex-1">
                  <div className="text-sm">
                    Precio sugerido para rotar rápido:{" "}
                    <span className="font-display text-lg">{S(suggested)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Basado en vuelos similares vendidos en las últimas 72h.
                  </div>
                </div>
                <button
                  onClick={() => setData({ ...data, price: suggested })}
                  className="rounded-full border border-hairline px-3 py-1 text-xs hover:bg-surface-2"
                >
                  Usar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                n={`${Math.max(0, Math.round((1 - data.price / data.original) * 100))}%`}
                label="Descuento vs. original"
              />
              <MiniStat
                n={S(Math.round(data.price * 0.95))}
                label="Recibes (comisión 5%)"
              />
              <MiniStat n="~48h" label="Tiempo estimado de venta" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl">Confirmar publicación</h2>
            <dl className="divide-y divide-hairline rounded-2xl border border-hairline bg-background text-sm">
              <Info2 k="Vuelo" v={`${data.airline} ${data.flightNumber || "—"}`} />
              <Info2 k="Ruta" v={`${data.from} → ${data.to}`} />
              <Info2 k="Fecha" v={`${data.date || "—"} ${data.time}`} />
              <Info2 k="Asiento" v={data.seat || "—"} />
              <Info2 k="Equipaje" v={data.baggage} />
              <Info2 k="Precio publicado" v={S(data.price)} />
              <Info2 k="Recibes al confirmar" v={S(Math.round(data.price * 0.95))} />
            </dl>
            <p className="text-xs text-muted-foreground">
              Al publicar aceptas los términos del endoso. El pago del comprador queda
              retenido y solo se libera cuando la aerolínea confirma el traspaso.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-full border border-hairline px-5 py-2.5 text-sm disabled:opacity-40"
        >
          Atrás
        </button>
        <button
          onClick={() => setStep((s) => s + 1)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {step === 3 ? "Publicar pasaje" : "Continuar"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniStat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-background px-4 py-3">
      <div className="font-display text-xl">{n}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Info2({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
