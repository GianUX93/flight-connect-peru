import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { PENDING_PURCHASE_KEY, clearSimulatedSession, useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { joinPhone } from "@/lib/phone-prefixes";
import { PhoneInput } from "@/components/site/PhoneInput";

function goToPendingPurchaseOr(navigate: ReturnType<typeof useNavigate>) {
  const pendingFlightId = localStorage.getItem(PENDING_PURCHASE_KEY);
  if (pendingFlightId) {
    navigate({ to: "/flight/$id", params: { id: pendingFlightId } });
    return;
  }
  navigate({ to: "/" });
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12.01 12.01 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { user, simulateLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [telefonoPrefijo, setTelefonoPrefijo] = useState("+51");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google redirige la página completa y vuelve aquí ya con sesión activa — a
  // diferencia de email/password, no hay un "then" que avisar tras el login.
  useEffect(() => {
    if (user) goToPendingPurchaseOr(navigate);
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  // El registro real contra Supabase depende de su servicio de email, actualmente
  // bloqueado (ver CHANGELOG) — por eso el registro siempre se simula localmente.
  // El login, en cambio, primero intenta autenticación real (útil para cuentas
  // creadas a mano en el dashboard, sin pasar por el envío de correo) y solo si
  // falla cae al modo simulado, para no bloquear el resto de las pruebas.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        clearSimulatedSession();
        toast.success("¡Bienvenido de vuelta!");
        const pendingFlightId = localStorage.getItem(PENDING_PURCHASE_KEY);
        localStorage.removeItem(PENDING_PURCHASE_KEY);
        // Reload completo para que AuthProvider arranque de cero y detecte la
        // sesión real recién creada (no solo el estado en memoria).
        window.location.href = pendingFlightId ? `/flight/${pendingFlightId}` : "/";
        return;
      }
    }

    simulateLogin({
      email,
      first_name: isLogin ? undefined : firstName,
      last_name: isLogin ? undefined : apellidoPaterno,
      apellido_materno: isLogin ? undefined : apellidoMaterno,
      phone: isLogin ? undefined : joinPhone(telefonoPrefijo, phone) || null,
    });
    toast.success(isLogin ? "¡Bienvenido de vuelta!" : "Cuenta creada exitosamente");
    goToPendingPurchaseOr(navigate);
    setLoading(false);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-[2rem] border border-border bg-white p-8 md:p-10 shadow-sm">
        <div>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-[var(--color-ink)] text-center">
            {isLogin ? "Inicia sesión" : "Crea tu cuenta"}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {isLogin ? "Bienvenido de vuelta a Traspaso" : "Únete para comprar y vender pasajes"}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-white px-4 py-3 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <GoogleIcon className="h-4 w-4" /> Continuar con Google
              </>
            )}
          </button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              o
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Nombres
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Apellido paterno
                    </label>
                    <input
                      type="text"
                      required
                      value={apellidoPaterno}
                      onChange={(e) => setApellidoPaterno(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Apellido materno
                    </label>
                    <input
                      type="text"
                      required
                      value={apellidoMaterno}
                      onChange={(e) => setApellidoMaterno(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
                    />
                  </div>
                </div>
              </div>
            )}
            {!isLogin && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Teléfono <span className="normal-case text-muted-foreground/70">(opcional)</span>
                </label>
                <div className="mt-1">
                  <PhoneInput
                    prefijo={telefonoPrefijo}
                    numero={phone}
                    onChange={(prefijo, numero) => {
                      setTelefonoPrefijo(prefijo);
                      setPhone(numero);
                    }}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-[var(--color-primary-token)] focus:ring-[var(--color-primary-token)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary-token)] px-4 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLogin ? (
              "Iniciar sesión"
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-[var(--color-primary-token)] hover:underline"
          >
            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
