export type ProfessionalApiItem = {
  id: string;
  clinic_id?: string;
  user_id?: string | null;
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
  /** API: "active" | "inactive" */
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProfessionalsApiResponse = {
  data?: ProfessionalApiItem[] | null;
  message?: string;
  success?: boolean;
};

export type ProfessionalNamesApiResponse = {
  data?: Array<string | { name?: string | null }> | null;
  names?: string[] | null;
  message?: string;
  success?: boolean;
};

export type CreateProfessionalPayload = {
  name: string;
  specialty: string;
  phone: string;
  email: string;
};

export type ProfessionalListItem = {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  status: "ativo" | "inativo";
};

export type UpdateProfessionalPayload = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  status: "ativo" | "inativo";
};

import { apiRequestJson } from "@/services/api/client";

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
  return { Authorization: `Bearer ${cleanToken}` };
}

function formatPhoneBr(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function mapApiStatus(raw: string | undefined): "ativo" | "inativo" {
  const s = (raw ?? "active").toLowerCase().trim();
  if (s === "inactive" || s === "inativo") {
    return "inativo";
  }
  return "ativo";
}

function mapApiToListItem(item: ProfessionalApiItem): ProfessionalListItem {
  const phoneRaw = item.phone ?? "";
  return {
    id: item.id,
    name: item.name?.trim() || "Sem nome",
    specialty: item.specialty?.trim() || "Não informada",
    email: item.email?.trim() || "",
    phone: formatPhoneBr(phoneRaw),
    status: mapApiStatus(item.status),
  };
}

/**
 * Lista profissionais da clínica (GET /api/v1/user/professional/)
 */
export async function getProfessionals(): Promise<ProfessionalListItem[]> {
  const response = await apiRequestJson<ProfessionalsApiResponse>("/api/v1/professional/", {
    method: "GET",
    headers: getAuthHeader(),
  });
  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }
  return response.data.map(mapApiToListItem);
}

export async function getProfessionalNames(): Promise<string[]> {
  const response = await apiRequestJson<ProfessionalNamesApiResponse | string[]>(
    "/api/v1/professional/names-ids",
    {
      method: "GET",
      headers: getAuthHeader(),
    }
  );

  const rawNames = Array.isArray(response)
    ? response
    : Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.names)
        ? response.names
        : [];

  const normalized = rawNames
    .map((item) => (typeof item === "string" ? item : item?.name ?? ""))
    .map((name) => name.trim())
    .filter(Boolean);

  return Array.from(new Set(normalized)).sort((first, second) => first.localeCompare(second, "pt-BR"));
}

/**
 * Cria profissional (POST /api/v1/professional/)
 */
export async function createProfessional(
  payload: CreateProfessionalPayload
): Promise<{ message: string }> {
  const response = await apiRequestJson<ProfessionalsApiResponse>("/api/v1/professional/", {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify({
      name: payload.name.trim(),
      specialty: payload.specialty.trim(),
      phone: payload.phone.replace(/\D/g, ""),
      email: payload.email.trim(),
    }),
  });
  return {
    message:
      typeof response.message === "string" ? response.message : "Profissional criado com sucesso.",
  };
}

/**
 * Remove profissional (DELETE /api/v1/professional/{id})
 */
export async function deleteProfessional(professionalId: string): Promise<{ message: string }> {
  const id = encodeURIComponent(professionalId.trim());
  const response = await apiRequestJson<ProfessionalsApiResponse>(`/api/v1/professional/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  return {
    message:
      typeof response.message === "string" ? response.message : "Profissional deletado com sucesso.",
  };
}

/**
 * Atualiza profissional (PUT /api/v1/professional/{id})
 */
export async function updateProfessional(
  payload: UpdateProfessionalPayload
): Promise<{ message: string }> {
  const id = encodeURIComponent(payload.id.trim());
  const apiStatus = payload.status === "inativo" ? "inactive" : "active";

  const response = await apiRequestJson<ProfessionalsApiResponse>(`/api/v1/professional/${id}`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify({
      name: payload.name.trim(),
      specialty: payload.specialty.trim(),
      phone: payload.phone.replace(/\D/g, ""),
      email: payload.email.trim(),
      status: apiStatus,
    }),
  });

  return {
    message:
      typeof response.message === "string" ? response.message : "Profissional atualizado com sucesso.",
  };
}
