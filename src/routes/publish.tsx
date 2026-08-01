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

  const steps = ["Vuelo", "Reserva", "Precio", "Listo"];

  if (step === 4) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-[2rem] border border-border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-secondary-token)] text-white">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold text-[var(--color-ink)]">Pasaje publicado</h1>
          <p className="mt-3 text-sm font-medium text-muted-foreground leading-relaxed">
            Empezaremos a mostrarlo en el marketplace. Recibirás notificaciones cuando
            aparezcan interesados verificados.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            <MiniStat n="0" label="Vistas" />
            <MiniStat n="0" label="Interesados" />
            <MiniStat n={S(data.price)} label="Precio" isMono />
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
            >
              Ir a mis traspasos <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-100 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
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
      <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]">
        Publicar pasaje
      </div>
      <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold text-[var(--color-ink)]">
        Convierte tu vuelo en dinero de vuelta.
      </h1>

      {/* Stepper */}
      <div className="mt-10 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                i <= step
                  ? "bg-[var(--color-ink)] text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}
            </div>
            <div className={`hidden text-xs font-bold uppercase tracking-wider sm:block ${i === step ? "text-[var(--color-ink)]" : "text-gray-400"}`}>
              {s}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-1 flex-1 rounded-full ${i < step ? "bg-[var(--color-ink)]" : "bg-gray-100"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border border-border bg-white p-6 md:p-10 shadow-sm">
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">Datos del vuelo</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Aerolínea">
                <select
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                  placeholder="LA 2043"
                  value={data.flightNumber}
                  onChange={(e) => setData({ ...data, flightNumber: e.target.value })}
                />
              </Field>
              <Field label="Origen">
                <select
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                />
              </Field>
              <Field label="Hora">
                <input
                  type="time"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                  value={data.time}
                  onChange={(e) => setData({ ...data, time: e.target.value })}
                />
              </Field>
              <Field label="Asiento">
                <input
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                  placeholder="12A"
                  value={data.seat}
                  onChange={(e) => setData({ ...data, seat: e.target.value })}
                />
              </Field>
              <Field label="Equipaje">
                <select
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
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
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">Comprobante de reserva</h2>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Sube el PDF o pega el código de reserva. Verificamos que el pasaje sea
              válido y endosable antes de mostrarlo al público.
            </p>
            <Field label="Código de reserva (PNR)">
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono font-bold uppercase tracking-widest focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
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
              className={`flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-sm font-bold transition-colors ${
                data.idUploaded
                  ? "border-[var(--color-secondary-token)] bg-[var(--color-secondary-token)]/5 text-[var(--color-secondary-token)]"
                  : "border-gray-300 bg-gray-50 text-gray-500 hover:border-[var(--color-primary-token)] hover:text-[var(--color-primary-token)]"
              }`}
            >
              {data.idUploaded ? (
                <>
                  <CheckCircle2 className="h-6 w-6" /> Boleto verificado ✓
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" /> Subir boleto (PDF o imagen)
                </>
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">Precio de reventa</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Precio original que pagaste">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm focus-within:border-[var(--color-primary-token)] focus-within:ring-1 focus-within:ring-[var(--color-primary-token)]">
                  <span className="text-muted-foreground font-bold">S/</span>
                  <input
                    type="number"
                    className="w-full bg-transparent font-mono font-bold text-[var(--color-ink)] focus:outline-none"
                    value={data.original}
                    onChange={(e) =>
                      setData({ ...data, original: Number(e.target.value) })
                    }
                  />
                </div>
              </Field>
              <Field label="Tu precio de reventa">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-primary-token)] bg-background px-4 py-3 text-sm ring-1 ring-[var(--color-primary-token)]">
                  <span className="text-[var(--color-primary-token)] font-bold">S/</span>
                  <input
                    type="number"
                    className="w-full bg-transparent font-mono text-lg font-bold text-[var(--color-ink)] focus:outline-none"
                    value={data.price}
                    onChange={(e) =>
                      setData({ ...data, price: Number(e.target.value) })
                    }
                  />
                </div>
              </Field>
            </div>
            
            <div className="rounded-2xl border border-[var(--color-secondary-token)]/30 bg-[var(--color-secondary-token)]/5 p-6">
              <div className="flex items-start gap-4">
                <div className="bg-[var(--color-secondary-token)] p-2 rounded-full mt-1">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--color-ink)]">
                    Precio sugerido para rotar rápido:{" "}
                    <span className="font-mono text-xl text-[var(--color-secondary-token)] ml-1">{S(suggested)}</span>
                  </div>
                  <div className="mt-1 text-xs font-medium text-[var(--color-ink)]/70">
                    Basado en vuelos similares vendidos en las últimas 72h.
                  </div>
                </div>
                <button
                  onClick={() => setData({ ...data, price: suggested })}
                  className="rounded-full bg-white border border-[var(--color-secondary-token)] px-4 py-1.5 text-xs font-bold text-[var(--color-secondary-token)] hover:bg-[var(--color-secondary-token)] hover:text-white transition-colors shadow-sm"
                >
                  Usar
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dashed border-gray-200">
              <MiniStat
                n={`${Math.max(0, Math.round((1 - data.price / data.original) * 100))}%`}
                label="Descuento vs. original"
                isMono
              />
              <MiniStat
                n={S(Math.round(data.price * 0.95))}
                label="Recibes (comisión 5%)"
                isMono
              />
              <MiniStat n="~48h" label="Est. venta" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">Confirmar publicación</h2>
            <dl className="divide-y divide-gray-100 rounded-2xl border border-border bg-gray-50 text-sm overflow-hidden">
              <Info2 k="Vuelo" v={`${data.airline} ${data.flightNumber || "—"}`} />
              <Info2 k="Ruta" v={`${data.from} → ${data.to}`} />
              <Info2 k="Fecha" v={`${data.date || "—"} ${data.time}`} />
              <Info2 k="Asiento" v={data.seat || "—"} />
              <Info2 k="Equipaje" v={data.baggage} />
              <Info2 k="Precio publicado" v={S(data.price)} isMono highlight />
              <Info2 k="Recibes al confirmar" v={S(Math.round(data.price * 0.95))} isMono />
            </dl>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed bg-white p-4 rounded-xl border border-gray-100">
              Al publicar aceptas los términos del endoso. El pago del comprador queda
              retenido en garantía y solo se libera cuando la aerolínea confirma el traspaso.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between gap-4">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-full bg-white border border-border px-8 py-3.5 text-sm font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
        >
          Atrás
        </button>
        <button
          onClick={() => setStep((s) => s + 1)}
          className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-full bg-[var(--color-primary-token)] px-10 py-3.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105"
        >
          {step === 3 ? "Publicar pasaje" : "Continuar"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-ink)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniStat({ n, label, isMono }: { n: string; label: string; isMono?: boolean }) {
  return (
    <div className="rounded-[1rem] border border-border bg-white px-5 py-4 shadow-sm">
      <div className={`text-2xl ${isMono ? 'font-mono font-bold text-[var(--color-primary-token)]' : 'font-display font-extrabold text-[var(--color-ink)]'}`}>{n}</div>
      <div className="text-[11px] font-bold uppercase text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Info2({ k, v, isMono, highlight }: { k: string; v: string; isMono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-white">
      <span className="font-medium text-gray-500">{k}</span>
      <span className={`${isMono ? 'font-mono font-bold' : 'font-semibold'} ${highlight ? 'text-[var(--color-primary-token)] text-lg' : 'text-[var(--color-ink)]'}`}>{v}</span>
    </div>
  );
}
