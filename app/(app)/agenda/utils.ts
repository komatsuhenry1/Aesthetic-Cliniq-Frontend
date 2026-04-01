import type { Appointment, AppointmentStatus, ViewMode, WeeklyEvent, WeeklyEventLayout } from "./types";

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function appointmentStyles(status: Appointment["status"]) {
  if (status === "confirmado") {
    return "border-[#CCFFCC] border-l-4 border-l-[#2db32d] bg-[#CCFFCC] text-[#0f3d0f] shadow-sm";
  }

  if (status === "pendente") {
    return "border-[#FFFF99] border-l-4 border-l-[#c4c43a] bg-[#FFFF99] text-[#5a5a12] shadow-sm";
  }

  if (status === "em-andamento") {
    return "border-[#F0C6F7] border-l-4 border-l-[#B65AC8] bg-[#F0C6F7] text-[#4A1E52] shadow-sm";
  }

  if (status === "concluido") {
    return "border-[#CCFFFF] border-l-4 border-l-[#4bb7b7] bg-[#CCFFFF] text-[#114747] shadow-sm";
  }

  if (status === "bloqueado") {
    return "border-slate-300 border-l-4 border-l-slate-600 bg-slate-200 text-slate-800 shadow-sm";
  }

  return "border-slate-200 border-l-4 border-l-slate-500 bg-slate-100 text-slate-800 italic shadow-sm";
}

export function addDays(date: Date, days: number) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

export function addMonths(date: Date, months: number) {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

export function getStartOfWeek(date: Date) {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  newDate.setDate(newDate.getDate() + diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

export function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function addMinutesToTime(time: string, minutesToAdd: number) {
  const totalMinutes = parseTimeToMinutes(time) + minutesToAdd;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function computeDayEventLayout(events: WeeklyEvent[]): WeeklyEventLayout[] {
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

export function weekEventStyles(status: WeeklyEvent["status"]) {
  if (status === "confirmado") {
    return "border-[#CCFFCC] border-l-4 border-l-[#2db32d] bg-[#CCFFCC] text-[#0f3d0f] shadow-sm";
  }

  if (status === "pendente") {
    return "border-[#FFFF99] border-l-4 border-l-[#c4c43a] bg-[#FFFF99] text-[#5a5a12] shadow-sm";
  }

  if (status === "em-andamento") {
    return "border-[#F0C6F7] border-l-4 border-l-[#B65AC8] bg-[#F0C6F7] text-[#4A1E52] shadow-sm";
  }

  if (status === "concluido") {
    return "border-[#CCFFFF] border-l-4 border-l-[#4bb7b7] bg-[#CCFFFF] text-[#114747] shadow-sm";
  }

  if (status === "bloqueado") {
    return "border-slate-300 border-l-4 border-l-slate-600 bg-slate-100 text-slate-800 shadow-sm";
  }

  return "border-slate-200 border-l-4 border-l-slate-500 bg-slate-50 text-slate-800 shadow-sm";
}

export function viewModeButtonStyles(currentMode: ViewMode, buttonMode: ViewMode) {
  if (currentMode === buttonMode) {
    return "rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-purple-600 shadow-sm";
  }

  return "rounded-md px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700";
}

export function statusLabel(status: AppointmentStatus) {
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

  if (status === "bloqueado") {
    return "Bloqueado";
  }

  return "Pendente";
}

export function statusDotColor(status: AppointmentStatus) {
  if (status === "confirmado") {
    return "bg-[#2db32d]";
  }

  if (status === "pendente") {
    return "bg-[#c4c43a]";
  }

  if (status === "em-andamento") {
    return "bg-[#B65AC8]";
  }

  if (status === "concluido") {
    return "bg-[#4bb7b7]";
  }

  if (status === "bloqueado") {
    return "bg-slate-600";
  }

  return "bg-slate-400";
}

export function statusOptionButtonStyles(status: AppointmentStatus, currentStatus: AppointmentStatus) {
  if (status === currentStatus) {
    return "border-transparent bg-purple-50 text-purple-700 ring-1 ring-purple-200";
  }

  return "border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:bg-purple-50/50 hover:text-purple-700";
}

export function createAppointmentId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeProfessionalName(professional: string) {
  return professional.trim() || "Sem profissional";
}

export function parseCurrencyToCents(value: string) {
  const onlyDigits = value.replace(/\D/g, "");
  return onlyDigits ? Number(onlyDigits) : 0;
}

export function formatCurrencyInput(value: string) {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) {
    return "";
  }

  const cents = Number(onlyDigits);
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function paymentMethodLabel(method?: string) {
  if (!method) {
    return "Não informado";
  }

  if (method === "dinheiro") {
    return "Dinheiro";
  }

  if (method === "cartao_credito") {
    return "Cartão de Crédito";
  }

  if (method === "cartao_debito") {
    return "Cartão de Débito";
  }

  if (method === "pix") {
    return "PIX";
  }

  return method || "Não informado";
}
