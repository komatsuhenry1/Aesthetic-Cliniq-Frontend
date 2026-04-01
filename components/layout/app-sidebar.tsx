"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  Cog,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package2,
  Users,
  X,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const DEFAULT_CLINIC_NAME = "Não logado";

function getStoredClinicName() {
  if (typeof window === "undefined") {
    return DEFAULT_CLINIC_NAME;
  }

  return localStorage.getItem("clinicName") || DEFAULT_CLINIC_NAME;
}

function BrandIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-purple-500"
      fill="currentColor"
    >
      <path d="M10.6 2.4a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28zM4.4 8.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28H2.99a.75.75 0 0 1-.53-1.28zM16.6 8.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28zM10.6 14.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28z" />
    </svg>
  );
}

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/agenda", icon: CalendarClock },
  { label: "Profissionais", href: "/profissionais", icon: Users },
  { label: "Contatos", href: "/clientes", icon: Users },
  { label: "Atendimentos", href: "/atendimentos", icon: Activity },
  { label: "Procedimentos", href: "/procedimentos", icon: ClipboardList },
  { label: "Estoque", href: "/estoque", icon: Package2 },
  { label: "Financeiro", href: "/financeiro", icon: CreditCard },
  { label: "Configurações", href: "/configuracoes", icon: Cog },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

type AppSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function AppSidebar({ mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [clinicName, setClinicName] = useState(DEFAULT_CLINIC_NAME);

  useEffect(() => {
    setClinicName(getStoredClinicName());

    const handleStorage = () => {
      setClinicName(getStoredClinicName());
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fechar ao trocar de página
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("clinicName");
    setClinicName(DEFAULT_CLINIC_NAME);
    onMobileClose?.();
    router.replace("/auth/login");
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        {navigationItems.map(({ label, href, icon: Icon }) => {
          const active = isActivePath(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => onNavigate?.()}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                active ? "text-purple-700" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                  active ? "scale-100 bg-purple-50 opacity-100" : "scale-95 bg-slate-50 opacity-0 group-hover:opacity-100"
                }`}
              />
              <span
                className={`absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-purple-500 transition-all duration-300 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              />
              <Icon
                className={`relative h-4 w-4 transition-transform duration-300 ${
                  active ? "translate-x-1" : "group-hover:translate-x-0.5"
                }`}
              />
              <span
                className={`relative transition-transform duration-300 ${
                  active ? "translate-x-1 font-semibold" : "group-hover:translate-x-0.5"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition-all duration-300 hover:text-red-700"
        >
          <span className="absolute inset-0 scale-95 rounded-xl bg-red-50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
          <LogOut className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">Sair</span>
        </button>
      </div>
    </div>
  );

  const HeaderBlock = ({ showClose }: { showClose?: boolean }) => (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-100 px-4">
      <div className="rounded-full p-2 text-white">
        <BrandIcon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Clinic Pro</p>
        <p className="truncate text-sm font-semibold text-slate-700">{clinicName}</p>
      </div>
      {showClose ? (
        <button
          type="button"
          onClick={() => onMobileClose?.()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Mobile: overlay + drawer */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        onClick={() => onMobileClose?.()}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex min-h-0 w-[min(100vw-3rem,18rem)] max-w-[18rem] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out xl:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
        aria-label="Menu principal"
      >
        <HeaderBlock showClose />
        <NavLinks onNavigate={onMobileClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white xl:flex xl:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
          <div className="rounded-full p-2 text-white">
            <BrandIcon />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Clinic Pro</p>
            <p className="truncate text-sm font-semibold text-slate-700">{clinicName}</p>
          </div>
        </div>
        <NavLinks />
      </aside>
    </>
  );
}
