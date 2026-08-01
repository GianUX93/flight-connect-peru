import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import {
  airportsList,
  airlines,
  type AsientoCategoria,
  type Asiento,
  type TramoAVender,
} from "@/lib/mock-data";
import {
  ASIENTO_ALEATORIO_MENSAJE,
  ASIENTO_CATEGORIA_LABEL,
  PLATFORM_COMMISSION_RATE,
  S,
  asientoLabel,
  tramoAVenderLabel,
} from "@/lib/flight-utils";

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
    arrivalTime: "",
    hasReturn: false,
    returnFrom: "CUZ",
    returnTo: "LIM",
    returnDate: "",
    returnTime: "",
    returnArrivalTime: "",
    tramoAVender: "ida" as TramoAVender,
    original: 380,
    price: 179,
    baggage: "solo cabina",
    asientoTipo: "seleccionado" as Asiento["tipo"],
    asientoCategoria: "ventana" as AsientoCategoria | null,
    asientoNumero: "",
    booking: "",
    idUploaded: false,
    pasajero: {
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      email: "",
      telefono: "",
    },
    cargoEstimado: null as number | null,
  });

  const suggested = useMemo(() => Math.round(data.original * 0.48), [data.original]);

  const comision = Math.round(data.price * PLATFORM_COMMISSION_RATE);
  const cargoEstimadoAplicado = data.cargoEstimado ?? 0;
  const montoNetoEstimado = data.price - cargoEstimadoAplicado - comision;

  const asiento: Asiento =
    data.asientoTipo === "seleccionado"
      ? {
          tipo: "seleccionado",
          categoria: data.asientoCategoria,
          numero: data.asientoNumero || null,
        }
      : { tipo: "aleatorio", categoria: null, numero: null };

  function toggleHasReturn(hasReturn: boolean) {
    setData({
      ...data,
      hasReturn,
      tramoAVender: hasReturn ? "ambos" : "ida",
      returnFrom: hasReturn ? data.to : data.returnFrom,
      returnTo: hasReturn ? data.from : data.returnTo,
    });
  }

  function rutaLabel() {
    if (!data.hasReturn || data.tramoAVender === "ida") return `${data.from} → ${data.to}`;
    if (data.tramoAVender === "regreso") return `${data.returnFrom} → ${data.returnTo}`;
    return `${data.from} → ${data.to} → ${data.returnFrom}`;
  }

  const steps = ["Vuelo", "Reserva", "Precio", "Listo"];

  if (step === 4) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-[2rem] border border-border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-secondary-token)] text-white">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold text-[var(--color-ink)]">
            Pasaje publicado
          </h1>
          <p className="mt-3 text-sm font-medium text-muted-foreground leading-relaxed">
            Empezaremos a mostrarlo en el marketplace. Recibirás notificaciones cuando aparezcan
            interesados verificados.
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
                i <= step ? "bg-[var(--color-ink)] text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}
            </div>
            <div
              className={`hidden text-xs font-bold uppercase tracking-wider sm:block ${i === step ? "text-[var(--color-ink)]" : "text-gray-400"}`}
            >
              {s}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-1 flex-1 rounded-full ${i < step ? "bg-[var(--color-ink)]" : "bg-gray-100"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[2rem] border border-border bg-white p-6 md:p-10 shadow-sm">
        {step === 0 && (
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
                Información del vuelo
              </h2>
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

              <div className="rounded-2xl border border-border bg-gray-50 p-6 space-y-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)]">
                  Tramo de ida
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
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
                  <div className="grid grid-cols-2 gap-5">
                    <Field label="Hora salida">
                      <input
                        type="time"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                        value={data.time}
                        onChange={(e) => setData({ ...data, time: e.target.value })}
                      />
                    </Field>
                    <Field label="Hora llegada">
                      <input
                        type="time"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                        value={data.arrivalTime}
                        onChange={(e) => setData({ ...data, arrivalTime: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <Field label="¿Boleto de regreso?">
                <div className="inline-flex self-start rounded-full border border-border bg-white p-1 shadow-sm">
                  <PillToggle
                    active={!data.hasReturn}
                    onClick={() => toggleHasReturn(false)}
                    label="No"
                  />
                  <PillToggle
                    active={data.hasReturn}
                    onClick={() => toggleHasReturn(true)}
                    label="Sí"
                  />
                </div>
              </Field>

              {data.hasReturn && (
                <div className="rounded-2xl border border-border bg-gray-50 p-6 space-y-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)]">
                    Tramo de regreso
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Origen">
                      <select
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                        value={data.returnFrom}
                        onChange={(e) => setData({ ...data, returnFrom: e.target.value })}
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
                        value={data.returnTo}
                        onChange={(e) => setData({ ...data, returnTo: e.target.value })}
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
                        value={data.returnDate}
                        onChange={(e) => setData({ ...data, returnDate: e.target.value })}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Hora salida">
                        <input
                          type="time"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                          value={data.returnTime}
                          onChange={(e) => setData({ ...data, returnTime: e.target.value })}
                        />
                      </Field>
                      <Field label="Hora llegada">
                        <input
                          type="time"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                          value={data.returnArrivalTime}
                          onChange={(e) => setData({ ...data, returnArrivalTime: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {data.hasReturn && (
              <div className="space-y-4 border-t border-dashed border-gray-200 pt-8">
                <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
                  Tu oferta de venta
                </h2>
                <Field label="¿Qué tramo(s) estás vendiendo en esta oferta?">
                  <p className="mb-2 text-xs font-medium text-muted-foreground leading-relaxed">
                    Una sola oferta, para un solo comprador. Afecta el precio y la vigencia del
                    endoso.
                  </p>
                  <div className="inline-flex flex-wrap self-start rounded-full border border-border bg-white p-1 shadow-sm">
                    {(["ida", "regreso", "ambos"] as TramoAVender[]).map((t) => (
                      <PillToggle
                        key={t}
                        active={data.tramoAVender === t}
                        onClick={() => setData({ ...data, tramoAVender: t })}
                        label={tramoAVenderLabel(t)}
                      />
                    ))}
                  </div>
                </Field>
              </div>
            )}

            <div className="space-y-6 border-t border-dashed border-gray-200 pt-8">
              <div>
                <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
                  Información de asiento
                </h2>
                <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed">
                  Con asiento aleatorio, la aerolínea recién lo asigna en el boarding pass — el
                  mismo momento en que se cierra la ventana del endoso. Por eso se define ahora, sin
                  dejarlo pendiente.
                </p>
              </div>
              <Field label="¿Tu tarifa incluye selección de asiento?">
                <div className="inline-flex self-start rounded-full border border-border bg-white p-1 shadow-sm">
                  <PillToggle
                    active={data.asientoTipo === "aleatorio"}
                    onClick={() => setData({ ...data, asientoTipo: "aleatorio" })}
                    label="No"
                  />
                  <PillToggle
                    active={data.asientoTipo === "seleccionado"}
                    onClick={() => setData({ ...data, asientoTipo: "seleccionado" })}
                    label="Sí"
                  />
                </div>
              </Field>

              {data.asientoTipo === "seleccionado" ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Categoría">
                    <div className="inline-flex flex-wrap self-start rounded-full border border-border bg-white p-1 shadow-sm">
                      {(["ventana", "medio", "pasillo"] as AsientoCategoria[]).map((c) => (
                        <PillToggle
                          key={c}
                          active={data.asientoCategoria === c}
                          onClick={() => setData({ ...data, asientoCategoria: c })}
                          label={ASIENTO_CATEGORIA_LABEL[c]}
                        />
                      ))}
                    </div>
                  </Field>
                  <Field label="Número de asiento (opcional)">
                    <input
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                      placeholder="12A"
                      value={data.asientoNumero}
                      onChange={(e) => setData({ ...data, asientoNumero: e.target.value })}
                    />
                  </Field>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs font-medium text-muted-foreground leading-relaxed">
                  {ASIENTO_ALEATORIO_MENSAJE}
                </div>
              )}
            </div>

            <div className="space-y-6 border-t border-dashed border-gray-200 pt-8">
              <div>
                <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
                  Datos del pasajero
                </h2>
                <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed">
                  El titular actual del boleto (no el futuro comprador). Los necesitamos para el
                  trámite de endoso con la aerolínea más adelante.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nombres">
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    value={data.pasajero.nombres}
                    onChange={(e) =>
                      setData({ ...data, pasajero: { ...data.pasajero, nombres: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Apellido paterno">
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    value={data.pasajero.apellidoPaterno}
                    onChange={(e) =>
                      setData({
                        ...data,
                        pasajero: { ...data.pasajero, apellidoPaterno: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Apellido materno">
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    value={data.pasajero.apellidoMaterno}
                    onChange={(e) =>
                      setData({
                        ...data,
                        pasajero: { ...data.pasajero, apellidoMaterno: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    value={data.pasajero.email}
                    onChange={(e) =>
                      setData({ ...data, pasajero: { ...data.pasajero, email: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    type="tel"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    value={data.pasajero.telefono}
                    onChange={(e) =>
                      setData({ ...data, pasajero: { ...data.pasajero, telefono: e.target.value } })
                    }
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
              Comprobante de reserva
            </h2>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Sube el PDF o pega el código de reserva. Verificamos que el pasaje sea válido y
              endosable antes de mostrarlo al público.
            </p>
            <Field label="Código de reserva (PNR)">
              <input
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono font-bold uppercase tracking-widest focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                placeholder="ABC123"
                value={data.booking}
                onChange={(e) => setData({ ...data, booking: e.target.value.toUpperCase() })}
              />
            </Field>
            <button
              onClick={() => setData({ ...data, idUploaded: true })}
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
                "Subir boleto (PDF o imagen)"
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
              Precio de reventa
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Precio original que pagaste">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm focus-within:border-[var(--color-primary-token)] focus-within:ring-1 focus-within:ring-[var(--color-primary-token)]">
                  <span className="text-muted-foreground font-bold">S/</span>
                  <input
                    type="number"
                    className="w-full bg-transparent font-mono font-bold text-[var(--color-ink)] focus:outline-none"
                    value={data.original}
                    onChange={(e) => setData({ ...data, original: Number(e.target.value) })}
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
                    onChange={(e) => setData({ ...data, price: Number(e.target.value) })}
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
                    <span className="font-mono text-xl text-[var(--color-secondary-token)] ml-1">
                      {S(suggested)}
                    </span>
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

            <div className="space-y-3">
              <div className="text-sm font-bold text-[var(--color-ink)]">
                ¿Ya averiguaste cuánto te cobra {data.airline} por el endoso?
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                Es opcional y privado — solo lo usamos para calcular tu neto estimado, y el
                comprador nunca lo ve. No hace falta evidencia acá: una vez que tengas comprador y
                estés gestionando el endoso con la aerolínea, te pediremos subir el comprobante aquí
                mismo para confirmar tu neto real.
              </p>
              <Field label="Cargo estimado (opcional)">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm">
                  <span className="text-muted-foreground font-bold">S/</span>
                  <input
                    type="number"
                    placeholder="No lo sé todavía"
                    className="w-full bg-transparent font-mono font-bold text-[var(--color-ink)] placeholder:font-sans placeholder:font-normal focus:outline-none"
                    value={data.cargoEstimado ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        cargoEstimado: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </Field>
            </div>

            {/* Desglose tipo recibo — cada concepto en su propia línea, nunca un número final opaco */}
            <div className="tarjeta-boleto p-6 space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Desglose — neto estimado
              </div>
              <ReceiptRow
                label={`Precio de venta (${data.hasReturn ? tramoAVenderLabel(data.tramoAVender) : "solo ida"})`}
                value={S(data.price)}
              />
              <ReceiptRow
                label={`Comisión Traspaso (${Math.round(PLATFORM_COMMISSION_RATE * 100)}%)`}
                value={`− ${S(comision)}`}
              />
              {data.cargoEstimado != null ? (
                <ReceiptRow
                  label="Cargo estimado de aerolínea"
                  value={`− ${S(data.cargoEstimado)}`}
                  note="Estimado por ti, no verificado"
                />
              ) : (
                <ReceiptRow
                  label="Cargo estimado de aerolínea"
                  value={S(0)}
                  note="No ingresaste un estimado — te recomendamos confirmarlo con la aerolínea antes de publicar, o tu neto real podría ser menor a este cálculo."
                  warn
                />
              )}
              <div className="flex items-baseline justify-between border-t border-dashed border-gray-200 pt-3">
                <span className="text-sm font-bold text-[var(--color-ink)]">
                  Neto estimado a recibir
                </span>
                <span className="font-mono text-2xl font-bold text-[var(--color-primary-token)]">
                  {S(montoNetoEstimado)}
                </span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Cifra estimada, no garantizada
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MiniStat
                n={`${Math.max(0, Math.round((1 - data.price / data.original) * 100))}%`}
                label="Descuento vs. original"
                isMono
              />
              <MiniStat n="~48h" label="Est. venta" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
              Confirmar publicación
            </h2>
            <dl className="divide-y divide-gray-100 rounded-2xl border border-border bg-gray-50 text-sm overflow-hidden">
              <Info2 k="Vuelo" v={`${data.airline} ${data.flightNumber || "—"}`} />
              <Info2 k="Ruta" v={rutaLabel()} />
              {data.hasReturn && <Info2 k="Vendiendo" v={tramoAVenderLabel(data.tramoAVender)} />}
              <Info2 k="Fecha" v={`${data.date || "—"} ${data.time}`} />
              <Info2 k="Asiento" v={asientoLabel(asiento)} />
              <Info2 k="Equipaje" v={data.baggage} />
              <Info2
                k="Pasajero"
                v={
                  data.pasajero.nombres || data.pasajero.apellidoPaterno
                    ? `${data.pasajero.nombres} ${data.pasajero.apellidoPaterno}`.trim()
                    : "—"
                }
              />
              <Info2 k="Precio publicado" v={S(data.price)} isMono highlight />
              <Info2 k="Cargo estimado de aerolínea" v={S(cargoEstimadoAplicado)} isMono />
              <Info2 k="Comisión Traspaso (5%)" v={`− ${S(comision)}`} isMono />
              <Info2 k="Neto estimado a recibir" v={S(montoNetoEstimado)} isMono highlight />
            </dl>
            {data.cargoEstimado == null && (
              <p className="text-xs font-bold text-[var(--color-ink)] leading-relaxed bg-yellow-50 border border-[var(--color-warning-token)]/50 p-4 rounded-xl">
                No ingresaste un cargo estimado de aerolínea — este neto podría bajar si la
                aerolínea te cobra algo durante el trámite real.
              </p>
            )}
            <p className="text-xs font-medium text-muted-foreground leading-relaxed bg-white p-4 rounded-xl border border-gray-100">
              Al publicar aceptas los términos del endoso. El pago del comprador queda retenido en
              garantía y solo se libera cuando la aerolínea confirma el traspaso.
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

function PillToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
        active ? "bg-[var(--color-ink)] text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function MiniStat({ n, label, isMono }: { n: string; label: string; isMono?: boolean }) {
  return (
    <div className="rounded-[1rem] border border-border bg-white px-5 py-4 shadow-sm">
      <div
        className={`text-2xl ${isMono ? "font-mono font-bold text-[var(--color-primary-token)]" : "font-display font-extrabold text-[var(--color-ink)]"}`}
      >
        {n}
      </div>
      <div className="text-[11px] font-bold uppercase text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Info2({
  k,
  v,
  isMono,
  highlight,
}: {
  k: string;
  v: string;
  isMono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-white">
      <span className="font-medium text-gray-500">{k}</span>
      <span
        className={`${isMono ? "font-mono font-bold" : "font-semibold"} ${highlight ? "text-[var(--color-primary-token)] text-lg" : "text-[var(--color-ink)]"}`}
      >
        {v}
      </span>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  note,
  warn,
}: {
  label: string;
  value: string;
  note?: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div>
        <div className="font-medium text-gray-600">{label}</div>
        {note && (
          <div
            className={`mt-0.5 text-xs font-medium leading-relaxed ${warn ? "text-[var(--color-warning-token)]" : "text-muted-foreground"}`}
          >
            {note}
          </div>
        )}
      </div>
      <span className="shrink-0 font-mono font-bold text-[var(--color-ink)]">{value}</span>
    </div>
  );
}
