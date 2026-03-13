"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusNotification } from "@/components/status-notification";
import { ApiRequestError } from "@/services/api/auth";
import { createProfessional, deleteProfessional, getProfessionals } from "@/services/api/professional";
import {
  CalendarDays,
  Filter,
  Mail,
  Phone,
  Search,
  UserPlus2,
  Pencil,
  Trash2,
  Info,
  Star,
  Settings,
  PlusIcon,
  MinusIcon,
  X,
  UserPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Hourglass,
  Printer,
} from "lucide-react";

type ProfessionalStatus = "ativo" | "inativo";

type Professional = {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  status: ProfessionalStatus;
};

function getProfessionalInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "PR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const scheduleWeekDayInitials = ["D", "S", "T", "Q", "Q", "S", "S"];

function scheduleIsSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function getScheduleCalendarDays(baseMonthDate: Date) {
  const year = baseMonthDate.getFullYear();
  const month = baseMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstWeekDay = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const calendarDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  for (let day = firstWeekDay - 1; day >= 0; day -= 1) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPreviousMonth - day),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  while (calendarDays.length % 7 !== 0) {
    const nextDay = calendarDays.length - (firstWeekDay + daysInMonth) + 1;
    calendarDays.push({
      date: new Date(year, month + 1, nextDay),
      isCurrentMonth: false,
    });
  }

  return calendarDays;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getStatusPillClasses(status: ProfessionalStatus) {
  if (status === "ativo") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  return "bg-slate-100 text-slate-600 border border-slate-200";
}

function getStatusLabel(status: ProfessionalStatus) {
  if (status === "ativo") {
    return "ATIVO";
  }

  return "INATIVO";
}

export default function ProfissionaisPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalsLoading, setProfessionalsLoading] = useState(true);
  const [professionalsError, setProfessionalsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Todos");
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false);
  const specialtyDropdownRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<ProfessionalStatus>("ativo");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [isNewProfessionalActive, setIsNewProfessionalActive] = useState(true);
  const [newProfessionalName, setNewProfessionalName] = useState("");
  const [newProfessionalSpecialty, setNewProfessionalSpecialty] = useState("");
  const [newProfessionalEmail, setNewProfessionalEmail] = useState("");
  const [newProfessionalPhone, setNewProfessionalPhone] = useState("");
  const [newProfessionalSubmitted, setNewProfessionalSubmitted] = useState(false);
  const [saveProfessionalError, setSaveProfessionalError] = useState<string | null>(null);
  const [saveProfessionalLoading, setSaveProfessionalLoading] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedProfessionalForSchedule, setSelectedProfessionalForSchedule] = useState<Professional | null>(null);
  const [scheduleMonthDate, setScheduleMonthDate] = useState(() => new Date());
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState<Date>(() => new Date());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProfessionalToDelete, setSelectedProfessionalToDelete] = useState<Professional | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isNewProfessionalEmailValid = emailPattern.test(newProfessionalEmail.trim());
  const canSaveNewProfessional =
    newProfessionalName.trim().length > 0 &&
    newProfessionalSpecialty.trim().length > 0 &&
    newProfessionalEmail.trim().length > 0 &&
    isNewProfessionalEmailValid &&
    newProfessionalPhone.replace(/\D/g, "").length === 11;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setProfessionalsLoading(true);
      setProfessionalsError(null);
      try {
        const list = await getProfessionals();
        if (!cancelled) {
          setProfessionals(list);
        }
      } catch (e) {
        if (!cancelled) {
          setProfessionals([]);
          setProfessionalsError(
            e instanceof Error ? e.message : "Não foi possível carregar os profissionais."
          );
        }
      } finally {
        if (!cancelled) {
          setProfessionalsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!specialtyDropdownOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (
        specialtyDropdownRef.current &&
        !specialtyDropdownRef.current.contains(event.target as Node)
      ) {
        setSpecialtyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [specialtyDropdownOpen]);

  useEffect(() => {
    if (!statusNotification) return;
    const t = window.setTimeout(() => setStatusNotification(null), 2400);
    return () => window.clearTimeout(t);
  }, [statusNotification]);

  async function reloadProfessionals() {
    try {
      const list = await getProfessionals();
      setProfessionals(list);
      setProfessionalsError(null);
    } catch (e) {
      setProfessionalsError(
        e instanceof Error ? e.message : "Não foi possível atualizar a lista."
      );
    }
  }

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    professionals.forEach((p) => {
      if (p.specialty?.trim()) set.add(p.specialty.trim());
    });
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [professionals]);

  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

  const filteredProfessionals = useMemo(() => {
    return professionals.filter((professional) => {
      if (professional.status !== statusFilter) {
        return false;
      }

      if (selectedSpecialty !== "Todos" && professional.specialty !== selectedSpecialty) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = `${professional.name} ${professional.email} ${professional.specialty}`.toLocaleLowerCase(
        "pt-BR"
      );

      return haystack.includes(normalizedSearch);
    });
  }, [professionals, normalizedSearch, selectedSpecialty, statusFilter]);

  const totalProfessionals = professionals.length;
  const activeProfessionals = professionals.filter((professional) => professional.status === "ativo").length;

  async function handleSaveNewProfessional() {
    setNewProfessionalSubmitted(true);
    setSaveProfessionalError(null);

    if (!canSaveNewProfessional) {
      return;
    }

    if (drawerMode === "edit") {
      setSaveProfessionalError("Edição ainda não está disponível pela API.");
      return;
    }

    setSaveProfessionalLoading(true);
    try {
      const { message } = await createProfessional({
        name: newProfessionalName.trim(),
        specialty: newProfessionalSpecialty.trim(),
        phone: newProfessionalPhone.replace(/\D/g, ""),
        email: newProfessionalEmail.trim(),
      });
      setStatusNotification({
        title: "Profissional criado",
        description: message,
      });
      setIsDrawerOpen(false);
      setNewProfessionalName("");
      setNewProfessionalSpecialty("");
      setNewProfessionalEmail("");
      setNewProfessionalPhone("");
      setNewProfessionalSubmitted(false);
      await reloadProfessionals();
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Não foi possível criar o profissional.";
      setSaveProfessionalError(msg);
    } finally {
      setSaveProfessionalLoading(false);
    }
  }

  return (
    <div className=" space-y-6">
      <section className="mb-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center text-blue-600 sm:h-12 sm:w-12"
              aria-hidden
            >
              <Users className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profissionais</h1>
          </div>
          <p className="mt-2 text-sm text-slate-500 sm:mt-3 sm:text-base">
            Gerencie sua equipe, especialidades e horários em um só lugar.
          </p>
        </div>
        <button
          type="button"
          className="group flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-300/50 transition-colors hover:bg-blue-700"
          onClick={() => {
            setDrawerMode("create");
            setNewProfessionalName("");
            setNewProfessionalSpecialty("");
            setNewProfessionalEmail("");
            setNewProfessionalPhone("");
            setIsNewProfessionalActive(true);
            setNewProfessionalSubmitted(false);
            setSaveProfessionalError(null);
            setIsDrawerOpen(true);
          }}
        >
          <span className="relative h-4 w-4">
            <PlusIcon className="absolute inset-0 h-4 w-4 text-white transition-all duration-300 group-hover:-rotate-90 group-hover:scale-75 group-hover:opacity-0" />
            <MinusIcon className="absolute inset-0 h-4 w-4 text-white opacity-0 transition-all duration-300 group-hover:rotate-0 group-hover:scale-100 group-hover:opacity-100" />
          </span>
          <span className="text-sm font-semibold text-white">Novo Profissional</span>
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 sm:left-3 sm:h-4 sm:w-4" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, e-mail ou especialidade..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100 sm:h-9 sm:pl-9 sm:pr-4 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={specialtyDropdownRef}>
            <button
              type="button"
              onClick={() => setSpecialtyDropdownOpen((open) => !open)}
              aria-expanded={specialtyDropdownOpen}
              aria-haspopup="listbox"
              className="flex h-8 min-w-[8.25rem] items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-left text-xs font-medium text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-slate-50/80 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100 sm:h-9 sm:min-w-[9.5rem] sm:px-2.5"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden />
                <span className="truncate">
                  {selectedSpecialty === "Todos" ? "Todas especialidades" : selectedSpecialty}
                </span>
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${specialtyDropdownOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {specialtyDropdownOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+4px)] z-50 max-h-52 min-w-full overflow-auto rounded-lg border border-slate-200 bg-white py-0.5 shadow-md shadow-slate-200/70 ring-1 ring-slate-100 sm:min-w-[11rem]"
                role="listbox"
              >
                {specialtyOptions.map((option) => {
                  const active = option === selectedSpecialty;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setSelectedSpecialty(option);
                        setSpecialtyDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs transition ${
                        active
                          ? "bg-blue-50 font-semibold text-blue-800"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {active ? (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold leading-none text-white">
                          ✓
                        </span>
                      ) : (
                        <span className="h-4 w-4 shrink-0" aria-hidden />
                      )}
                      <span className="min-w-0 truncate">{option}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div
            className="relative grid min-w-[11rem] grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-sm"
            role="tablist"
            aria-label="Filtrar por status"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-md bg-white shadow-sm ring-1 ring-slate-200/90 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                width: "calc((100% - 0.5rem) / 2)",
                transform: `translateX(calc(${statusFilter === "ativo" ? 0 : 1} * 100%))`,
              }}
            />
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "ativo"}
              onClick={() => setStatusFilter("ativo")}
              className={`relative z-10 rounded-md px-2.5 py-1 text-xs transition-colors duration-200 sm:px-3 sm:text-sm ${
                statusFilter === "ativo"
                  ? "font-semibold text-blue-600"
                  : "font-medium text-slate-500 hover:text-slate-800"
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "inativo"}
              onClick={() => setStatusFilter("inativo")}
              className={`relative z-10 rounded-md px-2.5 py-1 text-xs transition-colors duration-200 sm:px-3 sm:text-sm ${
                statusFilter === "inativo"
                  ? "font-semibold text-blue-600"
                  : "font-medium text-slate-500 hover:text-slate-800"
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
      </section>

      {professionalsError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Não foi possível carregar os profissionais</p>
          <p className="mt-1 text-amber-800">{professionalsError}</p>
        </div>
      ) : null}

      <section className="space-y-4">
        {professionalsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProfessionals.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              Nenhum profissional encontrado. Ajuste os filtros ou cadastre um novo profissional.
            </p>
          ) : null}
          {filteredProfessionals.map((professional) => (
            <article
              key={professional.id}
              className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <header className="mb-4 flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h2
                    className="truncate text-base font-bold text-slate-900 sm:text-lg"
                    title={professional.name}
                  >
                    {professional.name}
                  </h2>
                  <p
                    className="truncate text-sm font-medium text-violet-700"
                    title={professional.specialty}
                  >
                    {professional.specialty}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getStatusPillClasses(
                    professional.status
                  )}`}
                >
                  {getStatusLabel(professional.status)}
                </span>
              </header>

              <dl className="space-y-1.5 text-xs text-slate-500 sm:text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Mail
                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate" title={professional.email}>
                    {professional.email}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Phone
                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate" title={professional.phone}>
                    {professional.phone}
                  </span>
                </div>
              </dl>

              <footer className="mt-4 flex items-center justify-between border-t border-slate-100 bg-slate-150 pt-3 ">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProfessionalForSchedule(professional);
                    setIsScheduleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-800 sm:text-sm"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Ver Agenda</span>
                </button>
                <div className="flex items-center gap-2 text-slate-400">
                  <button
                    type="button"
                    className="rounded-full p-1.5 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Editar ${professional.name}`}
                    onClick={() => {
                      setDrawerMode("edit");
                      setNewProfessionalName(professional.name);
                      setNewProfessionalSpecialty(professional.specialty);
                      setNewProfessionalEmail(professional.email);
                      setNewProfessionalPhone(professional.phone);
                      setIsNewProfessionalActive(professional.status === "ativo");
                      setNewProfessionalSubmitted(false);
                      setSaveProfessionalError(null);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-1.5 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Excluir ${professional.name}`}
                    onClick={() => {
                      setDeleteError(null);
                      setSelectedProfessionalToDelete(professional);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </footer>
            </article>
          ))}

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <UserPlus2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Novo Profissional</span>
          </button>
        </div>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-500 sm:grid-cols-3 sm:px-6 sm:py-5 sm:text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Total da equipe
          </p>
          <p className="text-lg font-bold text-slate-800 sm:text-xl">
            {totalProfessionals} Profissionais
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Profissionais ativos
          </p>
          <p className="text-lg font-bold text-emerald-600 sm:text-xl">
            {activeProfessionals}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Atividade estimada
          </p>
          <p className="text-lg font-bold text-slate-800 sm:text-xl">96%</p>
        </div>
      </section>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                {drawerMode === "create" ? (
                  <UserPlus className="h-5 w-5 text-blue-600" />
                ) : (
                  <Pencil className="h-5 w-5 text-blue-600" />
                )}
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {drawerMode === "create" ? "Novo Profissional" : "Editar Profissional"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar painel"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-semibold text-blue-600">
                    i
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base p-1">
                    Informações Pessoais
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dra. Juliana Martins"
                      value={newProfessionalName}
                      onChange={(event) => setNewProfessionalName(event.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-100 sm:h-11 sm:text-base"
                    />
                    {newProfessionalSubmitted && newProfessionalName.trim().length === 0 && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 sm:text-xs">
                        Informe o nome completo do profissional.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">
                        E-mail Profissional
                      </label>
                      <input
                        type="email"
                        placeholder="email@clinica.com"
                        value={newProfessionalEmail}
                        onChange={(event) => setNewProfessionalEmail(event.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-100 sm:h-11 sm:text-base"
                      />
                      {newProfessionalSubmitted && !isNewProfessionalEmailValid && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600 sm:text-xs">
                          Digite um e-mail válido (exemplo@dominio.com)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={newProfessionalPhone}
                        onChange={(event) => setNewProfessionalPhone(formatPhone(event.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-100 sm:h-11 sm:text-base"
                      />
                      {newProfessionalSubmitted && newProfessionalPhone.replace(/\D/g, "").length !== 11 && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600 sm:text-xs">
                          Informe um telefone completo no formato (00) 99999-9999.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Star className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                    Especialidade
                  </h3>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cardiologia"
                    value={newProfessionalSpecialty}
                    onChange={(e) => setNewProfessionalSpecialty(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-100 sm:h-11 sm:text-base"
                  />
                  {newProfessionalSubmitted && newProfessionalSpecialty.trim().length === 0 && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 sm:text-xs">
                      Informe a especialidade.
                    </p>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Settings className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                    Configurações de Atendimento
                  </h3>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="max-w-[65%]">
                    <p className="text-xs font-medium text-slate-800 sm:text-sm">
                      Status do Profissional
                    </p>
                    <p className="text-[11px] text-slate-500 sm:text-xs">
                      Define se o profissional está disponível para novos agendamentos.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="ios-switch-container">
                      <input
                        id="new-professional-active"
                        type="checkbox"
                        className="ios-switch-input"
                        checked={isNewProfessionalActive}
                        onChange={(event) => setIsNewProfessionalActive(event.target.checked)}
                      />
                      <label className="ios-switch-track" htmlFor="new-professional-active">
                        <span className="ios-switch-slider" />
                      </label>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 sm:text-sm">
                      {isNewProfessionalActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <footer className="space-y-3 border-t border-slate-200 px-5 py-4">
              {saveProfessionalError ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{saveProfessionalError}</p>
              ) : null}
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setSaveProfessionalError(null);
                  }}
                  disabled={saveProfessionalLoading}
                  className="inline-flex min-w-[140px] items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveNewProfessional()}
                  disabled={!canSaveNewProfessional || saveProfessionalLoading}
                  className="inline-flex min-w-[140px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saveProfessionalLoading
                    ? "Salvando..."
                    : drawerMode === "create"
                      ? "Salvar Profissional"
                      : "Salvar alterações"}
                </button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}

      {isScheduleModalOpen && selectedProfessionalForSchedule ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-2 sm:px-6">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => {
              setIsScheduleModalOpen(false);
              setSelectedProfessionalForSchedule(null);
            }}
          />
          <div className="relative z-10 flex h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-base font-semibold text-blue-700 sm:h-14 sm:w-14 sm:text-lg">
                  {getProfessionalInitials(selectedProfessionalForSchedule.name)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    {selectedProfessionalForSchedule.name}
                  </h2>
                  <p className="text-sm font-medium text-violet-700">
                    {selectedProfessionalForSchedule.specialty}
                  </p>
                </div>
              </div>
            </header>

            <div className="grid flex-1 gap-0 border-t border-slate-100 sm:grid-cols-[260px_minmax(0,1fr)] overflow-y-auto">
              <aside className="border-b border-slate-100 bg-slate-50/80 p-4 sm:border-b-0 sm:border-r">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    onClick={() =>
                      setScheduleMonthDate(
                        (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                      )
                    }
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {scheduleMonthDate.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    onClick={() =>
                      setScheduleMonthDate(
                        (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                      )
                    }
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                  {scheduleWeekDayInitials.map((label, index) => (
                    <span key={`${label}-${index}`} className="font-semibold">
                      {label}
                    </span>
                  ))}
                  {getScheduleCalendarDays(scheduleMonthDate).map(({ date, isCurrentMonth }) => {
                    const isSelected = scheduleIsSameDay(date, scheduleSelectedDate);
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => setScheduleSelectedDate(date)}
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : isCurrentMonth
                            ? "text-slate-700 hover:bg-slate-100"
                            : "text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-col gap-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#22d3ee]" />
                    <span>Concluído</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#e879f9]" />
                    <span>Em andamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#facc15]" />
                    <span>Pendente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                    <span>Confirmado</span>
                  </div>
                </div>
              </aside>

              <section className="flex flex-col gap-2 bg-white p-4 sm:p-6">
                {scheduleIsSameDay(scheduleSelectedDate, new Date()) ? (
                  <>
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500 sm:text-sm">
                      <p>
                        Dia selecionado:{" "}
                        <span className="font-semibold text-slate-800">
                          {scheduleSelectedDate.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                          })}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          09:00 - 10:30
                        </p>
                        <p className="text-sm font-semibold text-slate-900">Ricardo Alves</p>
                        <p className="text-xs text-slate-600">Limpeza de Pele Profunda</p>
                      </div>

                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                          13:00 - 14:00
                        </p>
                        <p className="text-sm font-semibold text-slate-900">Ana Beatriz Souza</p>
                        <p className="text-xs text-slate-600">Botox Facial</p>
                      </div>

                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                          16:30 - 18:00
                        </p>
                        <p className="text-sm font-semibold text-slate-900">Juliana Martins</p>
                        <p className="text-xs text-slate-600">Preenchimento Labial</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 text-xs text-slate-500 sm:text-sm">
                    Nenhum agendamento mockado para este dia.
                  </div>
                )}
              </section>
            </div>

            <footer className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600 sm:text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>
                    <span className="font-semibold text-slate-800">03</span> Agendamentos
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm"
                >
                  <Printer className="h-4 w-4 text-blue-600" />
                  Imprimir Agenda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    setSelectedProfessionalForSchedule(null);
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 sm:text-sm"
                >
                  Fechar
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}

      {isDeleteModalOpen && selectedProfessionalToDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 sm:px-6">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => {
              if (!deleteLoading) {
                setIsDeleteModalOpen(false);
                setSelectedProfessionalToDelete(null);
                setDeleteError(null);
              }
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Excluir profissional
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold">{selectedProfessionalToDelete.name}</span>? Esta ação
              não poderá ser desfeita.
            </p>
            {deleteError ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{deleteError}</p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedProfessionalToDelete(null);
                  setDeleteError(null);
                }}
                className="inline-flex min-w-[110px] items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 sm:text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                className="inline-flex min-w-[110px] items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-70 sm:text-sm"
                onClick={async () => {
                  const id = selectedProfessionalToDelete.id;
                  setDeleteError(null);
                  setDeleteLoading(true);
                  try {
                    const { message } = await deleteProfessional(id);
                    setStatusNotification({
                      title: "Profissional removido",
                      description: message,
                    });
                    setIsDeleteModalOpen(false);
                    setSelectedProfessionalToDelete(null);
                    await reloadProfessionals();
                  } catch (e) {
                    setDeleteError(
                      e instanceof ApiRequestError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : "Não foi possível excluir o profissional."
                    );
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
              >
                {deleteLoading ? "Excluindo..." : "Excluir"}
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
