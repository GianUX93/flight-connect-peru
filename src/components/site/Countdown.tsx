import { useEffect, useState } from "react";
import { hoursUntil } from "@/lib/flight-utils";

interface Props {
  iso: string;
  tone?: "neutral" | "warn";
  className?: string;
}

/**
 * Countdown regresivo. Solo se renderiza si hay tiempo restante real.
 * Nunca renderiza para vuelos expired (hoursUntil <= 0) — devuelve null.
 */
export function Countdown({ iso, tone = "neutral", className }: Props) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const h = hoursUntil(iso);
  if (h <= 0) return null;

  const totalSec = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
  const d = Math.floor(totalSec / 86400);
  const hh = Math.floor((totalSec % 86400) / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;

  const parts =
    d > 0
      ? [
          { v: d, l: "d" },
          { v: hh, l: "h" },
          { v: mm, l: "m" },
        ]
      : [
          { v: hh, l: "h" },
          { v: mm, l: "m" },
          { v: ss, l: "s" },
        ];

  const warn = tone === "warn";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] tabular-nums ${
        warn
          ? "bg-[color-mix(in_oklab,var(--warn)_22%,transparent)] text-warn"
          : "bg-surface-2 text-muted-foreground"
      } ${className ?? ""}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          warn ? "bg-warn animate-pulse" : "bg-signal"
        }`}
      />
      {parts.map((p, i) => (
        <span key={i}>
          {String(p.v).padStart(2, "0")}
          <span className="text-muted-foreground/70">{p.l}</span>
        </span>
      ))}
    </div>
  );
}
