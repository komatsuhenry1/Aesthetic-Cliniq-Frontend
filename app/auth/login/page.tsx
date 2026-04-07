"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ApiRequestError, type LoginResponse, loginRequest } from "@/services/api/auth";

function BrandIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-purple-500"
      fill="currentColor"
    >
      <path d="M10.6 2.4a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28zM4.4 8.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28H2.99a.75.75 0 0 1-.53-1.28zM16.6 8.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28zM10.6 14.6a.75.75 0 0 1 1.06 0l1.94 1.94a.75.75 0 0 1-.53 1.28h-3.88a.75.75 0 0 1-.53-1.28z" />
    </svg>
  );
}

function InputIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

function VisibilityIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a16.6 16.6 0 0 1-4.1 4.8" />
      <path d="M6.7 6.7C3.9 8.3 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.3-.9" />
    </svg>
  );
}

function getClinicNameFromLoginResponse(response: LoginResponse) {
  const nestedData = typeof response.data === "object" && response.data ? response.data : null;
  const nestedUser =
    nestedData && "user" in nestedData && typeof nestedData.user === "object" ? nestedData.user : null;

  const clinicNameCandidates = [
    response.clinicName,
    response.clinic?.name,
    response.user?.clinicName,
    response.user?.clinic?.name,
    nestedUser && "clinic" in nestedUser ? nestedUser.clinic : undefined,
  ];

  return clinicNameCandidates.find(
    (clinicName): clinicName is string => typeof clinicName === "string" && clinicName.trim().length > 0
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const router = useRouter();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailPattern.test(email.trim());
  const hasMinimumLength = password.length >= 6;
  const hasRequiredFields = email.trim().length > 0 && password.trim().length > 0;
  const canSubmit = hasRequiredFields && isEmailValid && hasMinimumLength;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setAuthError("");

    if (!canSubmit) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await loginRequest({
        email: email.trim(),
        password,
      });

      const token =
        (typeof response.data === "object" && response.data && "token" in response.data
          ? response.data.token
          : undefined) ?? response.token ?? response.accessToken;

      if (typeof token === "string" && token.trim().length > 0) {
        localStorage.setItem("token", token);
      }

      const clinicName = getClinicNameFromLoginResponse(response);
      if (clinicName) {
        localStorage.setItem("clinicName", clinicName);
      }

      if (rememberMe) {
        localStorage.setItem("rememberLoginEmail", email.trim());
      } else {
        localStorage.removeItem("rememberLoginEmail");
      }

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setAuthError(error.message);
      } else if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Nao foi possivel fazer login. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:gap-4 sm:px-6 sm:py-0">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BrandIcon />
            <span className="text-xl tracking-tight sm:text-2xl">Aesthetic Cliniq</span>
          </Link>
          <p className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 sm:justify-end sm:text-sm">
            Ainda não tem conta?{" "}
            <Link
              href="/auth/register"
              className="inline-flex rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-200 sm:px-5 sm:py-2"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl justify-center px-3 py-6 sm:px-6 sm:py-10 md:py-12">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] sm:rounded-3xl sm:p-8 md:p-9">
          <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Entrar na conta
          </h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500 sm:text-base md:text-lg">
            Acesse o painel da sua clínica com segurança.
          </p>

          <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 sm:text-base">
                E-mail
              </span>
              <div className="flex h-11 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 sm:h-12 sm:px-4">
                <InputIcon path="M4 6h16v12H4z M4 7l8 6 8-6" />
                <input
                  type="email"
                  placeholder="contato@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-full w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none sm:text-base"
                />
              </div>
              {(submitted || email.length > 0) && !isEmailValid && (
                <p className="mt-2 text-xs font-medium text-rose-600 sm:text-sm">
                  Digite um e-mail válido (exemplo@dominio.com)
                </p>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 sm:text-base">
                Senha
              </span>
              <div className="flex h-11 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 sm:h-12 sm:px-4">
                <InputIcon path="M6 10V7a6 6 0 0 1 12 0v3M5 10h14v11H5z" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  className="h-full w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="shrink-0 rounded-full p-1 transition hover:bg-slate-200"
                >
                  <VisibilityIcon visible={showPassword} />
                </button>
              </div>
              {(submitted || password.length > 0) && !hasMinimumLength && (
                <p className="mt-2 text-xs font-medium text-rose-600 sm:text-sm">
                  A senha deve ter no mínimo 6 caracteres
                </p>
              )}
            </label>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Lembrar de mim
              </label>
              <Link
                href="#"
                className="text-xs font-medium text-purple-600 hover:underline sm:text-sm"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-purple-500 text-base font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:h-12 sm:text-lg"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
            </button>
            {authError ? (
              <p className="text-center text-xs font-medium text-rose-600 sm:text-sm">{authError}</p>
            ) : null}
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500 sm:mt-8 sm:pt-6 sm:text-base">
            Não tem acesso ainda?{" "}
            <Link href="/auth/register" className="font-semibold text-purple-600 hover:underline">
              Criar uma conta
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 pb-4 text-center text-[11px] leading-relaxed tracking-[0.08em] text-slate-400 sm:text-sm sm:tracking-[0.18em]">
        © 2026 Aesthetic Cliniq - Software de gestão de clínicas
      </footer>
    </main>
  );
}
