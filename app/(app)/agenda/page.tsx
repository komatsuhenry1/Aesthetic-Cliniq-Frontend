"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Clock4,
  UserSearch,
  UserIcon,
  X,
  ChartNoAxesColumn,
  CoinsIcon,
} from "lucide-react";
import { StatusNotification } from "@/components/status-notification";

type AppointmentStatus = "confirmado" | "pendente" | "em-andamento" | "concluido" | "bloqueio";
type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  procedureValue?: string;
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
  procedureValue?: string;
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
  procedureValue?: string;
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
  procedureValue: string;
  professional: string;
  status: AppointmentStatus;
  notes: string;
};
type EditAppointmentForm = {
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  procedureValue: string;
  professional: string;
};
type DetailsTab = "status" | "estoque";
type StockProduct = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  icon: string;
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
const WEEK_ROW_HEIGHT = 140;
const weekTimeSlots = Array.from(
  { length: WEEK_END_HOUR - WEEK_START_HOUR },
  (_, index) => `${String(WEEK_START_HOUR + index).padStart(2, "0")}:00`
);
const weekDayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
const monthDayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const appointmentStatusOptions: AppointmentStatus[] = [
  "confirmado",
  "pendente",
  "em-andamento",
  "concluido",
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
const initialStockProducts: StockProduct[] = [
  { id: "luvas-descartaveis", name: "Luvas descartáveis", unit: "unidades", quantity: 150, icon: "🧤" },
  { id: "mascaras-descartaveis", name: "Máscaras descartáveis", unit: "unidades", quantity: 352, icon: "😷" },
  { id: "seringas-descartaveis", name: "Seringas descartáveis", unit: "unidades", quantity: 14, icon: "💉" },
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
    return "border-emerald-300 border-l-4 border-l-emerald-600 bg-emerald-200 text-emerald-950 shadow-sm";
  }

  if (status === "pendente") {
    return "border-amber-300 border-l-4 border-l-amber-600 bg-amber-200 text-amber-950 shadow-sm";
  }

  if (status === "em-andamento") {
    return "border-indigo-300 border-l-4 border-l-indigo-600 bg-indigo-200 text-indigo-950 shadow-sm";
  }

  if (status === "concluido") {
    return "border-cyan-300 border-l-4 border-l-cyan-600 bg-cyan-200 text-cyan-950 shadow-sm";
  }

  return "border-slate-300 border-l-4 border-l-slate-600 bg-slate-200 text-slate-900 italic shadow-sm";
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

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
    return "border-emerald-300 border-l-4 border-l-emerald-600 bg-emerald-200 text-emerald-950 shadow-sm";
  }

  if (status === "pendente") {
    return "border-rose-300 border-l-4 border-l-rose-600 bg-rose-200 text-rose-950 shadow-sm";
  }

  if (status === "em-andamento") {
    return "border-indigo-300 border-l-4 border-l-indigo-600 bg-indigo-200 text-indigo-950 shadow-sm";
  }

  if (status === "concluido") {
    return "border-cyan-300 border-l-4 border-l-cyan-600 bg-cyan-200 text-cyan-950 shadow-sm";
  }

  return "border-slate-300 border-l-4 border-l-slate-600 bg-slate-200 text-slate-900 shadow-sm";
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

  if (status === "concluido") {
    return "Concluído";
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

  if (status === "concluido") {
    return "bg-cyan-500";
  }

  return "bg-slate-400";
}

function statusOptionButtonStyles(status: AppointmentStatus, currentStatus: AppointmentStatus) {
  if (status === currentStatus) {
    return "border-transparent bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
  }

  return "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700";
}

function createAppointmentId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProfessionalName(professional: string) {
  return professional.trim() || "Sem profissional";
}

function parseCurrencyToCents(value: string) {
  const onlyDigits = value.replace(/\D/g, "");
  return onlyDigits ? Number(onlyDigits) : 0;
}

function formatCurrencyInput(value: string) {
  const cents = parseCurrencyToCents(value);

  if (cents <= 0) {
    return "";
  }

  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
  const [detailsTab, setDetailsTab] = useState<DetailsTab>("status");
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editAppointmentError, setEditAppointmentError] = useState("");
  const [editAppointment, setEditAppointment] = useState<EditAppointmentForm>({
    date: "",
    startTime: "",
    endTime: "",
    patient: "",
    procedure: "",
    procedureValue: "",
    professional: "",
  });
  const [stockProducts, setStockProducts] = useState<StockProduct[]>(initialStockProducts);
  const [appointmentStockUsage, setAppointmentStockUsage] = useState<Record<string, Record<string, number>>>(
    {}
  );
  const [stockDraftByProductId, setStockDraftByProductId] = useState<Record<string, string>>({});
  const [stockControlError, setStockControlError] = useState("");
  const [statusNotification, setStatusNotification] = useState<StatusNotification | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfessionalFilterOpen, setIsProfessionalFilterOpen] = useState(false);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [newAppointment, setNewAppointment] = useState<NewAppointmentForm>(() => ({
    date: "",
    startTime: "",
    endTime: "",
    patient: "",
    procedure: "",
    procedureValue: "",
    professional: "",
    status: "confirmado",
    notes: "",
  }));
  const [createAppointmentError, setCreateAppointmentError] = useState("");
  const scheduleScrollRef = useRef<HTMLDivElement | null>(null);
  const weekScheduleScrollRef = useRef<HTMLDivElement | null>(null);
  const professionalsFilterRef = useRef<HTMLDivElement | null>(null);
  const availableProfessionals = useMemo(() => {
    const professionals = new Set<string>();

    appointmentList.forEach((appointment) => {
      professionals.add(normalizeProfessionalName(appointment.professional));
    });

    weeklyEvents.forEach((event) => {
      professionals.add(normalizeProfessionalName(event.professional));
    });

    return Array.from(professionals).sort((first, second) => first.localeCompare(second, "pt-BR"));
  }, [appointmentList]);
  const filteredAppointmentList = useMemo(
    () =>
      appointmentList.filter((appointment) => {
        if (selectedProfessionals.length === 0) {
          return true;
        }

        return selectedProfessionals.includes(normalizeProfessionalName(appointment.professional));
      }),
    [appointmentList, selectedProfessionals]
  );
  const filteredWeeklyBaseEvents = useMemo(
    () =>
      weeklyEvents.filter((event) => {
        if (selectedProfessionals.length === 0) {
          return true;
        }

        return selectedProfessionals.includes(normalizeProfessionalName(event.professional));
      }),
    [selectedProfessionals]
  );
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const weekStartDate = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);
  const weekEndDate = useMemo(() => addDays(weekStartDate, 6), [weekStartDate]);
  const monthStartDate = useMemo(() => getStartOfMonth(selectedDate), [selectedDate]);
  const monthEndDate = useMemo(() => getEndOfMonth(selectedDate), [selectedDate]);
  const monthGridDays = useMemo(() => {
    const firstGridDay = addDays(monthStartDate, -monthStartDate.getDay());
    const lastGridDay = addDays(monthEndDate, 6 - monthEndDate.getDay());
    const days: Date[] = [];

    for (
      let cursorDate = new Date(firstGridDay);
      cursorDate <= lastGridDay;
      cursorDate = addDays(cursorDate, 1)
    ) {
      days.push(new Date(cursorDate));
    }

    return days;
  }, [monthStartDate, monthEndDate]);
  const monthlyAppointmentsByDate = useMemo(() => {
    return filteredAppointmentList.reduce<Record<string, Appointment[]>>((accumulator, appointment) => {
      if (!accumulator[appointment.date]) {
        accumulator[appointment.date] = [];
      }
      accumulator[appointment.date].push(appointment);
      return accumulator;
    }, {});
  }, [filteredAppointmentList]);
  const selectedMonthAppointments = useMemo(
    () =>
      filteredAppointmentList.filter((appointment) => {
        const appointmentDate = new Date(`${appointment.date}T00:00:00`);
        return (
          appointmentDate.getFullYear() === monthStartDate.getFullYear() &&
          appointmentDate.getMonth() === monthStartDate.getMonth()
        );
      }),
    [filteredAppointmentList, monthStartDate]
  );
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
    () => filteredAppointmentList.filter((appointment) => appointment.date === selectedDateKey),
    [filteredAppointmentList, selectedDateKey]
  );
  const selectedWeekAppointments = useMemo(
    () =>
      filteredAppointmentList
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
            professional: normalizeProfessionalName(appointment.professional),
            procedureValue: appointment.procedureValue,
            status: appointment.status,
            appointmentId: appointment.id,
            canEditStatus: true,
          };
        })
        .filter((event): event is WeeklyEvent => event !== null),
    [filteredAppointmentList, weekStartDate]
  );
  const selectedWeekEvents = useMemo(
    () => [...filteredWeeklyBaseEvents, ...selectedWeekAppointments],
    [filteredWeeklyBaseEvents, selectedWeekAppointments]
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
      return `${selectedMonthAppointments.length} agendamento(s) neste mês`;
    }

    return `${selectedDateAppointments.length} agendamento(s) para este dia`;
  }, [viewMode, selectedWeekEvents.length, selectedDateAppointments.length, selectedMonthAppointments.length]);

  const disableTodayButton =
    viewMode === "day" ? isSelectedDateToday : viewMode === "week" ? isSelectedWeekCurrent : false;
  const selectedAppointmentStockUsage = useMemo(() => {
    if (!selectedAppointmentDetails?.appointmentId) {
      return {};
    }

    return appointmentStockUsage[selectedAppointmentDetails.appointmentId] ?? {};
  }, [appointmentStockUsage, selectedAppointmentDetails?.appointmentId]);
  const selectedStockItemsCount = useMemo(
    () =>
      Object.values(stockDraftByProductId).filter((quantity) => Number(quantity) > 0).length,
    [stockDraftByProductId]
  );

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
      date: "",
      startTime: "",
      endTime: "",
      patient: "",
      procedure: "",
      procedureValue: "",
      professional: "",
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

    if (parseCurrencyToCents(newAppointment.procedureValue) <= 0) {
      setCreateAppointmentError("Informe um valor válido para o procedimento.");
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
        procedureValue: newAppointment.procedureValue,
        professional: newAppointment.professional.trim(),
        status: newAppointment.status,
      },
    ]);
    setIsCreateModalOpen(false);
  }

  function openAppointmentDetails(details: AppointmentDetails) {
    const savedUsage = details.appointmentId ? appointmentStockUsage[details.appointmentId] : undefined;

    setSelectedAppointmentDetails(details);
    setEditableStatus(details.status);
    setDetailsTab("status");
    setIsEditingAppointment(false);
    setEditAppointmentError("");
    setStockControlError("");
    setStockDraftByProductId(
      savedUsage
        ? Object.fromEntries(
            Object.entries(savedUsage).map(([productId, quantity]) => [productId, String(quantity)])
          )
        : {}
    );
    setEditAppointment({
      date: details.date,
      startTime: details.startTime,
      endTime: details.endTime,
      patient: details.patient,
      procedure: details.procedure,
      procedureValue: details.procedureValue || "",
      professional: details.professional,
    });
  }

  function handleOpenEditAppointment() {
    if (!selectedAppointmentDetails?.appointmentId || !selectedAppointmentDetails.canEditStatus) {
      return;
    }

    setIsEditingAppointment(true);
    setEditAppointmentError("");
    setEditAppointment({
      date: selectedAppointmentDetails.date,
      startTime: selectedAppointmentDetails.startTime,
      endTime: selectedAppointmentDetails.endTime,
      patient: selectedAppointmentDetails.patient,
      procedure: selectedAppointmentDetails.procedure,
      procedureValue: selectedAppointmentDetails.procedureValue || "",
      professional: selectedAppointmentDetails.professional,
    });
  }

  function handleSaveEditedAppointment() {
    if (!selectedAppointmentDetails?.appointmentId || !selectedAppointmentDetails.canEditStatus) {
      return;
    }

    if (!editAppointment.patient.trim() || !editAppointment.procedure.trim()) {
      setEditAppointmentError("Preencha paciente e procedimento.");
      return;
    }

    if (parseCurrencyToCents(editAppointment.procedureValue) <= 0) {
      setEditAppointmentError("Informe um valor válido para o procedimento.");
      return;
    }

    if (parseTimeToMinutes(editAppointment.endTime) <= parseTimeToMinutes(editAppointment.startTime)) {
      setEditAppointmentError("O horário final precisa ser maior que o inicial.");
      return;
    }

    const updatedPatientName = editAppointment.patient.trim();

    setAppointmentList((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === selectedAppointmentDetails.appointmentId
          ? {
              ...appointment,
              date: editAppointment.date,
              startTime: editAppointment.startTime,
              endTime: editAppointment.endTime,
              patient: updatedPatientName,
              procedure: editAppointment.procedure.trim(),
              procedureValue: editAppointment.procedureValue,
              professional: editAppointment.professional.trim(),
            }
          : appointment
      )
    );
    setSelectedAppointmentDetails((currentDetails) =>
      currentDetails
        ? {
            ...currentDetails,
            date: editAppointment.date,
            startTime: editAppointment.startTime,
            endTime: editAppointment.endTime,
            patient: updatedPatientName,
            procedure: editAppointment.procedure.trim(),
            procedureValue: editAppointment.procedureValue,
            professional: editAppointment.professional.trim(),
          }
        : currentDetails
    );
    setIsEditingAppointment(false);
    setEditAppointmentError("");
    setStatusNotification({
      title: "Agendamento atualizado",
      description: `Os dados de ${updatedPatientName} foram atualizados com sucesso.`,
    });
  }

  function handleStockDraftChange(productId: string, value: string) {
    const numericValue = value.replace(/\D/g, "");
    setStockControlError("");

    if (!numericValue) {
      setStockDraftByProductId((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
      return;
    }

    setStockDraftByProductId((current) => ({
      ...current,
      [productId]: numericValue,
    }));
  }

  function handleUpdateAppointmentStatus() {
    if (!selectedAppointmentDetails?.canEditStatus || !selectedAppointmentDetails.appointmentId) {
      return;
    }

    const appointmentId = selectedAppointmentDetails.appointmentId;
    const previousUsage = appointmentStockUsage[appointmentId] ?? {};

    if (editableStatus === "concluido") {
      const selectedStockItems = Object.entries(stockDraftByProductId)
        .map(([productId, quantity]) => ({
          productId,
          quantity: Number(quantity),
        }))
        .filter((item) => item.quantity > 0);

      if (selectedStockItems.length === 0) {
        setDetailsTab("estoque");
        setStockControlError("Selecione ao menos um produto e a quantidade para concluir.");
        return;
      }

      for (const item of selectedStockItems) {
        const product = stockProducts.find((stockItem) => stockItem.id === item.productId);
        if (!product) {
          continue;
        }

        const availableForThisAppointment = product.quantity + (previousUsage[item.productId] ?? 0);
        if (item.quantity > availableForThisAppointment) {
          setDetailsTab("estoque");
          setStockControlError(
            `Quantidade inválida para ${product.name}. Disponível: ${availableForThisAppointment} ${product.unit}.`
          );
          return;
        }
      }

      setStockProducts((currentProducts) =>
        currentProducts.map((product) => {
          const newQuantity = Number(stockDraftByProductId[product.id] ?? 0);
          const oldQuantity = previousUsage[product.id] ?? 0;
          const delta = newQuantity - oldQuantity;
          return { ...product, quantity: product.quantity - delta };
        })
      );
      setAppointmentStockUsage((currentUsage) => ({
        ...currentUsage,
        [appointmentId]: Object.fromEntries(
          selectedStockItems.map((item) => [item.productId, item.quantity])
        ),
      }));
      setStockControlError("");
    } else if (Object.keys(previousUsage).length > 0) {
      setStockProducts((currentProducts) =>
        currentProducts.map((product) => ({
          ...product,
          quantity: product.quantity + (previousUsage[product.id] ?? 0),
        }))
      );
      setAppointmentStockUsage((currentUsage) => {
        const nextUsage = { ...currentUsage };
        delete nextUsage[appointmentId];
        return nextUsage;
      });
      setStockControlError("");
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

  useEffect(() => {
    if (!isProfessionalFilterOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        professionalsFilterRef.current &&
        !professionalsFilterRef.current.contains(event.target as Node)
      ) {
        setIsProfessionalFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfessionalFilterOpen]);

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

            <div className="relative" ref={professionalsFilterRef}>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"
                onClick={() => setIsProfessionalFilterOpen((current) => !current)}
                aria-expanded={isProfessionalFilterOpen}
                aria-haspopup="dialog"
              >
                <UserSearch className="h-4 w-4" />
                {selectedProfessionals.length === 0
                  ? "Profissionais"
                  : `${selectedProfessionals.length} profissional(is)`}
              </button>
              {isProfessionalFilterOpen ? (
                <div className="absolute right-0 top-12 z-40 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Filtrar profissionais
                  </p>
                  <button
                    type="button"
                    className={`mb-2 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${
                      selectedProfessionals.length === 0
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedProfessionals([])}
                  >
                    Todos
                    {selectedProfessionals.length === 0 ? (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Ativo</span>
                    ) : null}
                  </button>
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {availableProfessionals.map((professional) => {
                      const isSelected = selectedProfessionals.includes(professional);

                      return (
                        <label
                          key={professional}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedProfessionals((current) =>
                                current.includes(professional)
                                  ? current.filter((item) => item !== professional)
                                  : [...current, professional]
                              )
                            }
                          />
                          <span className="truncate">{professional}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 font-semibold bg-gray-100 px-3 py-1 text-gray-800">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            Concluído
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
                                procedureValue: appointment.procedureValue,
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
                                    procedureValue: event.procedureValue,
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
          <div className="overflow-x-auto">
            <div className="min-w-[1080px] overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid grid-cols-7 bg-slate-50/90">
                {monthDayLabels.map((label) => (
                  <div
                    key={label}
                    className="border-b border-r border-slate-200 px-3 py-3 text-center text-xs font-semibold tracking-[0.08em] text-slate-400 last:border-r-0"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthGridDays.map((day) => {
                  const dayKey = toDateKey(day);
                  const dayAppointments = monthlyAppointmentsByDate[dayKey] ?? [];
                  const isToday = dayKey === todayKey;
                  const isOutsideCurrentMonth = day.getMonth() !== monthStartDate.getMonth();
                  const isSelectedDay = dayKey === selectedDateKey;

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      className={`flex min-h-[128px] flex-col items-start justify-start border-b border-r border-slate-200 px-2.5 py-2 text-left align-top transition hover:bg-slate-50 ${
                        isOutsideCurrentMonth ? "bg-slate-50/70" : "bg-white"
                      } ${isSelectedDay ? "ring-1 ring-inset ring-indigo-200" : ""}`}
                      onClick={() => {
                        setSelectedDate(day);
                        setViewMode("day");
                      }}
                    >
                      <p
                        className={`mb-1.5 text-sm font-semibold ${
                          isToday
                            ? "text-indigo-600 underline underline-offset-2"
                            : isOutsideCurrentMonth
                              ? "text-slate-300"
                              : "text-slate-700"
                        }`}
                      >
                        {String(day.getDate()).padStart(2, "0")}
                      </p>

                      {dayAppointments.length > 0 ? (
                        <span className="mt-1.5 flex h-5 items-center rounded bg-indigo-100 px-2 text-[11px] font-medium text-indigo-700">
                          {dayAppointments.length}{" "}
                          {dayAppointments.length === 1 ? "agendamento" : "agendamentos"}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
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
              {isEditingAppointment ? (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Editar agendamento
                  </p>
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Cliente
                      <input
                        type="text"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                        value={editAppointment.patient}
                        onChange={(event) =>
                          setEditAppointment((current) => ({ ...current, patient: event.target.value }))
                        }
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Procedimento
                        <select
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.procedure}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, procedure: event.target.value }))
                          }
                        >
                          {procedureOptions.map((procedure) => (
                            <option key={procedure} value={procedure}>
                              {procedure}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Profissional
                        <select
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.professional}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, professional: event.target.value }))
                          }
                        >
                          {professionalOptions.map((professional) => (
                            <option key={professional} value={professional}>
                              {professional}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Valor do procedimento
                      <input
                        type="text"
                        inputMode="numeric"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                        placeholder="R$ 0,00"
                        value={editAppointment.procedureValue}
                        onChange={(event) =>
                          setEditAppointment((current) => ({
                            ...current,
                            procedureValue: formatCurrencyInput(event.target.value),
                          }))
                        }
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Data
                        <input
                          type="date"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.date}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, date: event.target.value }))
                          }
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Início
                        <input
                          type="time"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.startTime}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, startTime: event.target.value }))
                          }
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Término
                        <input
                          type="time"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                          value={editAppointment.endTime}
                          onChange={(event) =>
                            setEditAppointment((current) => ({ ...current, endTime: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : detailsTab === "status" ? (
                <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                  <p className="text-lg font-bold text-slate-800">{selectedAppointmentDetails.patient}</p>
                  <p className="mt-1 text-sm text-blue-700">{selectedAppointmentDetails.procedure}</p>
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  className={`w-1/2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    detailsTab === "status"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setDetailsTab("status")}
                >
                  Status
                </button>
                <button
                  type="button"
                  className={`w-1/2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    detailsTab === "estoque"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setDetailsTab("estoque")}
                >
                  Estoque {selectedStockItemsCount > 0 ? `(${selectedStockItemsCount})` : ""}
                </button>
              </div>

              {detailsTab === "status" ? (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Informações da sessão
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="flex justify-between gap-3">
                    <span className="text-slate-500 flex items-center gap-2"> <CalendarIcon className="h-4 w-4 text-blue-600" />Data</span>
                    <span className="font-semibold text-slate-800">{selectedAppointmentDetails.date}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="text-slate-500 flex items-center gap-2"> <Clock3 className="h-4 w-4 text-blue-600" />Horário</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAppointmentDetails.startTime} - {selectedAppointmentDetails.endTime}
                    </span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="text-slate-500 flex items-center gap-2"> <UserIcon className="h-4 w-4 text-blue-600" />Profissional</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAppointmentDetails.professional || "Não informado"}
                    </span>
                  </p>
                  <p className="flex justify-between gap-3">
                    
                    <span className="text-slate-500 flex items-center gap-2"> <CoinsIcon className="h-4 w-4 text-blue-600" />Valor</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAppointmentDetails.procedureValue || "Não informado"}
                    </span>
                  </p>
                </div>
                </div>
              ) : null}

              {detailsTab === "status" ? (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <ChartNoAxesColumn className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Status</p>
                  </div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDotColor(editableStatus)}`} />
                    {statusLabel(editableStatus)}
                  </div>
                  {selectedAppointmentDetails.canEditStatus ? (
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      {appointmentStatusOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${statusOptionButtonStyles(
                            status,
                            editableStatus
                          )}`}
                          onClick={() => {
                            setEditableStatus(status);
                            setStockControlError("");
                            if (status === "concluido") {
                              setDetailsTab("estoque");
                            }
                          }}
                          aria-pressed={editableStatus === status}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${statusDotColor(status)}`} />
                          {statusLabel(status)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-900">
                      {statusLabel(selectedAppointmentDetails.status)}
                    </p>
                  )}
                  {!selectedAppointmentDetails.canEditStatus ? (
                    <p className="mt-2 text-xs text-blue-700">Este atendimento é apenas visualização.</p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-4 border-b border-slate-100 pb-4">
                    <h4 className="text-2xl font-bold text-slate-800">Controle de estoque</h4>
                    <p className="mt-1 text-base text-slate-500">
                      Registre os itens utilizados neste atendimento
                    </p>
                  </div>
                  <div className="space-y-3">
                    {stockProducts.map((product) => {
                      const availableForThisAppointment =
                        product.quantity + (selectedAppointmentStockUsage[product.id] ?? 0);
                      const currentQuantity = stockDraftByProductId[product.id] ?? "";
                      const isSelected = Number(currentQuantity) > 0;

                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-sm text-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                              {product.icon}
                            </div>
                            <div>
                              <p className="text-base font-semibold text-slate-900">{product.name}</p>
                              <p className="text-sm text-slate-500">
                                {availableForThisAppointment} {product.unit} | {Number(currentQuantity || 0)} un.
                                utilizados
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
                              onClick={() => {
                                const currentValue = Number(currentQuantity || 0);
                                const nextValue = Math.max(0, currentValue - 1);
                                handleStockDraftChange(product.id, nextValue > 0 ? String(nextValue) : "");
                              }}
                            >
                              -
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="w-12 bg-transparent text-center text-xl font-semibold text-slate-800 outline-none"
                              value={currentQuantity || 0}
                              onChange={(event) => handleStockDraftChange(product.id, event.target.value)}
                            />
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
                              onClick={() => {
                                const currentValue = Number(currentQuantity || 0);
                                const nextValue = Math.min(availableForThisAppointment, currentValue + 1);
                                handleStockDraftChange(product.id, String(nextValue));
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Ao salvar como concluído, o estoque será baixado conforme os itens selecionados.
                  </p>
                </div>
              )}
            </div>

            {editAppointmentError ? (
              <p className="px-5 pb-1 text-sm font-medium text-rose-600">{editAppointmentError}</p>
            ) : null}
            {stockControlError ? (
              <p className="px-5 pb-1 text-sm font-medium text-rose-600">{stockControlError}</p>
            ) : null}

            <div className="flex gap-2 border-t border-blue-100 bg-white px-5 py-4">
            {selectedAppointmentDetails.canEditStatus && !isEditingAppointment ? (
                <button
                  type="button"
                  className="flex-1 rounded-lg border bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  onClick={handleUpdateAppointmentStatus}
                >
                  Salvar
                </button>
              ) : null}
              {selectedAppointmentDetails.canEditStatus && !isEditingAppointment ? (
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={handleOpenEditAppointment}
                >
                  Editar agendamento
                </button>
              ) : null}
              {selectedAppointmentDetails.canEditStatus && isEditingAppointment ? (
                <>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    onClick={handleSaveEditedAppointment}
                  >
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => {
                      setIsEditingAppointment(false);
                      setEditAppointmentError("");
                    }}
                  >
                    Cancelar edição
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-xl flex-col border-l border-indigo-100 bg-white shadow-2xl shadow-indigo-200/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-2xl font-bold text-slate-800">Novo Agendamento</h3>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Fechar painel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 px-5 py-5">
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

              <label className="block text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                Valor do procedimento
                <input
                  type="text"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="R$ 0,00"
                  value={newAppointment.procedureValue}
                  onChange={(event) =>
                    setNewAppointment((current) => ({
                      ...current,
                      procedureValue: formatCurrencyInput(event.target.value),
                    }))
                  }
                />
              </label>

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
              <p className="px-5 pb-2 text-sm font-medium text-rose-600">{createAppointmentError}</p>
            ) : null}

            <div className="flex gap-3 border-t border-indigo-100 bg-white px-5 py-4">
              <button
                type="button"
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                onClick={handleCreateAppointment}
              >
                Salvar Agendamento
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
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
