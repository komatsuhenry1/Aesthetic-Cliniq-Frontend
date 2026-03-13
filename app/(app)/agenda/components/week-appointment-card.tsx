"use client";

import type { WeeklyEventLayout } from "../types";
import { weekEventStyles } from "../utils";
import { AppointmentHoverDetails } from "./appointment-hover-details";

type WeekAppointmentCardProps = {
  event: WeeklyEventLayout;
  top: number;
  height: number;
  columnWidth: number;
  leftOffset: number;
  onOpen: () => void;
  maxWidth?: number;
  centerWithinColumn?: boolean;
  /** id no DOM para scrollIntoView (ex.: agenda-appt-{id}) */
  anchorId?: string;
};

export function WeekAppointmentCard({
  event,
  top,
  height,
  columnWidth,
  leftOffset,
  onOpen,
  maxWidth,
  centerWithinColumn = false,
  anchorId,
}: WeekAppointmentCardProps) {
  const width = maxWidth ? `min(calc(${columnWidth}% - 4px), ${maxWidth}px)` : `calc(${columnWidth}% - 4px)`;
  const left = centerWithinColumn
    ? `calc(${leftOffset + columnWidth / 2}% + 2px)`
    : `calc(${leftOffset}% + 2px)`;

  return (
    <article
      id={anchorId}
      className={`group pointer-events-auto absolute box-border min-w-0 max-w-full scroll-mt-24 cursor-pointer overflow-hidden rounded-xl border p-2 ${weekEventStyles(event.status)}`}
      style={{
        top: `${top + 2}px`,
        height: `${height - 4}px`,
        left,
        width,
        transform: centerWithinColumn ? "translateX(-50%)" : undefined,
      }}
      onClick={onOpen}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
        <p className="flex min-w-0 shrink-0 items-center gap-1 text-sm font-semibold">
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {event.title}
          </span>
          <span className="max-w-[48%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-right text-[10px] font-medium opacity-90">
            {event.startTime} - {event.endTime}
          </span>
        </p>
        <p
          className="min-w-0 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium"
          title={event.patient}
        >
          {event.patient}
        </p>
        <p
          className="min-w-0 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] opacity-80"
          title={event.professional}
        >
          {event.professional}
        </p>
      </div>
      <AppointmentHoverDetails
        patient={event.patient}
        procedure={event.title}
        professional={event.professional}
        startTime={event.startTime}
        endTime={event.endTime}
        status={event.status}
        procedureValue={event.procedureValue}
        notes={event.notes}
      />
    </article>
  );
}
