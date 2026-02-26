"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

export function AppHeader() {
  const [clinicName] = useState(() => {
    if (typeof window === "undefined") {
      return "Clínica Bella Face";
    }

    return localStorage.getItem("clinicName") || "Clínica Bella Face";
  });

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur xl:left-64">
      <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold uppercase text-slate-400">
            Clinica: {clinicName}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="hidden items-center gap-2 px-2 py-1.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
              AS
            </div>
            <div className="pr-1">
              <p className="text-xs font-semibold leading-tight text-slate-700">
                Dr. Alexander Smith
              </p>
              <p className="text-[11px] text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
