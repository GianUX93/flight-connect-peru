// Prefijos telefónicos: Perú primero (público principal), seguido de los países
// más comunes desde donde alguien podría revender un pasaje nacional peruano.
// Solo bandera + código (sin nombre de país) para un selector compacto — el país
// se distingue por la bandera, más intuitivo que un texto largo en un <select>.
// `maxLen`: dígitos del número nacional (sin el prefijo) — limita el input para
// evitar números claramente mal escritos, sin pretender validar el formato exacto.
export const PREFIJOS_TELEFONO = [
  { code: "+51", country: "Perú", flag: "🇵🇪", maxLen: 9 },
  { code: "+56", country: "Chile", flag: "🇨🇱", maxLen: 9 },
  { code: "+57", country: "Colombia", flag: "🇨🇴", maxLen: 10 },
  { code: "+54", country: "Argentina", flag: "🇦🇷", maxLen: 10 },
  { code: "+593", country: "Ecuador", flag: "🇪🇨", maxLen: 9 },
  { code: "+591", country: "Bolivia", flag: "🇧🇴", maxLen: 8 },
  { code: "+52", country: "México", flag: "🇲🇽", maxLen: 10 },
  { code: "+34", country: "España", flag: "🇪🇸", maxLen: 9 },
  { code: "+1", country: "EE. UU. / Canadá", flag: "🇺🇸", maxLen: 10 },
  { code: "+55", country: "Brasil", flag: "🇧🇷", maxLen: 11 },
];

const DEFAULT_PREFIJO = "+51";

// El teléfono se guarda como un solo string ("+51 999999999") tanto en el
// perfil simulado como en `profiles.phone` de Supabase — no hay columnas
// separadas para prefijo y número. Estas dos funciones son el único punto
// de conversión entre ese string y los dos campos que usa el selector.
export function splitPhone(phone: string | null | undefined): {
  prefijo: string;
  numero: string;
} {
  if (!phone) return { prefijo: DEFAULT_PREFIJO, numero: "" };
  const match = PREFIJOS_TELEFONO.find((p) => phone.startsWith(p.code));
  if (!match) return { prefijo: DEFAULT_PREFIJO, numero: phone.replace(/\D/g, "") };
  return { prefijo: match.code, numero: phone.slice(match.code.length).trim() };
}

export function joinPhone(prefijo: string, numero: string): string {
  return numero ? `${prefijo} ${numero}` : "";
}
