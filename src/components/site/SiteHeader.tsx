import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-xl leading-none">Traspaso</span>
          <span className="hidden rounded-full border border-hairline px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground sm:inline-block">
            beta · pe
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavItem to="/explore">Explorar vuelos</NavItem>
          <NavItem to="/publish">Publicar pasaje</NavItem>
          <NavItem to="/trust">Cómo funciona</NavItem>
          <NavItem to="/dashboard">Mis traspasos</NavItem>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-xs font-medium"
          >
            AS
          </Link>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 md:hidden"
          aria-label="Menú"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-hairline md:hidden">
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
      className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      activeProps={{ className: "text-foreground bg-surface-2" }}
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
      className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground"
      activeProps={{ className: "text-foreground bg-surface-2" }}
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
