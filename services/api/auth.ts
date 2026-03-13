export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  clinic: string;
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginResponse = {
  accessToken?: string;
  token?: string;
  data?: {
    token?: string;
    user?: {
      email?: string;
      name?: string;
      clinic?: string;
      role?: string;
    };
  };
  clinicName?: string;
  clinic?: {
    id?: string;
    name?: string;
  };
  user?: {
    id?: string;
    name?: string;
    email?: string;
    clinicName?: string;
    clinic?: {
      id?: string;
      name?: string;
    };
  };
} & Record<string, unknown>;

export type RegisterResponse = {
  message?: string;
  clinicName?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
} & Record<string, unknown>;

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("Variavel NEXT_PUBLIC_API_URL nao configurada.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : "Nao foi possivel concluir a requisicao.";
    throw new ApiRequestError(message, response.status, data);
  }

  return data as T;
}

export async function loginRequest(payload: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerRequest(payload: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
