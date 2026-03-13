import { ApiRequestError } from "@/services/api/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** GETs idênticos em voo viram uma única requisição (menos 429 ao remount / troca rápida). */
const inflightGet = new Map<string, Promise<Response>>();

function inflightKey(path: string, init: RequestInit): string {
  return `${init.method ?? "GET"} ${path}`;
}

function parseRetryAfterMs(response: Response): number | null {
  const raw = response.headers.get("Retry-After");
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(n * 1000, 60_000);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch com:
 * - deduplicação de GET (mesma URL + método enquanto pendente)
 * - até 4 tentativas em 429, com espera (Retry-After ou backoff exponencial)
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!API_BASE_URL) {
    throw new Error("Variavel NEXT_PUBLIC_API_URL nao configurada.");
  }

  const method = (init.method ?? "GET").toUpperCase();
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body != null) {
    headers.set("Content-Type", "application/json");
  }

  const exec = async (): Promise<Response> => {
    const maxAttempts = 4;
    let attempt = 0;
    while (true) {
      const response = await fetch(url, { ...init, method, headers });
      if (response.status === 429 && attempt < maxAttempts - 1) {
        attempt += 1;
        const fromHeader = parseRetryAfterMs(response);
        const backoff = Math.min(1500 * 2 ** (attempt - 1), 12_000);
        const waitMs = fromHeader ?? backoff;
        await sleep(waitMs);
        continue;
      }
      return response;
    }
  };

  if (method === "GET") {
    const key = inflightKey(path, { method: "GET" });
    const existing = inflightGet.get(key);
    if (existing) {
      return existing.then((r) => r.clone());
    }
    const p = exec().finally(() => {
      inflightGet.delete(key);
    });
    inflightGet.set(key, p);
    return p.then((r) => r.clone());
  }

  return exec();
}

export async function apiRequestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : response.status === 429
          ? "Muitas requisições. Aguarde um instante e tente de novo."
          : "Nao foi possivel concluir a requisicao.";
    throw new ApiRequestError(message, response.status, data);
  }

  return data as T;
}

export { API_BASE_URL };
