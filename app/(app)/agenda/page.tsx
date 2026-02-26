"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Clock4,
  UserSearch,
  UserIcon,
  X,
  ChartNoAxesColumn,
} from "lucide-react";
import { StatusNotification } from "@/components/status-notification";

type AppointmentStatus = "confirmado" | "pendente" | "em-andamento" | "bloqueio";
type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  professional: string;
  status: AppointmentStatus;
  badge?: string;
};                                                                                                                            

type ViewMode = "day" | "week" | "month";
type WeeklyEvent = {
  dayIndex: number;
  startTime: string;
  endTime: string;
  title: string;
  patient: string;
  professional: string;
  status: AppointmentStatus;
  appointmentId?: string;
  canEditStatus?: boolean;
};
type WeeklyEventLayout = WeeklyEvent & {
  overlapIndex: number;
  overlapCount: number;
};
type AppointmentDetails = {
  appointmentId?: string;
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  professional: string;
  status: AppointmentStatus;
  canEditStatus: boolean;
};
type NewAppointmentForm = {
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  professional: string;
  status: AppointmentStatus;
  notes: string;
};
type StatusNotification = {
  title: string;
  description: string;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKeyFromOffset(dayOffset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return toDateKey(date);
}                                            

type AppointmentSeed = Omit<Appointment, "id">;

const initialAppointments: AppointmentSeed[] = [
  {
    date: getDateKeyFromOffset(0),
    startTime: "09:00",
    endTime: "10:00",
    patient: "Anna Peterson",
    procedure: "Botox Session",
    professional: "Dr. Johnson",
    status: "confirmado",
  },
  {
    date: getDateKeyFromOffset(0),
    startTime: "10:00",
    endTime: "11:00",
    patient: "Carlos Mendes",
    procedure: "Microneedling",
    professional: "Dr. Chen",
    status: "em-andamento",
  },
  {
    date: getDateKeyFromOffset(0),
    startTime: "10:00",
    endTime: "11:00",
    patient: "Elisa Thompson",
    procedure: "HydraFacial",
    professional: "Dr. Johnson",
    status: "pendente",
    badge: "10:32",
  },
  {
    date: getDateKeyFromOffset(0),
    startTime: "11:00",
    endTime: "12:00",
    patient: "Bloqueio",
    procedure: "Maintenance",
    professional: "",
    status: "bloqueio",
  },
  {
    date: getDateKeyFromOffset(0),
    startTime: "13:00",
    endTime: "14:00",
    patient: "S. Miller",
    procedure: "Peeling",
    professional: "Dra. Valeria",
    status: "confirmado",
  },
  {
    date: getDateKeyFromOffset(0),
    startTime: "13:00",
    endTime: "14:00",
    patient: "J. Doe",
    procedure: "Consult",
    professional: "Dr. Otero",
    status: "confirmado",
  },
  {
    date: getDateKeyFromOffset(0),
    startTime: "13:00",
    endTime: "14:00",
    patient: "R. Vance",
    procedure: "Botox",
    professional: "Dra. Valeria",
    status: "confirmado",
  },
  {
    date: getDateKeyFromOffset(1),
    startTime: "08:00",
    endTime: "09:00",
    patient: "Marina Costa",
    procedure: "Avaliação Inicial",
    professional: "Dra. Paula",
    status: "confirmado",
  },
  {
    date: getDateKeyFromOffset(1),
    startTime: "15:00",
    endTime: "16:00",
    patient: "Henrique Silva",
    procedure: "Retorno",
    professional: "Dr. Smith",
    status: "pendente",
  },
  {
    date: getDateKeyFromOffset(-1),
    startTime: "18:00",
    endTime: "19:00",
    patient: "Carla Dias",
    procedure: "Bioestimulador",
    professional: "Dra. Valeria",
    status: "em-andamento",
  },
];

const timeSlots = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
const HOUR_ROW_HEIGHT = 80;
const WEEK_START_HOUR = 0;
const WEEK_END_HOUR = 24;
const WEEK_ROW_HEIGHT = 74;
const weekTimeSlots = Array.from(
  { length: WEEK_END_HOUR - WEEK_START_HOUR },
  (_, index) => `${String(WEEK_START_HOUR + index).padStart(2, "0")}:00`
);
const weekDayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
const appointmentStatusOptions: AppointmentStatus[] = [
  "confirmado",
  "pendente",
  "em-andamento",
  "bloqueio",
];
const professionalOptions = ["Dra. Ana Paula", "Dr. Ricardo", "Dra. Valeria", "Dra. Paula"];
const procedureOptions = [
  "Limpeza de Pele",
  "Botox - Face",
  "Peeling",
  "Preenchimento Labial",
  "Avaliação Geral",
];
const weeklyEvents: WeeklyEvent[] = [
  {
    dayIndex: 0,
    startTime: "08:15",
    endTime: "09:15",
    title: "Botox - Face",
    patient: "Beatriz Souza",
    professional: "Dr. Ricardo",
    status: "confirmado",
  },
  {
    dayIndex: 1,
    startTime: "08:45",
    endTime: "10:15",
    title: "Preenchimento Labial",
    patient: "Carlos Mendes",
    professional: "Dr. Ricardo",
    status: "em-andamento",
  },
  {
    dayIndex: 1,
    startTime: "10:15",
    endTime: "11:00",
    title: "Avaliação Geral",
    patient: "Joana Lima",
    professional: "Dra. Paula",
    status: "confirmado",
  },
  {
    dayIndex: 2,
    startTime: "08:30",
    endTime: "10:15",
    title: "Peeling",
    patient: "Marta Ramos",
    professional: "Dra. Valeria",
    status: "pendente",
  },
  {
    dayIndex: 2,
    startTime: "08:45",
    endTime: "10:30",
    title: "Limpeza de Pele",
    patient: "Felipe J.",
    professional: "Dra. Paula",
    status: "em-andamento",
  },
  {
    dayIndex: 3,
    startTime: "11:15",
    endTime: "12:15",
    title: "Bloqueado",
    patient: "Intervalo Almoço",
    professional: "Equipe",
    status: "bloqueio",
  },
  {
    dayIndex: 4,
    startTime: "08:30",
    endTime: "10:10",
    title: "Lipo de Papada",
    patient: "Mariana G.",
    professional: "Cirurgia",
    status: "pendente",
  },
];

function appointmentStyles(status: Appointment["status"]) {
  if (status === "confirmado") {
    return "border-slate-200 border-l-4 border-l-emerald-500 bg-emerald-100 text-emerald-900";
  }

  if (status === "pendente") {
    return "border-slate-200 border-l-4 border-l-amber-500 bg-amber-100 text-amber-900";
  }

  if (status === "em-andamento") {
    return "border-slate-200 border-l-4 border-l-indigo-500 bg-indigo-100 text-indigo-900";
  }

  return "border-slate-200 border-l-4 border-l-slate-400 bg-slate-100 text-slate-700 italic";
}

function addDays(date: Date, days: number) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function addMonths(date: Date, months: number) {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

function getStartOfWeek(date: Date) {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  newDate.setDate(newDate.getDate() + diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const totalMinutes = parseTimeToMinutes(time) + minutesToAdd;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function computeDayEventLayout(events: WeeklyEvent[]): WeeklyEventLayout[] {
  if (events.length === 0) {
    return [];
  }

  const sortedEvents = [...events].sort((firstEvent, secondEvent) => {
    const startDifference =
      parseTimeToMinutes(firstEvent.startTime) - parseTimeToMinutes(secondEvent.startTime);

    if (startDifference !== 0) {
      return startDifference;
    }

    return parseTimeToMinutes(firstEvent.endTime) - parseTimeToMinutes(secondEvent.endTime);
  });

  const clusters: WeeklyEvent[][] = [];
  let currentCluster: WeeklyEvent[] = [];
  let currentClusterMaxEnd = -1;

  sortedEvents.forEach((event) => {
    const eventStart = parseTimeToMinutes(event.startTime);
    const eventEnd = parseTimeToMinutes(event.endTime);

    if (currentCluster.length === 0 || eventStart < currentClusterMaxEnd) {
      currentCluster.push(event);
      currentClusterMaxEnd = Math.max(currentClusterMaxEnd, eventEnd);
      return;
    }

    clusters.push(currentCluster);
    currentCluster = [event];
    currentClusterMaxEnd = eventEnd;
  });

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const positionedEvents: WeeklyEventLayout[] = [];

  clusters.forEach((cluster) => {
    const columnEndTimes: number[] = [];
    const clusteredWithColumn: Array<{ event: WeeklyEvent; columnIndex: number }> = [];

    cluster.forEach((event) => {
      const eventStart = parseTimeToMinutes(event.startTime);
      const eventEnd = parseTimeToMinutes(event.endTime);

      let availableColumn = -1;

      for (let columnIndex = 0; columnIndex < columnEndTimes.length; columnIndex += 1) {
        if (eventStart >= columnEndTimes[columnIndex]) {
          availableColumn = columnIndex;
          break;
        }
      }

      if (availableColumn === -1) {
        availableColumn = columnEndTimes.length;
        columnEndTimes.push(eventEnd);
      } else {
        columnEndTimes[availableColumn] = eventEnd;
      }

      clusteredWithColumn.push({ event, columnIndex: availableColumn });
    });

    const overlapCount = Math.max(1, columnEndTimes.length);
    clusteredWithColumn.forEach(({ event, columnIndex }) => {
      positionedEvents.push({
        ...event,
        overlapIndex: columnIndex,
        overlapCount,
      });
    });
  });

  return positionedEvents;
}

function weekEventStyles(status: WeeklyEvent["status"]) {
  if (status === "confirmado") {
    return "border-slate-200 border-l-4 border-l-emerald-500 bg-emerald-100 text-emerald-900";
  }

  if (status === "pendente") {
    return "border-slate-200 border-l-4 border-l-rose-500 bg-rose-100 text-rose-900";
  }

  if (status === "em-andamento") {
    return "border-slate-200 border-l-4 border-l-indigo-500 bg-indigo-100 text-indigo-900";
  }

  return "border-slate-200 border-l-4 border-l-slate-400 bg-slate-100 text-slate-600";
}

function viewModeButtonStyles(currentMode: ViewMode, buttonMode: ViewMode) {
  if (currentMode === buttonMode) {
    return "rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm";
  }

  return "rounded-md px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700";
}

function statusLabel(status: AppointmentStatus) {
  if (status === "confirmado") {
    return "Confirmado";
  }

  if (status === "pendente") {
    return "Pendente";
  }

  if (status === "em-andamento") {
    return "Em andamento";
  }

  return "Bloqueio";
}

function statusDotColor(status: AppointmentStatus) {
  if (status === "confirmado") {
    return "bg-emerald-500";
  }

  if (status === "pendente") {
    return "bg-amber-500";
  }

  if (status === "em-andamento") {
    return "bg-indigo-500";
  }

  return "bg-slate-400";
}

function createAppointmentId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [appointmentList, setAppointmentList] = useState<Appointment[]>(() =>
    initialAppointments.map((appointment, index) => ({
      ...appointment,
      id: `seed-${index}`,
    }))
  );
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [editableStatus, setEditableStatus] = useState<AppointmentStatus>("confirmado");
  const [statusNotification, setStatusNotification] = useState<StatusNotification | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState<NewAppointmentForm>(() => ({
    date: toDateKey(new Date()),
    startTime: "09:00",
    endTime: "10:00",
    patient: "",
    procedure: "Limpeza de Pele",
    professional: "Dra. Ana Paula",
    status: "confirmado",
    notes: "",
  }));
  const [createAppointmentError, setCreateAppointmentError] = useState("");
  const scheduleScrollRef = useRef<HTMLDivElement | null>(null);
  const weekScheduleScrollRef = useRef<HTMLDivElement | null>(null);
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const weekStartDate = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);
  const weekEndDate = useMemo(() => addDays(weekStartDate, 6), [weekStartDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStartDate, index)),
    [weekStartDate]
  );

  const formattedDate = useMemo(
    () =>
      selectedDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    [selectedDate]
  );

  const normalizedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }, []);

  const normalizedSelectedDate = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, [selectedDate]);

  const selectedDateAppointments = useMemo(
    () => appointmentList.filter((appointment) => appointment.date === selectedDateKey),
    [appointmentList, selectedDateKey]
  );
  const selectedWeekAppointments = useMemo(
    () =>
      appointmentList
        .map((appointment): WeeklyEvent | null => {
          const date = new Date(`${appointment.date}T00:00:00`);
          const dayDifference = Math.floor(
            (date.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDifference < 0 || dayDifference > 6) {
            return null;
          }

          return {
            dayIndex: dayDifference,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            title: appointment.procedure,
            patient: appointment.patient,
            professional: appointment.professional || "Sem profissional",
            status: appointment.status,
            appointmentId: appointment.id,
            canEditStatus: true,
          };
        })
        .filter((event): event is WeeklyEvent => event !== null),
    [appointmentList, weekStartDate]
  );
  const selectedWeekEvents = useMemo(
    () => [...weeklyEvents, ...selectedWeekAppointments],
    [selectedWeekAppointments]
  );
  const selectedWeekEventsByDay = useMemo(
    () =>
      weekDayLabels.map((_, dayIndex) =>
        computeDayEventLayout(selectedWeekEvents.filter((event) => event.dayIndex === dayIndex))
      ),
    [selectedWeekEvents]
  );

  const isSelectedDateToday = normalizedSelectedDate === normalizedToday;
  const isSelectedWeekCurrent = useMemo(() => {
    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);
    return currentWeekStart.getTime() === weekStartDate.getTime();
  }, [weekStartDate]);

  const currentMinutesOfDay = useMemo(
    () => currentTime.getHours() * 60 + currentTime.getMinutes(),
    [currentTime]
  );

  const currentTimeLabel = useMemo(
    () =>
      `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(
        2,
        "0"
      )}`,
    [currentTime]
  );

  const currentTimeIndicatorTop = useMemo(
    () => (currentMinutesOfDay * HOUR_ROW_HEIGHT) / 60,
    [currentMinutesOfDay]
  );
  const weekCurrentTimeIndicatorTop = useMemo(
    () => ((currentMinutesOfDay - WEEK_START_HOUR * 60) * WEEK_ROW_HEIGHT) / 60,
    [currentMinutesOfDay]
  );
  const showWeekCurrentTimeLine =
    isSelectedWeekCurrent &&
    currentMinutesOfDay >= WEEK_START_HOUR * 60 &&
    currentMinutesOfDay <= WEEK_END_HOUR * 60;

  const headerTitle = useMemo(() => {
    if (viewMode === "week") {
      const startLabel = weekStartDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
      const endLabel = weekEndDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });

      return `De ${startLabel} a ${endLabel}`;
    }

    if (viewMode === "month") {
      return selectedDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    }

    return formattedDate;
  }, [viewMode, weekStartDate, weekEndDate, selectedDate, formattedDate]);

  const headerSubtitle = useMemo(() => {
    if (viewMode === "week") {
      return `${selectedWeekEvents.length} agendamento(s) nesta semana`;
    }

    if (viewMode === "month") {
      return "Visão mensal em desenvolvimento";
    }

    return `${selectedDateAppointments.length} agendamento(s) para este dia`;
  }, [viewMode, selectedWeekEvents.length, selectedDateAppointments.length]);

  const disableTodayButton =
    viewMode === "day" ? isSelectedDateToday : viewMode === "week" ? isSelectedWeekCurrent : false;

  function handlePreviousPeriod() {
    setSelectedDate((currentDate) => {
      if (viewMode === "week") {
        return addDays(currentDate, -7);
      }

      if (viewMode === "month") {
        return addMonths(currentDate, -1);
      }

      return addDays(currentDate, -1);
    });
  }

  function handleNextPeriod() {
    setSelectedDate((currentDate) => {
      if (viewMode === "week") {
        return addDays(currentDate, 7);
      }

      if (viewMode === "month") {
        return addMonths(currentDate, 1);
      }

      return addDays(currentDate, 1);
    });
  }

  function openCreateAppointmentModal() {
    setNewAppointment({
      date: selectedDateKey,
      startTime: "09:00",
      endTime: "10:00",
      patient: "",
      procedure: "Limpeza de Pele",
      professional: "Dra. Ana Paula",
      status: "confirmado",
      notes: "",
    });
    setCreateAppointmentError("");
    setIsCreateModalOpen(true);
  }

  function handleCreateAppointment() {
    if (!newAppointment.patient.trim() || !newAppointment.procedure.trim()) {
      setCreateAppointmentError("Preencha paciente e procedimento.");
      return;
    }

    if (parseTimeToMinutes(newAppointment.endTime) <= parseTimeToMinutes(newAppointment.startTime)) {
      setCreateAppointmentError("O horário final precisa ser maior que o inicial.");
      return;
    }

    setAppointmentList((currentAppointments) => [
      ...currentAppointments,
      {
        id: createAppointmentId(),
        date: newAppointment.date,
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime,
        patient: newAppointment.patient.trim(),
        procedure: newAppointment.procedure.trim(),
        professional: newAppointment.professional.trim(),
        status: newAppointment.status,
      },
    ]);
    setIsCreateModalOpen(false);
  }

  function openAppointmentDetails(details: AppointmentDetails) {
    setSelectedAppointmentDetails(details);
    setEditableStatus(details.status);
  }

  function handleUpdateAppointmentStatus() {
    if (!selectedAppointmentDetails?.canEditStatus || !selectedAppointmentDetails.appointmentId) {
      return;
    }

    const patientName = selectedAppointmentDetails.patient;
    const updatedStatusLabel = statusLabel(editableStatus);

    setAppointmentList((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === selectedAppointmentDetails.appointmentId
          ? { ...appointment, status: editableStatus }
          : appointment
      )
    );
    setSelectedAppointmentDetails((currentDetails) =>
      currentDetails ? { ...currentDetails, status: editableStatus } : currentDetails
    );
    setSelectedAppointmentDetails(null);
    setStatusNotification({
      title: editableStatus === "confirmado" ? "Agendamento Confirmado" : "Status Atualizado",
      description:
        editableStatus === "confirmado"
          ? `O atendimento foi confirmado com sucesso para ${patientName}.`
          : `Status alterado para ${updatedStatusLabel} para ${patientName}.`,
    });
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (viewMode !== "day" || !isSelectedDateToday || !scheduleScrollRef.current) {
      return;
    }

    const scrollContainer = scheduleScrollRef.current;
    const targetScrollTop = currentTimeIndicatorTop - scrollContainer.clientHeight / 2;
    scrollContainer.scrollTop = Math.max(0, targetScrollTop);
  }, [selectedDateKey, isSelectedDateToday, currentTimeIndicatorTop, viewMode]);

  useEffect(() => {
    if (viewMode !== "week" || !isSelectedWeekCurrent || !weekScheduleScrollRef.current) {
      return;
    }

    const scrollContainer = weekScheduleScrollRef.current;
    const targetScrollTop = weekCurrentTimeIndicatorTop - scrollContainer.clientHeight / 2;
    scrollContainer.scrollTop = Math.max(0, targetScrollTop);
  }, [isSelectedWeekCurrent, weekCurrentTimeIndicatorTop, viewMode]);

  useEffect(() => {
    if (!statusNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusNotification(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusNotification]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight capitalize text-slate-800">
              {headerTitle}
            </h2>
            <p className="text-sm text-slate-500">{headerSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                className={viewModeButtonStyles(viewMode, "day")}
                onClick={() => setViewMode("day")}
              >
                Dia
              </button>
              <button
                type="button"
                className={viewModeButtonStyles(viewMode, "week")}
                onClick={() => setViewMode("week")}
              >
                Semana
              </button>
              <button
                type="button"
                className={viewModeButtonStyles(viewMode, "month")}
                onClick={() => setViewMode("month")}
              >
                Mês
              </button>
            </div>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"
            >
              <UserSearch className="h-4 w-4" />
              Profissionais
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
              onClick={handlePreviousPeriod}
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                onClick={() => setSelectedDate(new Date())}
                disabled={disableTodayButton}
              >
                Hoje
              </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
              onClick={handleNextPeriod}
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-300/50 hover:bg-blue-700"
              onClick={openCreateAppointmentModal}
            >
              Novo Agendamento
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-gray-100 px-3 py-1 text-gray-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Confirmado
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-gray-100 px-3 py-1 text-gray-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Pendente
          </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-gray-100 px-3 py-1 text-gray-800">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Em andamento
          </span>
        </div>
       

        {viewMode === "day" ? (
          <div ref={scheduleScrollRef} className="max-h-[70vh] overflow-auto">
            <div className="min-w-[980px] rounded-xl border border-slate-200">
              <div className="relative">
                {timeSlots.map((slot) => (
                  <div
                    key={slot}
                    className="grid h-20 grid-cols-[64px_1fr] border-b border-slate-100 last:border-b-0"
                    style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                  >
                    <div className="flex items-start justify-center py-4 text-xs font-semibold text-slate-400">
                      {slot}
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2">
                      {selectedDateAppointments
                        .filter((appointment) => appointment.startTime === slot)
                        .map((appointment) => (
                          <article
                            key={`${appointment.date}-${appointment.patient}-${appointment.startTime}`}
                            className={`relative cursor-pointer rounded-lg border p-3 transition hover:shadow-sm ${appointmentStyles(appointment.status)}`}
                            onClick={() =>
                              openAppointmentDetails({
                                appointmentId: appointment.id,
                                date: appointment.date,
                                startTime: appointment.startTime,
                                endTime: appointment.endTime,
                                patient: appointment.patient,
                                procedure: appointment.procedure,
                                professional: appointment.professional,
                                status: appointment.status,
                                canEditStatus: true,
                              })
                            }
                          >
                            <p className="text-sm font-semibold">{appointment.patient}</p>
                            <p className="text-xs font-medium">
                              {appointment.startTime} - {appointment.endTime}
                            </p>
                            <p className="text-xs">
                              {appointment.procedure}
                              {appointment.professional ? ` - ${appointment.professional}` : ""}
                            </p>

                            {appointment.badge ? (
                              <span className="absolute right-2 top-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {appointment.badge}
                              </span>
                            ) : null}
                          </article>
                        ))}

                      {selectedDateAppointments.filter((appointment) => appointment.startTime === slot)
                        .length === 0 ? (
                        <div className="col-span-3 flex h-12 items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 text-xs text-slate-300">
                          <Clock3 className="h-3.5 w-3.5" />
                          Sem agendamentos neste horário
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {isSelectedDateToday ? (
                  <div
                    className="pointer-events-none absolute left-16 right-0 z-20"
                    style={{ top: `${currentTimeIndicatorTop}px` }}
                  >
                    <div className="relative">
                      <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-red-500" />
                      <span className="absolute -top-2 right-0 rounded bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                        {currentTimeLabel}
                      </span>
                      <div className="h-0.5 w-full bg-red-500" />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-[64px_1fr] bg-slate-50/80">
                <div className="flex items-start justify-center py-2 text-xs font-semibold text-slate-500">
                  23:59
                </div>
                <div className="py-2 text-xs text-slate-400">Fim do dia</div>
              </div>
            </div>
          </div>
        ) : viewMode === "week" ? (
          <div className="overflow-x-auto">
            <div className="min-w-[1080px] rounded-xl border border-slate-200">
              <div className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))] bg-slate-50/80">
                <div className="flex items-center justify-center border-b border-r border-slate-200 px-2 py-4 text-xs font-semibold text-slate-400">
                  GMT-3
                </div>
                {weekDays.map((day, index) => {
                  const isToday = toDateKey(day) === toDateKey(new Date());

                  return (
                    <div
                      key={`${toDateKey(day)}-${index}`}
                      className={`border-b border-r border-slate-200 px-2 py-3 text-center last:border-r-0 ${
                        isToday ? "bg-indigo-50" : ""
                      }`}
                    >
                      <p className={`text-xs font-semibold ${isToday ? "text-indigo-500" : "text-slate-400"}`}>
                        {weekDayLabels[index]}
                      </p>
                      <p className={`text-3xl font-bold leading-none ${isToday ? "text-indigo-600" : "text-slate-800"}`}>
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div ref={weekScheduleScrollRef} className="max-h-[70vh] overflow-y-auto">
                <div className="relative">
                  {weekTimeSlots.map((slot) => (
                    <div
                      key={slot}
                      className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))]"
                      style={{ height: `${WEEK_ROW_HEIGHT}px` }}
                    >
                      <div className="border-b border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-400">
                        {slot}
                      </div>
                      {weekDayLabels.map((dayLabel) => (
                        <div key={`${slot}-${dayLabel}`} className="border-b border-r border-slate-200 last:border-r-0" />
                      ))}
                    </div>
                  ))}

                  <div className="pointer-events-none absolute inset-0 grid grid-cols-[88px_repeat(7,minmax(0,1fr))]">
                    <div />
                    {weekDayLabels.map((dayLabel, dayIndex) => (
                      <div key={dayLabel} className="relative">
                        {selectedWeekEventsByDay[dayIndex].map((event) => {
                            const startMinutes = parseTimeToMinutes(event.startTime);
                            const endMinutes = parseTimeToMinutes(event.endTime);
                            const top =
                              ((startMinutes - WEEK_START_HOUR * 60) * WEEK_ROW_HEIGHT) / 60;
                            const height = Math.max(
                              56,
                              ((endMinutes - startMinutes) * WEEK_ROW_HEIGHT) / 60
                            );
                            const columnWidth = 100 / event.overlapCount;
                            const leftOffset = columnWidth * event.overlapIndex;

                            return (
                              <article
                                key={`${dayIndex}-${event.title}-${event.startTime}-${event.overlapIndex}`}
                                className={`pointer-events-auto absolute cursor-pointer rounded-xl border p-2 ${weekEventStyles(event.status)}`}
                                style={{
                                  top: `${top + 2}px`,
                                  height: `${height - 4}px`,
                                  left: `calc(${leftOffset}% + 2px)`,
                                  width: `calc(${columnWidth}% - 4px)`,
                                }}
                                onClick={() =>
                                  openAppointmentDetails({
                                    appointmentId: event.appointmentId,
                                    date: toDateKey(weekDays[dayIndex]),
                                    startTime: event.startTime,
                                    endTime: event.endTime,
                                    patient: event.patient,
                                    procedure: event.title,
                                    professional: event.professional,
                                    status: event.status,
                                    canEditStatus: Boolean(event.canEditStatus && event.appointmentId),
                                  })
                                }
                              >
                                <p className="truncate text-sm font-semibold">{event.title}</p>
                                <p className="truncate text-xs">{event.patient}</p>
                                <p className="truncate text-[11px] opacity-80">{event.professional}</p>
                              </article>
                            );
                          })}
                      </div>
                    ))}
                  </div>

                  {showWeekCurrentTimeLine ? (
                    <div
                      className="pointer-events-none absolute left-[88px] right-0 z-20"
                      style={{ top: `${weekCurrentTimeIndicatorTop}px` }}
                    >
                      <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-red-500" />
                      <span className="absolute -top-2 right-2 rounded bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                        {currentTimeLabel}
                      </span>
                      <div className="h-0.5 w-full bg-red-500" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <div>
              <CalendarDays className="mx-auto mb-3 h-6 w-6 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Visão mensal em preparação</p>
              <p className="mt-1 text-xs text-slate-500">
                Envie o próximo layout e eu implemento esse modo igual ao seu design.
              </p>
            </div>
          </div>
        )}
      </section>

      {selectedAppointmentDetails ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]"
          onClick={() => setSelectedAppointmentDetails(null)}
        >
          <div
            className="flex h-full w-full max-w-md flex-col border-l border-blue-100 bg-white shadow-2xl shadow-blue-200/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-2xl font-bold text-slate-800">Detalhes do Agendamento</h3>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setSelectedAppointmentDetails(null)}
                aria-label="Fechar detalhes"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50 px-5 py-5 text-sm text-slate-700">
              <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-blue-600" />  
                <p className="text-lg font-bold text-slate-800">{selectedAppointmentDetails.patient}</p>
                <p className="mt-1 text-sm text-blue-700">{selectedAppointmentDetails.procedure}</p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Informações da sessão
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="flex justify-between gap-3">
                    <span className="text-slate-500">Data</span>
                    <span className="font-semibold text-slate-800">{selectedAppointmentDetails.date}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="text-slate-500">Horário</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAppointmentDetails.startTime} - {selectedAppointmentDetails.endTime}
                    </span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="text-slate-500">Profissional</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAppointmentDetails.professional || "Não informado"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                  <ChartNoAxesColumn className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Status</p>
                </div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusDotColor(editableStatus)}`} />
                  {statusLabel(editableStatus)}
                </div>
                {selectedAppointmentDetails.canEditStatus ? (
                  <select
                    className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900"
                    value={editableStatus}
                    onChange={(event) => setEditableStatus(event.target.value as AppointmentStatus)}
                  >
                    {appointmentStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-900">
                    {statusLabel(selectedAppointmentDetails.status)}
                  </p>
                )}
                {!selectedAppointmentDetails.canEditStatus ? (
                  <p className="mt-2 text-xs text-blue-700">Este atendimento é apenas visualização.</p>
                ) : null}
              </div>
            </div>

            <div className="flex gap-2 border-t border-blue-100 bg-white px-5 py-4">
              {selectedAppointmentDetails.canEditStatus ? (
                <button
                  type="button"
                  className="flex-1 rounded-lg border bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  onClick={handleUpdateAppointmentStatus}
                >
                  Salvar status
                </button>
              ) : null}
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => setSelectedAppointmentDetails(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[1px]"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
              <h3 className="text-4xl font-bold text-slate-800">Novo Agendamento</h3>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Fechar modal"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="space-y-6 px-8 py-6">
              <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Cliente
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <UserSearch className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder="Nome do cliente ou CPF"
                    value={newAppointment.patient}
                    onChange={(event) =>
                      setNewAppointment((current) => ({ ...current, patient: event.target.value }))
                    }
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Profissional
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700"
                    value={newAppointment.professional}
                    onChange={(event) =>
                      setNewAppointment((current) => ({ ...current, professional: event.target.value }))
                    }
                  >
                    {professionalOptions.map((professional) => (
                      <option key={professional} value={professional}>
                        {professional}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Procedimento
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700"
                    value={newAppointment.procedure}
                    onChange={(event) =>
                      setNewAppointment((current) => ({ ...current, procedure: event.target.value }))
                    }
                  >
                    {procedureOptions.map((procedure) => (
                      <option key={procedure} value={procedure}>
                        {procedure}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Data
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input
                      type="date"
                      className="w-full bg-transparent text-base text-slate-700 outline-none"
                      value={newAppointment.date}
                      onChange={(event) =>
                        setNewAppointment((current) => ({ ...current, date: event.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Início
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Clock4 className="h-5 w-5 text-slate-400" />
                    <input
                      type="time"
                      className="w-full bg-transparent text-base text-slate-700 outline-none"
                      value={newAppointment.startTime}
                      onChange={(event) =>
                        setNewAppointment((current) => ({ ...current, startTime: event.target.value }))
                      }
                    />
                  </div>
                </label>
                <label className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Término
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <Clock4 className="h-5 w-5 text-slate-400" />
                    <input
                      type="time"
                      className="w-full bg-transparent text-base text-slate-700 outline-none"
                      value={newAppointment.endTime}
                      onChange={(event) =>
                        setNewAppointment((current) => ({ ...current, endTime: event.target.value }))
                      }
                    />
                  </div>
                </label>
              </div>

              <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Observações
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Observações adicionais..."
                  value={newAppointment.notes}
                  onChange={(event) =>
                    setNewAppointment((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>
            </div>

            {createAppointmentError ? (
              <p className="px-8 pb-2 text-sm font-medium text-rose-600">{createAppointmentError}</p>
            ) : null}

            <div className="flex justify-end gap-3 px-8 pb-7">
              <button
                type="button"
                className="rounded-xl px-5 py-3 text-base font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-300/60 hover:bg-indigo-700"
                onClick={handleCreateAppointment}
              >
                Salvar Agendamento
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {statusNotification ? (
        <StatusNotification
          title={statusNotification.title}
          description={statusNotification.description}
          onClose={() => setStatusNotification(null)}
        />
      ) : null}
    </div>
  );
}
