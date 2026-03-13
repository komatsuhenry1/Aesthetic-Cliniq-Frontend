"use client";

import { ArrowRightIcon, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getNextFiveAppointments } from "@/services/api/appointment";
import type { AgendaAppointment } from "@/services/api/appointment";

const avatarColorOptions = [
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-blue-100 text-blue-700",
];

function getAvatarClassesByPatient(patient: string) {
  const hash = patient
    .split("")
    .reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
  const index = hash % avatarColorOptions.length;
  return avatarColorOptions[index];
}

function getPatientInitials(patient: string) {
  const parts = patient
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "CL";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatAppointmentTime(dateTime: string) {
  const parsedDate = new Date(dateTime);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateTime;
  }

  return parsedDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const weekDayInitials = ["D", "S", "T", "Q", "Q", "S", "S"];

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function getCalendarDays(baseMonthDate: Date) {
  const year = baseMonthDate.getFullYear();
  const month = baseMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekDay = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const calendarDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  for (let day = firstWeekDay - 1; day >= 0; day -= 1) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPreviousMonth - day),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  while (calendarDays.length % 7 !== 0) {
    const nextDay = calendarDays.length - (firstWeekDay + daysInMonth) + 1;
    calendarDays.push({
      date: new Date(year, month + 1, nextDay),
      isCurrentMonth: false,
    });
  }

  return calendarDays;
}

export default function DashboardPage() {
  const [clinicName, setClinicName] = useState("Não logado");
  const [nextAppointments, setNextAppointments] = useState<AgendaAppointment[]>([]);
  const calendarMonthDate = new Date();
  const calendarDays = getCalendarDays(calendarMonthDate);
  const calendarMonthLabel = calendarMonthDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    setClinicName(localStorage.getItem("clinicName") || "Não logado");
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadNextAppointments() {
      try {
        const data = await getNextFiveAppointments();
        if (!isCancelled) {
          setNextAppointments(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setNextAppointments([]);
        }
        console.error("Erro ao buscar próximos agendamentos:", error);
      }
    }

    void loadNextAppointments();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Bem vindo de volta, {clinicName}!
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Welcome back. Here&apos;s what&apos;s happening with your clinic today.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)] lg:items-start">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-800">Próximos Agendamentos</h2>
            </div>
            <Link
              href="/agenda"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-blue-500 transition hover:text-blue-800"
            >
              <span>Ver todos</span>
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          <div>
            {nextAppointments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                Nenhum agendamento encontrado para as próximas horas.
              </p>
            ) : (
              nextAppointments.map((appointment: AgendaAppointment) => (
              <article
                key={appointment.id}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getAvatarClassesByPatient(appointment.patient)}`}
                  >
                    {getPatientInitials(appointment.patient)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-bold text-slate-800">{appointment.patient}</p>
                    <p className="truncate text-base text-slate-500">{appointment.procedure}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-800">
                      {formatAppointmentTime(appointment.startTime)}
                    </p>
                    <p className="text-base text-slate-500">{appointment.professional}</p>
                  </div>
                  <Link
                    href="/agenda"
                    className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 transition hover:bg-blue-100 hover:text-blue-700"
                    aria-label={`Ir para agenda de ${appointment.patient}`}
                  >
                    <ArrowRightIcon className="h-6 w-6 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            )))}
          </div>
        </div>

        <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-4 lg:w-[320px]">
            <div className="mb-4 flex items-center  justify-center">
              <h3 className="text-2xl font-bold text-slate-800">{calendarMonthLabel}</h3>
            </div>

            <div className="grid grid-cols-7 gap-y-3 text-center">
              {weekDayInitials.map((dayLabel, index) => (
                <span key={`${dayLabel}-${index}`} className="text-sm font-semibold text-slate-400">
                  {dayLabel}
                </span>
              ))}
              {calendarDays.map(({ date, isCurrentMonth }) => {
                const isSelected = isSameDay(date, new Date());
                return (
                  <div
                    key={date.toISOString()}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                      isSelected ? "bg-blue-500 font-semibold text-white" : isCurrentMonth ? "text-slate-800" : "text-slate-300"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
  
  
      </section>
    </div>
  );
}
