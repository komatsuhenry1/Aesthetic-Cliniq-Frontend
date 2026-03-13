"use client";

import type { Appointment } from "../types";
import { appointmentStyles } from "../utils";
import { AppointmentHoverDetails } from "./appointment-hover-details";

type DayAppointmentCardProps = {
  appointment: Appointment;
  onOpen: () => void;
  compact?: boolean;
  tight?: boolean;
};

export function DayAppointmentCard({
  appointment,
  onOpen,
  compact = false,
  tight = false,
}: DayAppointmentCardProps) {
  const showProcedure = !tight;

  return (
    <article
      className={`group relative box-border h-full min-h-0 min-w-0 max-w-full cursor-pointer overflow-hidden rounded-lg border transition hover:shadow-sm ${
        tight ? "p-1" : compact ? "p-1.5" : "p-3"
      } ${appointmentStyles(appointment.status)}`}
      onClick={onOpen}
    >
      <p
        className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-semibold leading-tight ${tight ? "text-[10px]" : compact ? "text-[11px]" : "text-sm"}`}
        title={appointment.patient}
      >
        {appointment.patient}
      </p>
      <p
        className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium leading-tight ${tight ? "text-[9px]" : compact ? "text-[10px]" : "text-xs"}`}
      >
        {appointment.startTime} - {appointment.endTime}
      </p>
      {showProcedure ? (
        <p
          className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap leading-tight ${compact ? "text-[10px]" : "text-xs"}`}
          title={`${appointment.procedure}${appointment.professional ? ` - ${appointment.professional}` : ""}`}
        >
          {appointment.procedure}
          {appointment.professional ? ` - ${appointment.professional}` : ""}
        </p>
      ) : null}
      <AppointmentHoverDetails
        patient={appointment.patient}
        procedure={appointment.procedure}
        professional={appointment.professional}
        startTime={appointment.startTime}
        endTime={appointment.endTime}
        status={appointment.status}
        procedureValue={appointment.procedureValue}
        notes={appointment.notes}
      />
    </article>
  );
}
