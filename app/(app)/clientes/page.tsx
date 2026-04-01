"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  PlusIcon,
  MinusIcon,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User,
  CheckCircle2,
  X,
  UserPlus,
  Mail,
  Phone,
  CreditCard,
} from "lucide-react";

type ContatoStatus = "ativo" | "inativo";

interface Contato {
  id: string;
  name: string;
  email: string;
  cpf: string;
  lastVisit: string;
  nextAppointment: string | null;
  status: ContatoStatus;
  createdAt: string;
  birthDate?: string;
}

// Criando uma lista maior de mock para testar a paginação
const baseContatos: Contato[] = [
  {
    id: "1",
    name: "Beatriz Silva",
    email: "beatriz.silva@email.com",
    cpf: "425.***.***-08",
    lastVisit: "12 Mai, 2024",
    nextAppointment: "28 Mai, 2024",
    status: "ativo",
    createdAt: "2024-05-12T10:00:00Z",
    birthDate: "15/08/1992",
  },
  {
    id: "2",
    name: "Marcus Oliveira",
    email: "m.oliveira@outlook.com",
    cpf: "112.***.***-45",
    lastVisit: "05 Abr, 2024",
    nextAppointment: null,
    status: "inativo",
    createdAt: "2024-04-05T14:30:00Z",
    birthDate: "22/11/1985",
  },
  {
    id: "3",
    name: "Juliana Costa",
    email: "juliana.c@gmail.com",
    cpf: "338.***.***-12",
    lastVisit: "19 Mai, 2024",
    nextAppointment: "02 Jun, 2024",
    status: "ativo",
    createdAt: "2024-05-19T09:15:00Z",
    birthDate: "10/03/1998",
  },
  {
    id: "4",
    name: "Ricardo Santos",
    email: "ricardo.santos@uol.com.br",
    cpf: "225.***.***-67",
    lastVisit: "22 Abr, 2024",
    nextAppointment: "Hoje, 16:30",
    status: "ativo",
    createdAt: "2024-04-22T16:00:00Z",
    birthDate: "05/12/1979",
  },
  {
    id: "5",
    name: "Fernanda Lima",
    email: "f.lima_estetica@email.com",
    cpf: "159.***.***-89",
    lastVisit: "10 Mai, 2024",
    nextAppointment: null,
    status: "ativo",
    createdAt: "2024-05-10T11:20:00Z",
    birthDate: "30/01/1990",
  },
];

// Gerando 25 contatos para demonstrar a paginação
const mockContatos: Contato[] = Array.from({ length: 25 }, (_, i) => {
  const base = baseContatos[i % baseContatos.length];
  // Alternar as datas de criação para ter alguns contatos neste mês (Março 2026)
  let createdAt = base.createdAt;
  if (i % 3 === 0) {
    // A cada 3 contatos, um é "novo" (Março 2026)
    const day = (i % 28) + 1;
    createdAt = `2026-03-${day.toString().padStart(2, '0')}T10:00:00Z`;
  }
  
  return {
    ...base,
    id: String(i + 1),
    name: `${base.name} ${i + 1}`,
    createdAt,
  };
});

const ITEMS_PER_PAGE = 8;

export default function ContatosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Cálculo de novos contatos este mês
  const newContatosThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return mockContatos.filter((contato) => {
      const createdAt = new Date(contato.createdAt);
      return (
        createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear
      );
    }).length;
  }, []);

  // Cálculo de crescimento (exemplo: comparado ao mês anterior fixo ou 0 se não houver dados)
  const growthRate = 12; // Valor mockado para manter o estilo

  // States para o Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [newContatoName, setNewContatoName] = useState("");
  const [newContatoEmail, setNewContatoEmail] = useState("");
  const [newContatoPhone, setNewContatoPhone] = useState("");
  const [newContatoCPF, setNewContatoCPF] = useState("");
  const [newContatoBirthDate, setNewContatoBirthDate] = useState("");
  const [isNewContatoActive, setIsNewContatoActive] = useState(true);
  const [newContatoSubmitted, setNewContatoSubmitted] = useState(false);

  const filteredContatos = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return mockContatos;
    return mockContatos.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.cpf.includes(term) ||
        c.email.toLowerCase().includes(term)
    );
  }, [search]);

  // Resetar para a primeira página quando buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredContatos.length / ITEMS_PER_PAGE);
  
  const paginatedContatos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContatos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContatos, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredContatos.length);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const getContatoInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedContatoEmail = newContatoEmail.trim();
  const isEmailValid = trimmedContatoEmail.length === 0 || emailPattern.test(trimmedContatoEmail);
  const canSaveContato = 
    newContatoName.trim().length > 0 && 
    newContatoPhone.replace(/\D/g, "").length === 11;

  const handleOpenCreateDrawer = () => {
    setDrawerMode("create");
    setNewContatoName("");
    setNewContatoEmail("");
    setNewContatoPhone("");
    setNewContatoCPF("");
    setNewContatoBirthDate("");
    setIsNewContatoActive(true);
    setNewContatoSubmitted(false);
    setDrawerClosing(false);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerClosing(true);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header Section */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center text-purple-600 sm:h-12 sm:w-12">
              <Users className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Contatos</h1>
          </div>
          <p className="mt-2 text-sm text-slate-500 sm:mt-3 sm:text-base">
            Gerencie os contatos e históricos da clínica
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-xs outline-none transition-all focus:border-purple-400 focus:ring-4 focus:ring-purple-50 sm:text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenCreateDrawer}
            className="group flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-300/50 transition-colors hover:bg-purple-700"
          >
            <span className="relative h-4 w-4">
              <PlusIcon className="absolute inset-0 h-4 w-4 text-white transition-all duration-300 group-hover:-rotate-90 group-hover:scale-75 group-hover:opacity-0" />
              <MinusIcon className="absolute inset-0 h-4 w-4 text-white opacity-0 transition-all duration-300 group-hover:rotate-0 group-hover:scale-100 group-hover:opacity-100" />
            </span>
            <span className="text-sm font-semibold text-white">Criar Contato</span>
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total de Contatos
            </p>
            <p className="text-xl font-black text-slate-800">{mockContatos.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ativos
            </p>
            <p className="text-xl font-black text-slate-800">
              {mockContatos.filter(c => c.status === "ativo").length}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-purple-600 p-4 text-white shadow-lg shadow-purple-200">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-100">
                Novos este mês
              </p>
              <p className="text-2xl font-black">+{newContatosThisMonth} Contatos</p>
            </div>
            
          </div>
          <TrendingUp className="absolute -right-3 -top-3 h-20 w-20 text-white/10" />
        </div>
      </section>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Contato
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  CPF
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Última Visita
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Próximo Agendamento
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedContatos.map((contato) => (
                <tr
                  key={contato.id}
                  onClick={() => router.push(`/clientes/${contato.id}`)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-purple-50 text-[11px] font-bold text-purple-600 shadow-sm transition-transform group-hover:scale-110">
                        {getContatoInitials(contato.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-slate-900 sm:text-sm">{contato.name}</p>
                        <p className="truncate text-[11px] font-medium text-slate-500">{contato.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-500">{contato.cpf}</td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-500">{contato.lastVisit}</td>
                  <td className="px-5 py-3">
                    {contato.nextAppointment ? (
                      <span className="text-xs font-bold text-purple-600">{contato.nextAppointment}</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">Sem agendamento</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${contato.status === "ativo" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {contato.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 hover:shadow-sm"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-white px-5 py-3 sm:flex-row">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Exibindo {startIndex}-{endIndex} de {filteredContatos.length} contatos
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {getPageNumbers().map((page, index) => (
              typeof page === "number" ? (
                <button key={index} onClick={() => handlePageChange(page)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold transition-all ${currentPage === page ? "bg-purple-600 text-white shadow-md shadow-purple-200" : "text-slate-600 hover:bg-slate-50"}`}>
                  {page}
                </button>
              ) : (
                <span key={index} className="px-1 text-[10px] text-slate-400">{page}</span>
              )
            ))}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Drawer para Criar/Editar Contato */}
      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            role="presentation"
            className={`absolute inset-0 bg-slate-900/40 ${drawerClosing ? "prof-drawer-backdrop-leave" : "prof-drawer-backdrop-enter"}`}
            onClick={handleCloseDrawer}
          />
          <aside
            className={`relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl shadow-slate-900/10 ${drawerClosing ? "prof-drawer-aside-leave" : "prof-drawer-aside-enter"}`}
            onAnimationEnd={(e) => {
              if (!drawerClosing || e.animationName !== "prof-drawer-leave") return;
              setIsDrawerOpen(false);
              setDrawerClosing(false);
            }}
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3 px-1">
                {drawerMode === "create" ? (
                  <UserPlus className="h-5 w-5 text-purple-600" />
                ) : (
                  <Users className="h-5 w-5 text-purple-600" />
                )}
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {drawerMode === "create" ? "Criar Contato" : "Editar Contato"}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="group rounded-lg p-1.5 text-slate-400 transition-all duration-200 ease-out hover:scale-110 hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                aria-label="Fechar painel"
              >
                <X className="h-5 w-5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90" strokeWidth={2} />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-xs font-semibold text-purple-600">i</span>
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base p-1">Informações Pessoais</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">
                      Nome Completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Beatriz Silva"
                      value={newContatoName}
                      onChange={(e) => setNewContatoName(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100 sm:h-11 sm:text-base"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">
                      Telefone <span className="text-rose-500">*</span>
                    </label>
                      <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={newContatoPhone}
                      onChange={(e) => setNewContatoPhone(formatPhone(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100 sm:h-11 sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">Data de Nascimento</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={newContatoBirthDate}
                        onChange={(e) => setNewContatoBirthDate(formatBirthDate(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100 sm:h-11 sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">E-mail</label>
                      <input
                        type="email"
                        placeholder="exemplo@email.com"
                        value={newContatoEmail}
                        onChange={(e) => setNewContatoEmail(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100 sm:h-11 sm:text-base"
                      />
                    </div>
                    <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">CPF</label>
                      <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={newContatoCPF}
                      onChange={(e) => setNewContatoCPF(formatCPF(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-100 sm:h-11 sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Status da Conta</h3>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="max-w-[65%]">
                    <p className="text-xs font-medium text-slate-800 sm:text-sm">Contato Ativo</p>
                    <p className="text-[11px] text-slate-500 sm:text-xs">Define se o contato está ativo no sistema.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="ios-switch-container">
                      <input
                        id="new-contato-active"
                        type="checkbox"
                        className="ios-switch-input"
                        checked={isNewContatoActive}
                        onChange={(e) => setIsNewContatoActive(e.target.checked)}
                      />
                      <label className="ios-switch-track" htmlFor="new-contato-active">
                        <span className="ios-switch-slider" />
                      </label>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 sm:text-sm">{isNewContatoActive ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
              </section>
            </div>

            <footer className="space-y-3 border-t border-slate-200 px-5 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={!canSaveContato}
                  className="group relative flex-1 overflow-hidden rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-300 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
                  <span className="relative z-10 flex w-full items-center justify-center gap-2 text-center">
                    <CheckCircle2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                    Salvar Contato
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="group relative flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md hover:shadow-rose-100 active:scale-[0.98]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-rose-200/70 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-rose-800">Cancelar</span>
                </button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
