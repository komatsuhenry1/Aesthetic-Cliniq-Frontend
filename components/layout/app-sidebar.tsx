"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  ClipboardList,
  Cog,
  CreditCard,
  LayoutDashboard,
  Package2,
  Users,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

function BrandIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-blue-500"
      fill="currentColor"
    >
      <path d="M10.6 2.4a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28zM4.4 8.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28H2.99a.75.75 0 0 1-.53-1.28zM16.6 8.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28zM10.6 14.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28z" />
    </svg>
  );
}
const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/agenda", icon: CalendarClock },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Procedimentos", href: "/procedimentos", icon: ClipboardList },
  { label: "Pacotes", href: "/pacotes", icon: Package2 },
  { label: "Financeiro", href: "/financeiro", icon: CreditCard },
  { label: "Configurações", href: "/configuracoes", icon: Cog },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function AppSidebar() {
  const pathname = usePathname();
  const [clinicName] = useState(() => {
    if (typeof window === "undefined") {
      return "Clínica Bella Face";
    }

    return localStorage.getItem("clinicName") || "Clínica Bella Face";
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white xl:flex xl:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
        <div className="rounded-full  p-2 text-white">
          <BrandIcon />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Clinic Pro</p>
          <p className="text-sm font-semibold text-slate-700">{clinicName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map(({ label, href, icon: Icon }) => {
          const active = isActivePath(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
