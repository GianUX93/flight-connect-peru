import { useEffect, useState } from "react";
import { hoursUntil } from "@/lib/flight-utils";

interface Props {
  iso: string;
  tone?: "neutral" | "warn";
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Countdown regresivo. Solo se renderiza si hay tiempo restante real.
 * Nunca renderiza para vuelos expired (hoursUntil <= 0) — devuelve null.
 */
export function Countdown({ iso, tone = "neutral", size = "sm", className }: Props) {
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
  const lg = size === "lg";

  return (
    <div
      className={`inline-flex items-center rounded-full font-mono tabular-nums ${
        lg
          ? "gap-2 px-4 py-2 text-base font-extrabold"
          : "gap-1.5 px-2.5 py-1 text-[11px] font-bold"
      } ${
        warn
          ? lg
            ? "bg-[var(--color-ink)] text-white shadow-md"
            : "bg-warn text-warn-foreground shadow-sm"
          : "bg-surface-2 text-muted-foreground"
      } ${className ?? ""}`}
    >
      <span
        className={`rounded-full ${lg ? "h-2.5 w-2.5" : "h-1.5 w-1.5"} ${
          warn
            ? lg
              ? "bg-[var(--color-warning-token)] animate-pulse"
              : "bg-warn-foreground animate-pulse"
            : "bg-signal"
        }`}
      />
      {parts.map((p, i) => (
        <span key={i}>
          {String(p.v).padStart(2, "0")}
          <span
            className={
              warn ? (lg ? "text-white/50" : "text-warn-foreground/60") : "text-muted-foreground/70"
            }
          >
            {p.l}
          </span>
          {i < parts.length - 1 && (
            <span className={lg ? "mx-0.5 text-white/30" : "hidden"}>:</span>
          )}
        </span>
      ))}
    </div>
  );
}
