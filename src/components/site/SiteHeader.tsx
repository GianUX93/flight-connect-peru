import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { currentUser } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-ink)]/12 bg-background/95 shadow-[0_1px_0_0_rgba(26,30,43,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo />
          <span className="font-display text-xl leading-none">Traspaso</span>
          <span className="hidden rounded-full border border-[var(--color-ink)]/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground sm:inline-block">
            beta · pe
          </span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-[var(--color-ink)]/8 bg-surface-2 p-1 md:flex">
          <NavItem to="/explore">Explorar vuelos</NavItem>
          <NavItem to="/publish">Publicar pasaje</NavItem>
          <NavItem to="/trust">Cómo funciona</NavItem>
          <NavItem to="/dashboard">Mis traspasos</NavItem>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/profile"
            className="rounded-full ring-1 ring-[var(--color-ink)]/12 ring-offset-2 ring-offset-background transition-shadow hover:ring-[var(--color-primary-token)]/50"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback className="bg-surface-2 text-xs font-medium">
                {currentUser.avatar}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-ink)]/10 bg-surface-2 md:hidden"
          aria-label="Menú"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[var(--color-ink)]/12 bg-surface-2 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <MobileItem to="/explore" onClick={() => setOpen(false)}>
              Explorar vuelos
            </MobileItem>
            <MobileItem to="/publish" onClick={() => setOpen(false)}>
              Publicar pasaje
            </MobileItem>
            <MobileItem to="/trust" onClick={() => setOpen(false)}>
              Cómo funciona
            </MobileItem>
            <MobileItem to="/dashboard" onClick={() => setOpen(false)}>
              Mis traspasos
            </MobileItem>
            <MobileItem to="/profile" onClick={() => setOpen(false)}>
              Perfil
            </MobileItem>
          </div>
        </div>
      )}
    </header>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
      activeProps={{ className: "bg-[var(--color-ink)] text-white shadow-sm hover:bg-[var(--color-ink)] hover:text-white" }}
    >
      {children}
    </Link>
  );
}

function MobileItem({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      activeProps={{ className: "bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink)] hover:text-white" }}
    >
      {children}
    </Link>
  );
}

function Logo() {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-lg"
      style={{
        background:
          "linear-gradient(135deg, var(--color-signal), oklch(0.72 0.12 45))",
      }}
    >
      <span className="font-display text-[15px] leading-none text-[var(--color-signal-foreground)]">
        t
      </span>
    </span>
  );
}
