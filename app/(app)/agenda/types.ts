export type AppointmentStatus =
  | "confirmado"
  | "pendente"
  | "em-andamento"
  | "concluido"
  | "bloqueado";

export type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  procedureValue?: string;
  notes?: string;
  professional: string;
  status: AppointmentStatus;
  badge?: string;
  paymentMethod?: string;
  installments?: string;
};

export type ViewMode = "day" | "week" | "month";

export type WeeklyEvent = {
  dayIndex: number;
  startTime: string;
  endTime: string;
  title: string;
  patient: string;
  professional: string;
  procedureValue?: string;
  notes?: string;
  status: AppointmentStatus;
  appointmentId?: string;
  canEditStatus?: boolean;
  paymentMethod?: string;
};

export type WeeklyEventLayout = WeeklyEvent & {
  overlapIndex: number;
  overlapCount: number;
};

export type AppointmentDetails = {
  appointmentId?: string;
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  procedureValue?: string;
  notes?: string;
  professional: string;
  status: AppointmentStatus;
  canEditStatus: boolean;
  paymentMethod?: string;
  installments?: string;
};

export type NewAppointmentForm = {
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  procedureValue: string;
  professional: string;
  status: AppointmentStatus;
  notes: string;
  paymentMethod: string;
  installments?: string;
};

export type EditAppointmentForm = {
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  procedureValue: string;
  notes: string;
  professional: string;
  paymentMethod: string;
  installments?: string;
};

export type DetailsTab = "status" | "estoque";

export type StockProduct = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  icon: string;
};

export type AgendaStatusNotification = {
  title: string;
  description: string;
};

export type AppointmentSeed = Omit<Appointment, "id">;
