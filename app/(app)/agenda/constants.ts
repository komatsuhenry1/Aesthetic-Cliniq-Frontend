import type { AppointmentStatus, StockProduct, WeeklyEvent } from "./types";

export const initialAppointments = [];

export const timeSlots = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minutes}`;
});
export const HOUR_ROW_HEIGHT = 80;
export const WEEK_START_HOUR = 0;
export const WEEK_END_HOUR = 24;
export const WEEK_ROW_HEIGHT = 140;
export const weekTimeSlots = Array.from(
  { length: WEEK_END_HOUR - WEEK_START_HOUR },
  (_, index) => `${String(WEEK_START_HOUR + index).padStart(2, "0")}:00`
);
export const weekDayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
export const monthDayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
export const appointmentStatusOptions: AppointmentStatus[] = [
  "confirmado",
  "pendente",
  "em-andamento",
  "concluido",
  "bloqueado",
];
export const professionalOptions = ["Dra. Ana Paula", "Dr. Ricardo", "Dra. Valeria", "Dra. Paula"];
export const procedureOptions = [
  "Limpeza de Pele",
  "Botox - Face",
  "Peeling",
  "Preenchimento Labial",
  "Avaliação Geral",
];
export const initialStockProducts: StockProduct[] = [
  { id: "luvas-descartaveis", name: "Luvas descartáveis", unit: "unidades", quantity: 150, icon: "🧤" },
  { id: "mascaras-descartaveis", name: "Máscaras descartáveis", unit: "unidades", quantity: 352, icon: "😷" },
  { id: "seringas-descartaveis", name: "Seringas descartáveis", unit: "unidades", quantity: 14, icon: "💉" },
];
export const weeklyEvents: WeeklyEvent[] = [];
