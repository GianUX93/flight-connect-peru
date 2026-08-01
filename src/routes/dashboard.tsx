import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Lock,
  ShoppingBag,
  Store,
  ChevronRight,
  ShieldAlert,
  Upload,
  MessageCircle,
  Send,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  flights,
  transactions as initialTransactions,
  type Transaction,
  type DatosCompradorEndoso,
  type TipoDocumento,
} from "@/lib/mock-data";
import {
  S,
  fmtDate,
  fmtTime,
  computeStatus,
  tramoVigente,
  comisionPlataforma,
  comisionEfectiva,
  cargoAerolineaConfirmadoVigente,
  montoNetoFinal,
  requiereRevisionManual,
  PLATFORM_COMMISSION_RATE,
} from "@/lib/flight-utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Mis traspasos — Traspaso" },
      {
        name: "description",
        content: "Tus transacciones activas e historial como comprador y vendedor.",
      },
    ],
  }),
  component: Dashboard,
});

const stateLabels: Record<Transaction["state"], string> = {
  pago_retenido: "Pago retenido",
  vendedor_inicia: "Vendedor inicia trámite",
  confirmado: "Traspaso confirmado",
  liberado: "Pago liberado",
  reembolsado: "Reembolsado",
};

const stateOrder: Transaction["state"][] = [
  "pago_retenido",
  "vendedor_inicia",
  "confirmado",
  "liberado",
];

function Dashboard() {
  const [tab, setTab] = useState<"all" | "buyer" | "seller">("all");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [montoInputs, setMontoInputs] = useState<Record<string, number>>({});
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
  const list = transactions.filter((t) => tab === "all" || t.role === tab);

  function updateCargoConfirmado(
    id: string,
    update: Partial<Transaction["cargoAerolineaConfirmado"]>,
  ) {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, cargoAerolineaConfirmado: { ...t.cargoAerolineaConfirmado, ...update } }
          : t,
      ),
    );
  }

  function updateDatosCompradorEndoso(id: string, update: Partial<DatosCompradorEndoso>) {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, datosCompradorEndoso: { ...t.datosCompradorEndoso, ...update } } : t,
      ),
    );
  }

  // Chat interno ligado a esta transacción específica — nunca WhatsApp ni el teléfono
  // real de nadie. Queda con historial revisable si alguna de las partes reporta un problema.
  function sendChatMensaje(t: Transaction) {
    const texto = (chatDrafts[t.id] ?? "").trim();
    if (!texto) return;
    setTransactions((prev) =>
      prev.map((x) =>
        x.id === t.id
          ? {
              ...x,
              chatMensajes: [
                ...x.chatMensajes,
                {
                  autor: t.role === "buyer" ? "comprador" : "vendedor",
                  texto,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : x,
      ),
    );
    setChatDrafts({ ...chatDrafts, [t.id]: "" });
  }

  const retained = transactions
    .filter((t) => t.state !== "liberado" && t.state !== "reembolsado")
    .reduce((s, t) => s + t.amount, 0);
  const released = transactions
    .filter((t) => t.state === "liberado")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-token)]">
            Hola, Andrea
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-extrabold text-[var(--color-ink)]">
            Mis traspasos
          </h1>
        </div>
        <Link
          to="/publish"
          className="rounded-full bg-[var(--color-primary-token)] px-6 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:scale-105"
        >
          Publicar un pasaje
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card
          icon={<Lock className="h-5 w-5" />}
          label="Retenido en escrow"
          value={S(retained)}
          tone="signal"
        />
        <Card icon={<CheckCircle2 className="h-5 w-5" />} label="Liberado" value={S(released)} />
        <Card
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Transacciones"
          value={String(transactions.length)}
        />
      </div>

      <div className="mt-10 inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
        {(["all", "buyer", "seller"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              tab === k
                ? "bg-[var(--color-ink)] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {k === "buyer" && <ShoppingBag className="h-4 w-4" />}
            {k === "seller" && <Store className="h-4 w-4" />}
            {k === "all" ? "Todas" : k === "buyer" ? "Como comprador" : "Como vendedor"}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {list.map((t) => {
          const flight = flights.find((f) => f.id === t.flightId)!;
          const status = computeStatus(flight);
          const stateIdx = stateOrder.indexOf(t.state);
          const tramo = tramoVigente(flight);
          const puedeReportarCargo =
            t.role === "seller" && (t.state === "vendedor_inicia" || t.state === "confirmado");
          const montoSugerido = flight.cargoAerolineaEstimado.monto ?? 0;
          const montoInput = montoInputs[t.id] ?? montoSugerido;
          // Trámite en curso: el pago ya está retenido y la transacción sigue abierta.
          const puedeGestionar = t.state !== "liberado" && t.state !== "reembolsado";
          return (
            <div
              key={t.id}
              className="rounded-[2rem] border border-border bg-white p-6 md:p-8 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span
                      className={`rounded-full px-2.5 py-0.5 ${
                        t.role === "buyer"
                          ? "bg-[var(--color-primary-token)]/10 text-[var(--color-primary-token)]"
                          : "bg-gray-100 text-[var(--color-ink)]"
                      }`}
                    >
                      {t.role === "buyer" ? "Compra" : "Venta"}
                    </span>
                    {flight.airline} · <span className="font-mono">{flight.flightNumber}</span>
                    {status === "last_call" && (
                      <span className="text-[var(--color-warning-token)]">· última llamada</span>
                    )}
                  </div>
                  <div className="mt-3 font-display text-2xl font-bold text-[var(--color-ink)]">
                    {tramo.origin.city}{" "}
                    <ChevronRight className="inline h-5 w-5 text-gray-400 mx-1" />{" "}
                    {tramo.destination.city}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mt-1">
                    {fmtDate(tramo.departureAt)}
                    {flight.tipoBoleto === "ida_y_vuelta" &&
                      ` · ${flight.tramoAVender === "ambos" ? "ida y vuelta" : flight.tramoAVender === "regreso" ? "solo regreso" : "solo ida"}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-bold text-[var(--color-ink)]">
                    {S(t.amount)}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-token)] mt-1">
                    {stateLabels[t.state]}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-8 grid grid-cols-4 gap-2">
                {stateOrder.map((s, i) => {
                  const done = i <= stateIdx;
                  return (
                    <div key={s} className="flex flex-col items-start gap-2">
                      <div className="flex w-full items-center gap-2">
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-secondary-token)]" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-gray-200" />
                        )}
                        <div
                          className={`h-1 flex-1 rounded-full ${
                            i < stateIdx ? "bg-[var(--color-secondary-token)]" : "bg-gray-100"
                          }`}
                        />
                      </div>
                      <div
                        className={`text-[11px] font-bold uppercase tracking-wide pr-2 ${
                          done ? "text-[var(--color-ink)]" : "text-gray-400"
                        }`}
                      >
                        {stateLabels[s]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {puedeReportarCargo && (
                <div className="mt-8 border-t border-dashed border-gray-200 pt-8">
                  <div className="text-sm font-bold text-[var(--color-ink)]">
                    ¿La aerolínea te cobró algo por el trámite?
                  </div>
                  <p className="mt-1 text-xs font-medium text-muted-foreground leading-relaxed">
                    Este es el monto real y verificado del endoso — determina el neto final que se
                    libera del escrow, no el estimado que pusiste al publicar.
                  </p>

                  {t.cargoAerolineaConfirmado.estadoVerificacion === "no_aplica" && (
                    <div className="mt-4 space-y-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                      <label className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-ink)]">
                          Monto que te cobró la aerolínea
                        </span>
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm">
                          <span className="text-muted-foreground font-bold">S/</span>
                          <input
                            type="number"
                            className="w-full bg-transparent font-mono font-bold text-[var(--color-ink)] focus:outline-none"
                            value={montoInput}
                            onChange={(e) =>
                              setMontoInputs({ ...montoInputs, [t.id]: Number(e.target.value) })
                            }
                          />
                        </div>
                        {montoSugerido > 0 && (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Sugerido a partir de tu estimado al publicar: {S(montoSugerido)}
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const manual = requiereRevisionManual(montoInput, t.amount);
                          updateCargoConfirmado(t.id, {
                            monto: montoInput,
                            origen: "reportado_por_vendedor",
                            evidenciaUrl: `mock://evidencia-${t.id}-${Date.now()}.jpg`,
                            estadoVerificacion: "pendiente_revision",
                            revisionManualRequerida: manual,
                          });
                          toast.success(
                            manual
                              ? "Cargo reportado. Por su monto, requiere revisión manual."
                              : "Cargo reportado. Queda en revisión.",
                          );
                        }}
                        disabled={montoInput <= 0}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white p-3 text-xs font-bold text-gray-500 transition-colors hover:border-[var(--color-primary-token)] hover:text-[var(--color-primary-token)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Upload className="h-4 w-4" /> Subir evidencia y reportar cargo
                      </button>
                    </div>
                  )}

                  {t.cargoAerolineaConfirmado.estadoVerificacion === "pendiente_revision" && (
                    <div
                      className={`mt-4 rounded-xl border p-4 text-xs font-medium text-[var(--color-ink)] ${
                        t.cargoAerolineaConfirmado.revisionManualRequerida
                          ? "border-red-300 bg-red-50"
                          : "border-[var(--color-warning-token)]/50 bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <ShieldAlert className="h-4 w-4" />
                        {t.cargoAerolineaConfirmado.revisionManualRequerida
                          ? "Requiere revisión manual"
                          : "Cargo reportado en revisión."}
                      </div>
                      {t.cargoAerolineaConfirmado.revisionManualRequerida && (
                        <div className="mt-1 font-bold text-red-600">
                          Este monto supera el 50% del precio de venta (S/ {t.amount}) — no se
                          acepta automáticamente aunque tenga evidencia. Un revisor debe confirmarlo
                          explícitamente.
                        </div>
                      )}
                      <div className="mt-1 text-[var(--color-ink)]/70">
                        Reportaste {S(t.cargoAerolineaConfirmado.monto)}. El neto final solo se
                        recalcula si queda aceptado.
                      </div>
                      <div
                        className={`mt-3 flex items-center gap-2 border-t border-dashed pt-3 ${
                          t.cargoAerolineaConfirmado.revisionManualRequerida
                            ? "border-red-300/60"
                            : "border-[var(--color-warning-token)]/40"
                        }`}
                      >
                        <span className="self-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)]/50">
                          Demo — panel de revisión:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updateCargoConfirmado(t.id, { estadoVerificacion: "aceptado" });
                            toast.success("Cargo aceptado. Se incluyó en el neto final.");
                          }}
                          className="rounded-full bg-[var(--color-secondary-token)] px-3 py-1 text-[11px] font-bold text-white"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateCargoConfirmado(t.id, {
                              monto: 0,
                              estadoVerificacion: "rechazado",
                              revisionManualRequerida: false,
                            });
                            toast.error(
                              "No pudimos verificar este cargo con la evidencia proporcionada.",
                            );
                          }}
                          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-bold text-gray-600"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  )}

                  {t.cargoAerolineaConfirmado.estadoVerificacion === "aceptado" && (
                    <div className="mt-4 rounded-xl border border-[var(--color-secondary-token)]/40 bg-[var(--color-secondary-token)]/5 p-4 text-xs font-bold text-[var(--color-secondary-token)]">
                      Cargo de {S(t.cargoAerolineaConfirmado.monto)} verificado y aplicado al neto
                      final.
                    </div>
                  )}

                  {t.cargoAerolineaConfirmado.estadoVerificacion === "rechazado" && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-600">
                      No pudimos verificar este cargo con la evidencia proporcionada. Se usó S/ 0.{" "}
                      <button
                        type="button"
                        onClick={() =>
                          updateCargoConfirmado(t.id, {
                            estadoVerificacion: "no_aplica",
                            evidenciaUrl: null,
                            revisionManualRequerida: false,
                          })
                        }
                        className="underline"
                      >
                        Reportar de nuevo
                      </button>
                    </div>
                  )}

                  {(() => {
                    const cargoVigente = cargoAerolineaConfirmadoVigente(t);
                    const comisionNormal = comisionPlataforma(t.amount);
                    const comisionAplicada = comisionEfectiva(t.amount, cargoVigente);
                    const comisionReducida = comisionAplicada < comisionNormal;
                    return (
                      <div className="tarjeta-boleto mt-4 p-5 space-y-2">
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Neto final a liberar
                        </div>
                        <ReceiptRow label="Precio de venta acordado" value={S(t.amount)} />
                        <ReceiptRow
                          label="Cargo de aerolínea confirmado"
                          value={`− ${S(cargoVigente)}`}
                        />
                        <ReceiptRow
                          label={`Comisión Traspaso (${Math.round(PLATFORM_COMMISSION_RATE * 100)}%)`}
                          value={`− ${S(comisionAplicada)}`}
                          note={
                            comisionReducida
                              ? `Reducida desde ${S(comisionNormal)} para que tu neto nunca quede negativo`
                              : undefined
                          }
                        />
                        <div className="flex items-baseline justify-between border-t border-dashed border-gray-200 pt-2">
                          <span className="text-sm font-bold text-[var(--color-ink)]">
                            Neto final a liberar
                          </span>
                          <span className="font-mono text-xl font-bold text-[var(--color-primary-token)]">
                            {S(montoNetoFinal(t))}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {puedeGestionar &&
                t.role === "buyer" &&
                !t.datosCompradorEndoso.completadoPorComprador && (
                  <div className="mt-8 border-t border-dashed border-gray-200 pt-8">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                      <IdCard className="h-4 w-4 text-[var(--color-primary-token)]" />
                      El vendedor necesita tus datos para transferirte el pasaje
                    </div>
                    <p className="mt-1 text-xs font-medium text-muted-foreground leading-relaxed">
                      La aerolínea exige identificar al nuevo titular para hacer el endoso. Estos
                      datos solo los ve el vendedor de esta transacción — nunca se piden por chat.
                    </p>
                    <div className="tarjeta-boleto mt-4 p-5 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <EndosoField label="Nombres">
                          <input
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                            value={t.datosCompradorEndoso.nombres}
                            onChange={(e) =>
                              updateDatosCompradorEndoso(t.id, { nombres: e.target.value })
                            }
                          />
                        </EndosoField>
                        <EndosoField label="Apellido paterno">
                          <input
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                            value={t.datosCompradorEndoso.apellidoPaterno}
                            onChange={(e) =>
                              updateDatosCompradorEndoso(t.id, { apellidoPaterno: e.target.value })
                            }
                          />
                        </EndosoField>
                        <EndosoField label="Apellido materno">
                          <input
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                            value={t.datosCompradorEndoso.apellidoMaterno}
                            onChange={(e) =>
                              updateDatosCompradorEndoso(t.id, { apellidoMaterno: e.target.value })
                            }
                          />
                        </EndosoField>
                        <EndosoField label="Tipo de documento">
                          <select
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                            value={t.datosCompradorEndoso.tipoDocumento}
                            onChange={(e) =>
                              updateDatosCompradorEndoso(t.id, {
                                tipoDocumento: e.target.value as TipoDocumento,
                              })
                            }
                          >
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="Carné de Extranjería">Carné de Extranjería</option>
                          </select>
                        </EndosoField>
                        <EndosoField label="Número de documento">
                          <input
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono font-bold focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                            value={t.datosCompradorEndoso.numeroDocumento}
                            onChange={(e) =>
                              updateDatosCompradorEndoso(t.id, { numeroDocumento: e.target.value })
                            }
                          />
                        </EndosoField>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateDatosCompradorEndoso(t.id, { completadoPorComprador: true });
                          toast.success("Tus datos fueron enviados al vendedor.");
                        }}
                        disabled={
                          !t.datosCompradorEndoso.nombres ||
                          !t.datosCompradorEndoso.apellidoPaterno ||
                          !t.datosCompradorEndoso.numeroDocumento
                        }
                        className="rounded-full bg-[var(--color-primary-token)] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Enviar mis datos al vendedor
                      </button>
                    </div>
                  </div>
                )}

              {puedeGestionar &&
                t.role === "buyer" &&
                t.datosCompradorEndoso.completadoPorComprador && (
                  <div className="mt-8 flex items-center gap-2 rounded-xl border border-[var(--color-secondary-token)]/40 bg-[var(--color-secondary-token)]/5 p-4 text-xs font-bold text-[var(--color-secondary-token)]">
                    <IdCard className="h-4 w-4" /> Ya enviaste tus datos de endoso al vendedor.
                  </div>
                )}

              {puedeGestionar && t.role === "seller" && (
                <div className="mt-8 border-t border-dashed border-gray-200 pt-8">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                    <IdCard className="h-4 w-4 text-[var(--color-primary-token)]" />
                    Datos del comprador para el endoso
                  </div>
                  {t.datosCompradorEndoso.completadoPorComprador ? (
                    <dl className="mt-4 grid gap-3 rounded-xl border border-border bg-gray-50 p-4 text-xs sm:grid-cols-2">
                      <EndosoReadItem
                        label="Nombre completo"
                        value={`${t.datosCompradorEndoso.nombres} ${t.datosCompradorEndoso.apellidoPaterno} ${t.datosCompradorEndoso.apellidoMaterno}`.trim()}
                      />
                      <EndosoReadItem
                        label="Documento"
                        value={`${t.datosCompradorEndoso.tipoDocumento} ${t.datosCompradorEndoso.numeroDocumento}`}
                      />
                    </dl>
                  ) : (
                    <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs font-medium text-muted-foreground">
                      Esperando a que el comprador complete sus datos para el endoso.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/flight/$id"
                  params={{ id: flight.id }}
                  className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-[var(--color-ink)] hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Ver detalle
                </Link>
                <button
                  type="button"
                  onClick={() => setOpenChatId(openChatId === t.id ? null : t.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-[var(--color-ink)] hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Contactar{" "}
                  {t.role === "buyer" ? "vendedor" : "comprador"}
                  {t.chatMensajes.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-[var(--color-primary-token)]/10 px-1.5 text-[10px] text-[var(--color-primary-token)]">
                      {t.chatMensajes.length}
                    </span>
                  )}
                </button>
                {t.state !== "liberado" && (
                  <button className="rounded-full bg-transparent px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-gray-900 transition-colors ml-auto">
                    Reportar problema
                  </button>
                )}
              </div>

              {openChatId === t.id && (
                <div className="mt-4 rounded-2xl border border-border bg-gray-50 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Chat interno de la transacción — nunca WhatsApp ni tu teléfono real
                  </div>
                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                    {t.chatMensajes.length === 0 && (
                      <div className="text-xs font-medium text-muted-foreground">
                        Todavía no hay mensajes. Escribe el primero.
                      </div>
                    )}
                    {t.chatMensajes.map((m, i) => {
                      const esMio = m.autor === (t.role === "buyer" ? "comprador" : "vendedor");
                      return (
                        <div key={i} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs font-medium ${
                              esMio
                                ? "bg-[var(--color-primary-token)] text-white"
                                : "border border-border bg-white text-[var(--color-ink)]"
                            }`}
                          >
                            {m.texto}
                            <div
                              className={`mt-1 text-[10px] font-bold ${esMio ? "text-white/70" : "text-muted-foreground"}`}
                            >
                              {fmtTime(m.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      className="w-full rounded-full border border-border bg-white px-4 py-2 text-sm focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                      placeholder="Escribe un mensaje..."
                      value={chatDrafts[t.id] ?? ""}
                      onChange={(e) => setChatDrafts({ ...chatDrafts, [t.id]: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && sendChatMensaje(t)}
                    />
                    <button
                      type="button"
                      onClick={() => sendChatMensaje(t)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary-token)] text-white shadow-sm transition-transform hover:scale-105"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "signal";
}) {
  return (
    <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <span
          className={`grid h-10 w-10 place-items-center rounded-full ${
            tone === "signal"
              ? "bg-[var(--color-primary-token)]/10 text-[var(--color-primary-token)]"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {icon}
        </span>
        {label}
      </div>
      <div
        className={`mt-4 font-mono text-4xl font-extrabold ${tone === "signal" ? "text-[var(--color-primary-token)]" : "text-[var(--color-ink)]"}`}
      >
        {value}
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div>
        <div className="font-medium text-gray-600">{label}</div>
        {note && <div className="mt-0.5 text-xs font-medium text-muted-foreground">{note}</div>}
      </div>
      <span className="shrink-0 font-mono font-bold text-[var(--color-ink)]">{value}</span>
    </div>
  );
}

function EndosoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function EndosoReadItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-semibold text-[var(--color-ink)]">{value}</div>
    </div>
  );
}
