import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

type SavedContextValue = {
  savedIds: string[];
  isSaved: (flightId: string) => boolean;
  toggleSaved: (flightId: string) => void;
  removeSaved: (flightId: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>(["f-002", "f-006"]);
  const navigate = useNavigate();

  function isSaved(flightId: string) {
    return savedIds.includes(flightId);
  }

  function toggleSaved(flightId: string) {
    const yaGuardado = savedIds.includes(flightId);
    setSavedIds((prev) =>
      yaGuardado ? prev.filter((id) => id !== flightId) : [...prev, flightId],
    );

    if (yaGuardado) {
      toast("Quitado de guardados");
    } else {
      toast.custom((id) => (
        <div className="flex w-full gap-3 rounded-lg bg-white p-4 shadow-lg border border-border">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-secondary-token)]" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--color-ink)]">
              Guardado en tus favoritos
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Lo encuentras en tu perfil, en Viajes guardados.
            </p>
            <button
              type="button"
              onClick={() => {
                navigate({ to: "/profile", search: { tab: "guardados" } });
                toast.dismiss(id);
              }}
              className="mt-1.5 text-sm font-bold text-[var(--color-primary-token)] hover:underline"
            >
              Ver guardados
            </button>
          </div>
        </div>
      ));
    }
  }

  function removeSaved(flightId: string) {
    setSavedIds((prev) => prev.filter((id) => id !== flightId));
  }

  return (
    <SavedContext.Provider value={{ savedIds, isSaved, toggleSaved, removeSaved }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved debe usarse dentro de SavedProvider");
  return ctx;
}
