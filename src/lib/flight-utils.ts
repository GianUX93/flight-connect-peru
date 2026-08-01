import type { Flight, FlightStatus } from "./mock-data";

const HOUR = 3600_000;
export const LAST_CALL_WINDOW_H = 24;
export const MIN_VIABLE_H = 3; // hard floor: below this, endoso operativo no es viable

export function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / HOUR;
}

export function computeStatus(f: Flight): FlightStatus {
  const h = hoursUntil(f.departureAt);
  if (h <= 0) return "expired";
  if (h < MIN_VIABLE_H) return "expired"; // no viable, aunque el vendedor quiera
  if (h < LAST_CALL_WINDOW_H) return f.sellerAllowsLastCall ? "last_call" : "expired";
  return "active";
}

export function isVisibleAnywhere(f: Flight): boolean {
  const s = computeStatus(f);
  return s === "active" || s === "last_call";
}

export function activeFlights(list: Flight[]): Flight[] {
  return list.filter((f) => computeStatus(f) === "active");
}

export function lastCallFlights(list: Flight[]): Flight[] {
  return list.filter((f) => computeStatus(f) === "last_call");
}

export function discountPct(f: Flight): number {
  return Math.round((1 - f.resalePrice / f.originalPrice) * 100);
}

const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 0,
});
export const S = (n: number) => soles.format(n).replace("PEN", "S/");

const dtf = new Intl.DateTimeFormat("es-PE", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
export const fmtDate = (iso: string) => dtf.format(new Date(iso));

export const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short" }).format(new Date(iso));
export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );

export function airlineLogo(a: Flight["airline"]): string {
  switch (a) {
    case "LATAM":
      return "https://upload.wikimedia.org/wikipedia/commons/f/fe/Latam-logo_-v_%28Indigo%29.svg";
    case "Sky Airline":
      return "https://upload.wikimedia.org/wikipedia/commons/6/65/Sky_Airline_Logo.svg";
    case "JetSmart":
      return "https://upload.wikimedia.org/wikipedia/commons/f/fb/Logo_JetSmart.svg";
  }
}
