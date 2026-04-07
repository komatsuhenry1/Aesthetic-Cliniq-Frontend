"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, Building2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ApiRequestError, registerRequest } from "@/services/api/auth";

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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigits = phone.replace(/\D/g, "");
  const isEmailValid = emailPattern.test(email.trim());
  const isPhoneValid = phoneDigits.length >= 10 && phoneDigits.length <= 11;
  const hasRequiredFields =
    clinicName.trim().length > 0 &&
    ownerName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    acceptedTerms;
  const hasMinimumLength = password.length >= 6;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit =
    hasRequiredFields && hasMinimumLength && passwordsMatch && isEmailValid && isPhoneValid;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setAuthError("");
    setSuccessMessage("");

    if (!canSubmit) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await registerRequest({
        clinic: clinicName.trim(),
        name: ownerName.trim(),
        email: email.trim(),
        phone: phoneDigits,
        password
      });

      localStorage.setItem("clinicName", response.clinicName || clinicName.trim());
      setSuccessMessage(response.message || "Cadastro realizado com sucesso. Redirecionando para login...");
      window.setTimeout(() => {
        router.push("/auth/login");
      }, 900);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setAuthError(error.message);
      } else if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Nao foi possivel concluir o cadastro. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    const numericOnly = event.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(numericOnly);
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
            Já tem uma conta?{" "}
            <Link
              href="/auth/login"
              className="inline-flex rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-200 sm:px-5 sm:py-2"
            >
              Login
            </Link>
          </p>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl justify-center px-3 py-6 sm:px-6 sm:py-10 md:py-12">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] sm:rounded-3xl sm:p-8 md:p-9">
          <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Criar sua conta
          </h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500 sm:text-base md:text-lg">
            Comece a gerenciar sua clínica grátis com excelência hoje mesmo.
          </p>

          <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 sm:text-base">
                Nome da Clínica
              </span>
              <div className="flex h-11 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 sm:h-12 sm:px-4">
                <Building2Icon className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: Clínica Bella Face"
                  value={clinicName}
                  onChange={(event) => setClinicName(event.target.value)}
                  required
                  className="h-full w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none sm:text-base"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 sm:text-base">
                Responsável
              </span>
              <div className="flex h-11 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 sm:h-12 sm:px-4">
                <InputIcon path="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                <input
                  type="text"
                  placeholder="Nome completo do responsável"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  required
                  className="h-full w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none sm:text-base"
                />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  Telefone
                </span>
                <div className="flex h-11 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 sm:h-12 sm:px-4">
                  <InputIcon path="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.33 1.77.63 2.61a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6.27 6.27l1.29-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.61.63A2 2 0 0 1 22 16.92z" />
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={handlePhoneChange}
                    inputMode="numeric"
                    maxLength={11}
                    required
                    className="h-full w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none sm:text-base"
                  />
                </div>
                {(submitted || phone.length > 0) && !isPhoneValid && (
                  <p className="mt-2 text-xs font-medium text-rose-600 sm:text-sm">
                    Digite um telefone válido com DDD (10 ou 11 dígitos)
                  </p>
                )}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
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
                </label>
                <div className="mt-3 space-y-1">
                <div className="grid grid-cols-4 gap-1">
                  <span
                    className={`h-1.5 rounded-full ${
                      password.length >= 1 ? "bg-purple-500" : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`h-1.5 rounded-full ${
                      password.length >= 3 ? "bg-purple-500" : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`h-1.5 rounded-full ${
                      password.length >= 6 ? "bg-purple-400" : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`h-1.5 rounded-full ${
                      password.length >= 10 ? "bg-purple-300" : "bg-slate-200"
                    }`}
                  />
                </div>
                {(submitted || password.length > 0) && (
                  <p
                    className={`text-xs font-medium sm:text-sm ${
                      hasMinimumLength ? "text-purple-600" : "text-rose-600"
                    }`}
                  >
                    {hasMinimumLength
                      ? "Senha válida (mínimo de 6 caracteres)"
                      : "A senha deve ter no mínimo 6 caracteres"}
                  </p>
                )}
                </div>
              </div>

              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 sm:text-base">
                    Confirmar Senha
                  </span>
                  <div className="flex h-11 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 sm:h-12 sm:px-4">
                    <InputIcon path="M9 12l2 2 4-4M6 10V7a6 6 0 0 1 12 0v3M5 10h14v11H5z" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      className="h-full w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar confirmação de senha"
                          : "Mostrar confirmação de senha"
                      }
                      className="shrink-0 rounded-full p-1 transition hover:bg-slate-200"
                    >
                      <VisibilityIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                </label>
                {(submitted || confirmPassword.length > 0) && (
                  <p
                    className={`mt-3 text-xs font-medium sm:mt-4 sm:text-sm ${
                      passwordsMatch ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {passwordsMatch
                      ? "As senhas coincidem"
                      : "As senhas precisam ser iguais"}
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-start gap-3 pt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span>
                Concordo com os{" "}
                <Link href="#" className="font-semibold text-purple-600 hover:underline">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link href="#" className="font-semibold text-purple-600 hover:underline">
                  Política de Privacidade
                </Link>{" "}
                da plataforma.
              </span>
            </label>

            <button
              type="submit"
              className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-purple-500 text-base font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:h-12 sm:text-lg"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar conta"}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
            </button>
            {authError ? (
              <p className="text-center text-xs font-medium text-rose-600 sm:text-sm">{authError}</p>
            ) : null}
            {successMessage ? (
              <p className="text-center text-xs font-medium text-emerald-600 sm:text-sm">{successMessage}</p>
            ) : null}
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500 sm:mt-8 sm:pt-6 sm:text-base">
            Entrar em contato?{" "}
            <Link href="#" className="font-semibold text-purple-600 hover:underline">
              Clique aqui
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
