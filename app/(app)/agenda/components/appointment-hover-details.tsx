"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChartNoAxesColumn,
  Clock3,
  CoinsIcon,
  InfoIcon,
  UserIcon,
  UserSearch,
} from "lucide-react";
import type { AppointmentStatus } from "../types";
import { statusDotColor, statusLabel } from "../utils";

const POPOVER_W = 288;
const GAP = 10;
const Z_POPOVER = 10000;

type AppointmentHoverDetailsProps = {
  patient: string;
  procedure: string;
  professional?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  procedureValue?: string;
  notes?: string;
};

export function AppointmentHoverDetails({
  patient,
  procedure,
  professional,
  startTime,
  endTime,
  status,
  procedureValue,
  notes,
}: AppointmentHoverDetailsProps) {
  const hasNotes = Boolean(notes?.trim());
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    edge: 0,
    side: "right" as "right" | "left",
  });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current?.parentElement;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const availableRight = window.innerWidth - rect.right;
    const availableLeft = rect.left;
    const openLeft =
      availableRight < POPOVER_W + GAP && availableLeft > availableRight;
    const top = rect.top + rect.height / 2;
    setCoords({
      top,
      edge: openLeft ? rect.left - GAP : rect.right + GAP,
      side: openLeft ? "left" : "right",
    });
  }, []);

  useEffect(() => {
    const anchor = anchorRef.current?.parentElement;
    if (!anchor) return;

    const onEnter = () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      updatePosition();
      setOpen(true);
      setEntered(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    };

    const onLeave = () => {
      setEntered(false);
      closeTimer.current = setTimeout(() => setOpen(false), 180);
    };

    anchor.addEventListener("mouseenter", onEnter);
    anchor.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      anchor.removeEventListener("mouseenter", onEnter);
      anchor.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [updatePosition]);

  const panel = (
    <div
      className="pointer-events-none fixed max-w-[calc(100vw-1rem)] rounded-xl border border-purple-200 bg-gradient-to-br from-white to-purple-50 p-3 text-left shadow-xl shadow-purple-200/60 transition-all duration-200 ease-out"
      style={{
        width: POPOVER_W,
        top: coords.top,
        /* Direita: borda esquerda do painel em rect.right + GAP */
        left: coords.side === "right" ? coords.edge : undefined,
        /* Esquerda: borda direita do painel em rect.left - GAP (sem translateX -100%,
         * senão o painel anda o dobro e invade o card do lado) */
        right:
          coords.side === "left"
            ? Math.max(GAP, window.innerWidth - coords.edge)
            : undefined,
        transform: `translateY(-50%) scale(${entered ? 1 : 0.96})`,
        opacity: entered ? 1 : 0,
        zIndex: Z_POPOVER,
      }}
    >
      <div className="mb-2 min-w-0 space-y-1 border-b border-purple-100 pb-2">
        <p
          className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-purple-900"
          title={patient}
        >
          <UserIcon className="h-3.5 w-3.5 shrink-0 text-purple-600" />
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{patient}</span>
        </p>
        <p
          className="flex min-w-0 items-center gap-1.5 text-xs text-purple-700"
          title={procedure}
        >
          <ChartNoAxesColumn className="h-3.5 w-3.5 shrink-0 text-purple-500" />
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{procedure}</span>
        </p>
      </div>
      <div className="space-y-1.5">
        {professional ? (
          <p className="flex items-center gap-1.5 text-xs text-slate-600">
            <UserSearch className="h-3.5 w-3.5 text-purple-500" />
            <span>Profissional: {professional}</span>
          </p>
        ) : null}
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Clock3 className="h-3.5 w-3.5 text-purple-500" />
          <span>
            {startTime} - {endTime}
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <span className={`h-2 w-2 rounded-full ${statusDotColor(status)}`} />
          <span>{statusLabel(status)}</span>
        </p>
        {procedureValue ? (
          <p className="flex items-center gap-1.5 text-xs text-slate-600">
            <CoinsIcon className="h-3.5 w-3.5 text-purple-500" />
            <span>Valor: {procedureValue}</span>
          </p>
        ) : null}
        {hasNotes ? (
          <p className="flex items-start gap-1.5 text-xs text-slate-600">
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />
            <span className="line-clamp-2">Observacoes: {notes?.trim()}</span>
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <span ref={anchorRef} className="pointer-events-none absolute inset-0 z-0 block" aria-hidden />
      {open && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  );
}
