import type { AppointmentStatus } from "@/app/(app)/agenda/types";
import { apiRequestJson } from "@/services/api/client";

export type AppointmentApiItem = {
  /** API em snake_case */
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
  patient_name?: string;
  professional_name?: string;
  patient?: string;
  procedure: string;
  professional?: string;
  status: string;
  /** forma de pagamento vinda da API (snake_case ou camelCase) */
  payment_method?: string;
  paymentMethod?: string;
  /** valor em reais (ex.: 150) */
  price?: number;
  procedure_value?: number;
};

export type AppointmentApiResponse = {
  data?: AppointmentApiItem[];
  message?: string;
  success?: boolean;
};

export type AgendaAppointment = {
  id: string;
  /** data no formato YYYY-MM-DD */
  date: string;
  startTime: string;
  endTime: string;
  patient: string;
  procedure: string;
  professional: string;
  status: AppointmentStatus;
  /** valor exibido (ex.: "R$ 150,00"), vindo de price na API */
  procedureValue?: string;
  /** forma de pagamento já tratada para exibição (vinda de payment_method na API) */
  paymentMethod?: string;
};

export type MonthlyCountItem = {
  date: string;
  count: number;
};

export type MonthlyCountApiResponse = {
  data?: MonthlyCountItem[];
  message?: string;
  success?: boolean;
};

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const storedToken = window.localStorage.getItem("token");
  if (!storedToken) {
    return {};
  }

  const cleanToken = storedToken.replace(/^Bearer\s+/i, "").trim();
  if (!cleanToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${cleanToken}`,
  };
}

function extractDateAndTime(value: string | undefined | null): { date: string; time: string } {
  if (value == null || typeof value !== "string") {
    return { date: "", time: "" };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { date: "", time: "" };
  }
  const [datePart = "", timeWithZone = ""] = trimmed.split("T");
  const timePart = timeWithZone.slice(0, 5);
  return {
    date: datePart,
    time: timePart,
  };
}

function apiPriceToProcedureValue(item: AppointmentApiItem): string | undefined {
  const raw = item.price ?? item.procedure_value;
  if (raw == null) return undefined;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mapApiItemToAgendaAppointment(item: AppointmentApiItem, index: number): AgendaAppointment {
  const startIso = item.start_time ?? item.startTime;
  const endIso = item.end_time ?? item.endTime;
  const { date, time: startTime } = extractDateAndTime(startIso);
  const { time: endTime } = extractDateAndTime(endIso);

  const patientName = item.patient_name ?? item.patient ?? "";
  const professionalName = item.professional_name ?? item.professional ?? "";
  const procedureValue = apiPriceToProcedureValue(item);
  const rawPaymentMethod = item.payment_method ?? item.paymentMethod;
  const paymentMethod = typeof rawPaymentMethod === "string" ? rawPaymentMethod.trim() : "";

  return {
    id: `${date}-${startTime}-${patientName || "sem-paciente"}-${index}`,
    date,
    startTime,
    endTime,
    patient: patientName.trim() || "Paciente sem nome",
    procedure: item.procedure?.trim() || "Procedimento nao informado",
    professional: professionalName.trim() || "Sem profissional",
    status: item.status as AppointmentStatus,
    ...(procedureValue ? { procedureValue } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
  };
}

export async function getAppointmentsByWeek(startDate: string, endDate: string): Promise<AgendaAppointment[]> {
  const encodedStart = encodeURIComponent(startDate);
  const encodedEnd = encodeURIComponent(endDate);

  const response = await apiRequestJson<AppointmentApiResponse>(
    `/api/v1/appointment/week?start_date=${encodedStart}&end_date=${encodedEnd}`,
    {
      method: "GET",
      headers: getAuthHeader(),
    }
  );

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data.map(mapApiItemToAgendaAppointment);
}

export async function getAppointmentsByDate(date: string): Promise<AgendaAppointment[]> {
  const encodedDate = encodeURIComponent(date);
  const response = await apiRequestJson<AppointmentApiResponse>(`/api/v1/appointment/day?date=${encodedDate}`, {
    method: "GET",
    headers: getAuthHeader(),
  });

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data.map(mapApiItemToAgendaAppointment);
}

export async function getProfessionalAppointmentsByDate(
  date: string,
  professionalId: string
): Promise<AgendaAppointment[]> {
  const encodedDate = encodeURIComponent(date);
  const encodedId = encodeURIComponent(professionalId);
  const response = await apiRequestJson<AppointmentApiResponse>(
    `/api/v1/appointment/professional-day?date=${encodedDate}&professional_id=${encodedId}`,
    {
      method: "GET",
      headers: getAuthHeader(),
    }
  );

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data.map(mapApiItemToAgendaAppointment);
}

export async function getMonthlyAppointmentCount(month: string): Promise<MonthlyCountItem[]> {
  const encodedMonth = encodeURIComponent(month);
  const response = await apiRequestJson<MonthlyCountApiResponse>(
    `/api/v1/appointment/month-count?month=${encodedMonth}`,
    {
      method: "GET",
      headers: getAuthHeader(),
    }
  );

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data;
}

export async function getNextFiveAppointments(): Promise<AgendaAppointment[]> {
  const response = await apiRequestJson<AppointmentApiResponse>(`/api/v1/appointment/next-five`, {
    method: "GET",
    headers: getAuthHeader(),
  });

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data.map(mapApiItemToAgendaAppointment);
}

export type CreateAppointmentPayload = {
  client_id: string;
  professional_id: string;
  patient_name: string;
  professional_name: string;
  procedure: string;
  price: number;
  start_time: string;
  end_time: string;
  payment_method: string;
  notes?: string;
};

export async function createAppointment(payload: CreateAppointmentPayload): Promise<AppointmentApiResponse> {
  return await apiRequestJson<AppointmentApiResponse>(`/api/v1/appointment/`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(payload),
  });
}
