import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, useRequireAuth } from "@/lib/auth-context";
import { createFlight, uploadFlightVoucher } from "@/lib/services/flights";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Upload,
  Loader2,
  ChevronDown,
  PlaneLanding,
} from "lucide-react";
import { toast } from "sonner";
import {
  airportsList,
  airports,
  airlines,
  type AsientoCategoria,
  type Asiento,
  type TramoAVender,
  type TipoDocumento,
} from "@/lib/mock-data";
import {
  PLATFORM_COMMISSION_RATE,
  S,
  asientoLabel,
  tramoAVenderLabel,
  sanitizeNumeroDocumento,
  DOCUMENTO_MAX_LEN,
} from "@/lib/flight-utils";
import { splitPhone } from "@/lib/phone-prefixes";
import { PhoneInput } from "@/components/site/PhoneInput";
import { Field, PillToggle, AsientoFields, ReceiptRow } from "@/components/site/PublishFormFields";

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
  const { ready } = useRequireAuth();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  // El paso más lejano al que ya llegó — el stepper solo deja saltar a pasos
  // que ya se completaron, nunca adelante a uno que todavía no se validó.
  const [maxStepReached, setMaxStepReached] = useState(0);
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const stepDirection = useRef(1);
  const isFirstRender = useRef(true);

  // Anima la entrada del contenido del paso (fade + slide sutil, con dirección
  // según si se avanzó o retrocedió) y lleva el scroll al inicio del formulario
  // — sin esto, "Continuar" deja al usuario viendo la parte de abajo del paso
  // anterior en vez del inicio del nuevo.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!formCardRef.current) return;
    gsap.fromTo(
      formCardRef.current,
      { opacity: 0, x: stepDirection.current * 16 },
      { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" },
    );
    // scrollIntoView ignora el header sticky (56px) y deja el título tapado
    // detrás de él — se calcula el offset a mano.
    if (titleRef.current) {
      const SITE_HEADER_HEIGHT = 56;
      const top =
        titleRef.current.getBoundingClientRect().top + window.scrollY - SITE_HEADER_HEIGHT - 16;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [step]);

  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, step));
  }, [step]);

  const [scanning, setScanning] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [precioTouched, setPrecioTouched] = useState(false);
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
    asientoIdaTipo: "seleccionado" as Asiento["tipo"],
    asientoIdaCategoria: "ventana" as AsientoCategoria | null,
    asientoIdaNumero: "",
    asientoRegresoTipo: "seleccionado" as Asiento["tipo"],
    asientoRegresoCategoria: "ventana" as AsientoCategoria | null,
    asientoRegresoNumero: "",
    booking: "",
    voucherUrl: null as string | null,
    voucherName: "",
    pasajero: {
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      email: "",
      telefonoPrefijo: "+51",
      telefono: "",
      tipoDocumento: "DNI" as TipoDocumento,
      numeroDocumento: "",
    },
    cargoEstimado: null as number | null,
    notaVendedor: "",
  });

  // Prellena el contacto del pasajero con el email/teléfono ya registrados —
  // solo mientras el vendedor no haya tocado esos campos, para no pisar lo
  // que ya escribió si el pasaje es de otra persona.
  useEffect(() => {
    if (!profile && !user) return;
    setData((prev) => {
      if (prev.pasajero.email || prev.pasajero.telefono) return prev;
      const { prefijo, numero } = splitPhone(profile?.phone ?? null);
      return {
        ...prev,
        pasajero: {
          ...prev.pasajero,
          email: user?.email ?? prev.pasajero.email,
          telefonoPrefijo: numero ? prefijo : prev.pasajero.telefonoPrefijo,
          telefono: numero || prev.pasajero.telefono,
        },
      };
    });
  }, [profile, user]);

  const suggested = useMemo(() => Math.round(data.original * 0.48), [data.original]);

  const precioMinimo = Math.max(1, Math.ceil(data.original * 0.1));
  const precioMaximo = Math.max(precioMinimo, data.original - 1);
  const precioError =
    data.price >= data.original
      ? `El precio de reventa debe ser menor al original (${S(data.original)}). Este no es un marketplace de reventa a la par.`
      : data.price < precioMinimo
        ? `El precio mínimo permitido es ${S(precioMinimo)} (10% del original).`
        : null;

  const comision = Math.round(data.price * PLATFORM_COMMISSION_RATE);
  const cargoEstimadoAplicado = data.cargoEstimado ?? 0;
  const montoNetoEstimado = data.price - cargoEstimadoAplicado - comision;

  const vendeIda = !data.hasReturn || data.tramoAVender === "ida" || data.tramoAVender === "ambos";
  const vendeRegreso =
    data.hasReturn && (data.tramoAVender === "regreso" || data.tramoAVender === "ambos");

  const asientoIda: Asiento =
    data.asientoIdaTipo === "seleccionado"
      ? {
          tipo: "seleccionado",
          categoria: data.asientoIdaCategoria,
          numero: data.asientoIdaNumero || null,
        }
      : { tipo: "aleatorio", categoria: null, numero: null };

  const asientoRegreso: Asiento | null = !vendeRegreso
    ? null
    : data.asientoRegresoTipo === "seleccionado"
      ? {
          tipo: "seleccionado",
          categoria: data.asientoRegresoCategoria,
          numero: data.asientoRegresoNumero || null,
        }
      : { tipo: "aleatorio", categoria: null, numero: null };

  // Campos obligatorios por paso — bloquea "Continuar" en vez de dejar avanzar
  // con datos incompletos (evita, por ejemplo, publicar sin fecha/hora de vuelo).
  const step0Valido =
    data.flightNumber.trim() !== "" &&
    data.date !== "" &&
    data.time !== "" &&
    data.arrivalTime !== "" &&
    (!data.hasReturn ||
      (data.returnDate !== "" && data.returnTime !== "" && data.returnArrivalTime !== "")) &&
    data.pasajero.nombres.trim() !== "" &&
    data.pasajero.apellidoPaterno.trim() !== "" &&
    data.pasajero.email.trim() !== "" &&
    data.pasajero.telefono.trim() !== "" &&
    data.pasajero.numeroDocumento.length === DOCUMENTO_MAX_LEN[data.pasajero.tipoDocumento] &&
    data.booking.trim() !== "" &&
    !!data.voucherUrl;

  // El mismo archivo que se sube acá cumple dos funciones: dispara el
  // autocompletado simulado por IA y queda guardado como el comprobante real
  // que un revisor usa para aprobar la publicación — antes se pedía subirlo
  // dos veces (uno acá, otro en un paso "Reserva" aparte) sin necesidad.
  async function handleVoucherUpload(file: File | undefined) {
    if (!file || !user) return;
    setScanning(true);
    try {
      const voucherUrl = await uploadFlightVoucher(user.id, file);
      window.setTimeout(() => {
        setData((prev) => ({
          ...prev,
          voucherUrl,
          voucherName: file.name,
          airline: "LATAM",
          flightNumber: "LA 2091",
          booking: prev.booking || "XZK4P9",
          from: "LIM",
          to: "AQP",
          date: new Date(Date.now() + 12 * 86400_000).toISOString().slice(0, 10),
          time: "08:45",
          arrivalTime: "10:20",
          baggage: "23kg incluido",
          pasajero: {
            ...prev.pasajero,
            nombres: prev.pasajero.nombres || "Andrea",
            apellidoPaterno: prev.pasajero.apellidoPaterno || "Salazar",
            apellidoMaterno: prev.pasajero.apellidoMaterno || "Rojas",
          },
        }));
        setScanning(false);
        toast.success("Datos extraídos del voucher", {
          description:
            "Vuelo y pasajero completados. Revisa que todo esté correcto — el email y teléfono no vienen en el voucher, complétalos tú.",
        });
      }, 1800);
    } catch {
      setScanning(false);
      toast.error("No se pudo subir el comprobante. Intenta de nuevo.");
    }
  }

  function toggleHasReturn(hasReturn: boolean) {
    setData({
      ...data,
      hasReturn,
      tramoAVender: hasReturn ? "ambos" : "ida",
      returnFrom: hasReturn ? data.to : data.returnFrom,
      returnTo: hasReturn ? data.from : data.returnTo,
    });
  }

  // Valida y arma la fecha/hora de un tramo; null si falta algún dato, en vez de
  // dejar que `new Date(...).toISOString()` reviente con "Invalid time value".
  function buildIso(dateStr: string, timeStr: string): string | null {
    if (!dateStr || !timeStr) return null;
    const d = new Date(`${dateStr}T${timeStr}`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  async function handlePublicar() {
    if (!user) {
      toast.error("Necesitas iniciar sesión para publicar.");
      return;
    }
    if (user.id.startsWith("sim-")) {
      toast.error(
        "Esta sesión es simulada — publicar un pasaje real requiere iniciar sesión con una cuenta real de Supabase. Cierra sesión y vuelve a entrar con esa cuenta.",
      );
      return;
    }

    const departureIso = buildIso(data.date, data.time);
    if (!departureIso) {
      toast.error("Falta la fecha y hora de salida del vuelo de ida.");
      setStep(0);
      return;
    }
    const returnIso = data.hasReturn ? buildIso(data.returnDate, data.returnTime) : null;
    if (data.hasReturn && !returnIso) {
      toast.error("Falta la fecha y hora de salida del vuelo de vuelta.");
      setStep(0);
      return;
    }

    setPublicando(true);
    try {
      await createFlight({
        ticket_type: data.hasReturn ? "ida_y_vuelta" : "solo_ida",
        origin_code: data.from,
        origin_city: airportsList.find((a) => a.code === data.from)?.city ?? data.from,
        destination_code: data.to,
        destination_city: airportsList.find((a) => a.code === data.to)?.city ?? data.to,
        departure_date: departureIso,
        return_date: returnIso,
        sell_segment: data.tramoAVender,
        airline: data.airline,
        booking_code: data.flightNumber,
        original_price: data.original,
        resale_price: data.price,
        seat_outbound: vendeIda ? asientoIda : null,
        seat_return: vendeRegreso ? asientoRegreso : null,
        airline_fee_estimate: data.cargoEstimado,
        status: "pendiente_revision",
        seller_id: user.id,
        reservation_code: data.booking,
        voucher_url: data.voucherUrl,
        seller_note: data.notaVendedor.trim() || null,
      });
      setStep(3);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : null;
      toast.error(message ? `No se pudo publicar: ${message}` : "No se pudo publicar el pasaje.");
    } finally {
      setPublicando(false);
    }
  }

  function rutaLabel() {
    if (!data.hasReturn || data.tramoAVender === "ida") return `${data.from} → ${data.to}`;
    if (data.tramoAVender === "regreso") return `${data.returnFrom} → ${data.returnTo}`;
    return `${data.from} → ${data.to} → ${data.returnFrom}`;
  }

  const steps = ["Vuelo", "Precio", "Listo"];

  if (!ready) return null;

  if (step === 3) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-[2rem] border border-border bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-secondary-token)] text-white">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold text-[var(--color-ink)]">
            Enviado a revisión
          </h1>
          <p className="mt-3 text-sm font-medium text-muted-foreground leading-relaxed">
            Un revisor confirmará tu boleto antes de que aparezca en el marketplace — normalmente
            toma poco tiempo. Puedes seguir el estado desde "Mis operaciones" → Publicados.
          </p>
          <div className="mt-8 inline-flex items-baseline gap-2 rounded-2xl bg-surface-2 px-6 py-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Precio publicado
            </span>
            <span className="font-mono text-2xl font-bold text-[var(--color-primary-token)]">
              {S(data.price)}
            </span>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/dashboard"
              search={{ vista: "publicados" }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105"
            >
              Ir a mis operaciones <ArrowRight className="h-4 w-4" />
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
      <div
        ref={titleRef}
        className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]"
      >
        Publicar pasaje
      </div>
      <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold text-[var(--color-ink)]">
        Convierte tu vuelo en dinero de vuelta.
      </h1>

      {/* Stepper */}
      <div className="mt-10 flex items-center gap-2">
        {steps.map((s, i) => {
          const alcanzable = i <= maxStepReached && i !== step;
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!alcanzable}
                onClick={() => {
                  stepDirection.current = i > step ? 1 : -1;
                  setStep(i);
                }}
                className={`flex shrink-0 items-center gap-2 transition-opacity ${
                  alcanzable ? "cursor-pointer hover:opacity-70" : "cursor-default"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                    i <= step
                      ? "bg-[var(--color-ink)] text-white"
                      : "border border-border bg-white text-gray-400"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`hidden text-xs font-bold uppercase tracking-wider sm:block ${
                    i === step ? "text-[var(--color-ink)]" : "text-gray-400"
                  }`}
                >
                  {s}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 rounded-full ${i < step ? "bg-[var(--color-ink)]" : "bg-white"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        ref={formCardRef}
        className="mt-10 rounded-[2rem] border border-border bg-white p-6 md:p-10 shadow-sm"
      >
        {step === 0 && (
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
                Información del vuelo
              </h2>

              <label
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-5 transition-colors ${
                  scanning
                    ? "border-[var(--color-accent-token)]/40 bg-[var(--color-accent-token)]/5"
                    : data.voucherUrl
                      ? "border-[var(--color-secondary-token)] bg-[var(--color-secondary-token)]/5"
                      : "border-border bg-surface-2 hover:border-[var(--color-accent-token)]/40"
                }`}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  disabled={scanning}
                  onChange={(e) => {
                    handleVoucherUpload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                    data.voucherUrl && !scanning
                      ? "bg-[var(--color-secondary-token)]/10 text-[var(--color-secondary-token)]"
                      : "bg-[var(--color-accent-token)]/10 text-[var(--color-accent-token)]"
                  }`}
                >
                  {scanning ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : data.voucherUrl ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-ink)]">
                    {!scanning && !data.voucherUrl && (
                      <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent-token)]" />
                    )}
                    {scanning
                      ? "Analizando con IA…"
                      : data.voucherUrl
                        ? data.voucherName || "Comprobante subido"
                        : "Comprobante de reserva"}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {scanning
                      ? "Extrayendo aerolínea, vuelo, ruta y horarios del voucher."
                      : data.voucherUrl
                        ? "Un revisor lo confirma antes de publicar. Toca para reemplazarlo."
                        : "Sube tu voucher o captura de la reserva — completamos estos campos por ti y queda como comprobante para la revisión."}
                  </p>
                </div>
              </label>

              <Field label="Código de reserva (PNR)" required>
                <input
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono font-bold uppercase tracking-widest focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                  placeholder="ABC123"
                  value={data.booking}
                  onChange={(e) => setData({ ...data, booking: e.target.value.toUpperCase() })}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Aerolínea">
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-4 pr-10 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                      value={data.airline}
                      onChange={(e) => setData({ ...data, airline: e.target.value })}
                    >
                      {airlines.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
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
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-4 pr-10 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                      value={data.baggage}
                      onChange={(e) => setData({ ...data, baggage: e.target.value })}
                    >
                      <option>solo cabina</option>
                      <option>23kg incluido</option>
                      <option>cabina + 23kg</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>
              </div>

              <div className="rounded-2xl border border-border bg-gray-50 p-6 space-y-5">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)]">
                  Tramo de ida
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Origen">
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-4 pr-10 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                        value={data.from}
                        onChange={(e) =>
                          setData({
                            ...data,
                            from: e.target.value,
                            returnTo: data.hasReturn ? e.target.value : data.returnTo,
                          })
                        }
                      >
                        {airportsList.map((a) => (
                          <option key={a.code} value={a.code}>
                            {a.city} ({a.code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </Field>
                  <Field label="Destino">
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-4 pr-10 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                        value={data.to}
                        onChange={(e) =>
                          setData({
                            ...data,
                            to: e.target.value,
                            returnFrom: data.hasReturn ? e.target.value : data.returnFrom,
                          })
                        }
                      >
                        {airportsList.map((a) => (
                          <option key={a.code} value={a.code}>
                            {a.city} ({a.code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
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
                    <div className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-[var(--color-ink)]">
                      <PlaneLanding className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {airports[data.returnFrom]?.city ?? data.returnFrom} ({data.returnFrom}) →{" "}
                      {airports[data.returnTo]?.city ?? data.returnTo} ({data.returnTo})
                      <span className="ml-auto text-xs font-medium text-muted-foreground">
                        mismo origen y destino que la ida, invertidos
                      </span>
                    </div>
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
              {vendeIda && (
                <AsientoFields
                  title={data.hasReturn ? "Asiento de ida" : undefined}
                  tipo={data.asientoIdaTipo}
                  categoria={data.asientoIdaCategoria}
                  numero={data.asientoIdaNumero}
                  onTipoChange={(t) => setData({ ...data, asientoIdaTipo: t })}
                  onCategoriaChange={(c) => setData({ ...data, asientoIdaCategoria: c })}
                  onNumeroChange={(v) => setData({ ...data, asientoIdaNumero: v })}
                />
              )}

              {vendeRegreso && (
                <div className={vendeIda ? "border-t border-dashed border-gray-200 pt-6" : ""}>
                  <AsientoFields
                    title="Asiento de vuelta"
                    tipo={data.asientoRegresoTipo}
                    categoria={data.asientoRegresoCategoria}
                    numero={data.asientoRegresoNumero}
                    onTipoChange={(t) => setData({ ...data, asientoRegresoTipo: t })}
                    onCategoriaChange={(c) => setData({ ...data, asientoRegresoCategoria: c })}
                    onNumeroChange={(v) => setData({ ...data, asientoRegresoNumero: v })}
                  />
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
                <Field label="Nombres" required>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    value={data.pasajero.nombres}
                    onChange={(e) =>
                      setData({ ...data, pasajero: { ...data.pasajero, nombres: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Apellido paterno" required>
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
                <Field label="Email" required>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    value={data.pasajero.email}
                    onChange={(e) =>
                      setData({ ...data, pasajero: { ...data.pasajero, email: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Teléfono" required>
                  <PhoneInput
                    prefijo={data.pasajero.telefonoPrefijo}
                    numero={data.pasajero.telefono}
                    onChange={(telefonoPrefijo, telefono) =>
                      setData({
                        ...data,
                        pasajero: { ...data.pasajero, telefonoPrefijo, telefono },
                      })
                    }
                  />
                </Field>
                <Field label="Tipo de documento">
                  <div className="relative">
                    <select
                      value={data.pasajero.tipoDocumento}
                      onChange={(e) => {
                        const nuevoTipo = e.target.value as TipoDocumento;
                        setData({
                          ...data,
                          pasajero: {
                            ...data.pasajero,
                            tipoDocumento: nuevoTipo,
                            numeroDocumento: data.pasajero.numeroDocumento.slice(
                              0,
                              DOCUMENTO_MAX_LEN[nuevoTipo],
                            ),
                          },
                        });
                      }}
                      className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-4 pr-10 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    >
                      <option value="DNI">DNI</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="Carné de Extranjería">Carné de Extranjería</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>
                <Field label="Número de documento" required>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono font-bold focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    inputMode={data.pasajero.tipoDocumento === "Pasaporte" ? "text" : "numeric"}
                    maxLength={DOCUMENTO_MAX_LEN[data.pasajero.tipoDocumento]}
                    value={data.pasajero.numeroDocumento}
                    onChange={(e) =>
                      setData({
                        ...data,
                        pasajero: {
                          ...data.pasajero,
                          numeroDocumento: sanitizeNumeroDocumento(
                            data.pasajero.tipoDocumento,
                            e.target.value,
                          ),
                        },
                      })
                    }
                  />
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {data.pasajero.numeroDocumento.length}/
                    {DOCUMENTO_MAX_LEN[data.pasajero.tipoDocumento]} dígitos
                  </p>
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
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
                    value={data.original === 0 ? "" : data.original}
                    onChange={(e) =>
                      setData({
                        ...data,
                        original: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </Field>
              <Field label="Tu precio de reventa">
                <div
                  className={`flex items-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm ${
                    !precioTouched
                      ? "border-border"
                      : precioError
                        ? "border-[var(--destructive)] ring-1 ring-[var(--destructive)]"
                        : "border-[var(--color-secondary-token)] ring-1 ring-[var(--color-secondary-token)]"
                  }`}
                >
                  <span
                    className={`font-bold ${
                      !precioTouched
                        ? "text-muted-foreground"
                        : precioError
                          ? "text-[var(--destructive)]"
                          : "text-[var(--color-secondary-token)]"
                    }`}
                  >
                    S/
                  </span>
                  <input
                    type="number"
                    min={precioMinimo}
                    max={precioMaximo}
                    className="w-full bg-transparent font-mono font-bold text-[var(--color-ink)] focus:outline-none"
                    value={data.price === 0 ? "" : data.price}
                    onFocus={() => setPrecioTouched(true)}
                    onChange={(e) => {
                      setPrecioTouched(true);
                      setData({
                        ...data,
                        price: e.target.value === "" ? 0 : Number(e.target.value),
                      });
                    }}
                  />
                </div>
                {precioTouched && precioError && (
                  <p className="mt-1.5 text-xs font-bold text-[var(--destructive)]">
                    {precioError}
                  </p>
                )}
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

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-[var(--color-ink)]">
              Confirmar publicación
            </h2>

            <Field label="Nota para compradores (opcional)">
              <textarea
                rows={3}
                maxLength={280}
                placeholder="Ej. Cambio de planes, endoso rápido, respondo en minutos…"
                value={data.notaVendedor}
                onChange={(e) => setData({ ...data, notaVendedor: e.target.value })}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
              />
              <p className="text-right text-[11px] font-medium text-muted-foreground">
                {data.notaVendedor.length}/280
              </p>
            </Field>

            <dl className="divide-y divide-gray-100 rounded-2xl border border-border bg-gray-50 text-sm overflow-hidden">
              <Info2 k="Vuelo" v={`${data.airline} ${data.flightNumber || "—"}`} />
              <Info2 k="Ruta" v={rutaLabel()} />
              {data.hasReturn && <Info2 k="Vendiendo" v={tramoAVenderLabel(data.tramoAVender)} />}
              <Info2 k="Fecha" v={`${data.date || "—"} ${data.time}`} />
              {vendeIda && (
                <Info2
                  k={data.hasReturn ? "Asiento (ida)" : "Asiento"}
                  v={asientoLabel(asientoIda)}
                />
              )}
              {vendeRegreso && asientoRegreso && (
                <Info2 k="Asiento (vuelta)" v={asientoLabel(asientoRegreso)} />
              )}
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
          onClick={() => {
            stepDirection.current = -1;
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={step === 0}
          className="rounded-full bg-white border border-border px-8 py-3.5 text-sm font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
        >
          Atrás
        </button>
        <button
          onClick={() => {
            if (step === 2) {
              handlePublicar();
              return;
            }
            stepDirection.current = 1;
            setStep((s) => s + 1);
          }}
          disabled={
            (step === 0 && !step0Valido) ||
            (step === 1 && !!precioError) ||
            (step === 2 && publicando)
          }
          className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-full bg-[var(--color-primary-token)] px-10 py-3.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {step === 2 ? (
            publicando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publicando…
              </>
            ) : (
              <>
                Publicar pasaje <ArrowRight className="h-4 w-4" />
              </>
            )
          ) : (
            <>
              Continuar <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
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
