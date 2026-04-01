"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Pencil,
  PlusIcon,
  Calendar,
  MapPin,
  Phone,
  User,
  Heart,
  AlertTriangle,
  Pill,
  ClipboardList,
  Mail,
  CheckCircle2,
  MoreVertical,
  TrendingUp,
  FileText,
  Activity,
  History,
} from "lucide-react";

// Mock de dados para demonstração (replicando a estrutura da listagem)
const getMockContato = (id: string) => {
  const numericId = parseInt(id) || 1;
  
  // Base de dados para randomização baseada no ID
  const names = [
    "Beatriz Cavalcanti", "Marcus Oliveira", "Juliana Costa", "Ricardo Santos", 
    "Fernanda Lima", "Gabriel Souza", "Ana Clara", "Roberto Dias",
    "Luciana Pereira", "Eduardo Gomes", "Patrícia Melo", "Tiago Silva"
  ];
  
  const professions = ["Arquiteta", "Engenheiro", "Advogada", "Médico", "Designer", "Professor", "Contador"];
  const locations = ["São Paulo, SP", "Rio de Janeiro, RJ", "Curitiba, PR", "Belo Horizonte, MG", "Salvador, BA"];
  const tags = ["VIP GOLD", "PACIENTE", "CLIENTE NOVO", "RETORNO"];
  
  const name = names[numericId % names.length];
  const profession = professions[numericId % professions.length];
  const location = locations[numericId % locations.length];
  const tag = tags[numericId % tags.length];
  const age = 20 + (numericId % 40);
  
  const base = {
    id: id,
    name: name,
    email: `${name.toLowerCase().split(" ")[0]}.${numericId}@email.com`,
    cpf: `${Math.floor(100 + numericId % 900)}.${Math.floor(100 + numericId % 900)}.${Math.floor(100 + numericId % 900)}-${Math.floor(10 + numericId % 90)}`,
    phone: `(11) 9${Math.floor(1000 + numericId % 9000)}-${Math.floor(1000 + numericId % 9000)}`,
    birthDate: `${Math.floor(1 + numericId % 28)}/0${Math.floor(1 + numericId % 9)}/19${70 + numericId % 30}`,
    age: age,
    location: location,
    profession: profession,
    status: numericId % 5 === 0 ? "inativo" : "ativo",
    tag: tag,
    emergencyContact: {
      name: `Contato de ${name.split(" ")[0]}`,
      relationship: numericId % 2 === 0 ? "Cônjuge" : "Pai/Mãe",
      phone: `(11) 98877-${Math.floor(1000 + numericId % 9000)}`,
    },
    allergies: numericId % 3 === 0 ? ["Látex", "Dipirona"] : ["Nenhuma"],
    medications: numericId % 4 === 0 ? ["Vitamina D"] : ["Nenhum"],
    treatments: [
      {
        date: "01 Nov 2023",
        procedure: "Consulta Inicial",
        professional: "Dra. Mariana Lins",
        status: "CONCLUÍDO",
      }
    ],
  };

  return base;
};

const getContatoInitials = (name: string) => {
  const names = name.split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function ContatoDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ width: 0, left: 0 });

  // Busca o contato pelo ID (usando mock para exemplo)
  const contato = useMemo(() => {
    return getMockContato(params.id as string);
  }, [params.id]);

  // Efeito para rolar para o conteúdo ao entrar em modo de edição
  useEffect(() => {
    if (isEditing && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [isEditing]);

  // Form States para edição
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    birthDate: "",
    isActive: true,
  });

  // Atualiza o formulário quando entra em modo de edição
  useEffect(() => {
    if (isEditing) {
      setEditForm({
        name: contato.name,
        email: contato.email,
        phone: contato.phone,
        cpf: contato.cpf,
        birthDate: contato.birthDate,
        isActive: contato.status === "ativo",
      });
    }
  }, [isEditing, contato]);

  // Formatadores
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

  const canSave = editForm.name.trim().length > 0 && editForm.phone.replace(/\D/g, "").length === 11;

  const tabs = [
    { id: "info", label: "INFORMAÇÕES PESSOAIS" },
    { id: "prontuario", label: "PRONTUÁRIO" },
    { id: "anamnese", label: "ANAMNESE" },
    { id: "timeline", label: "LINHA DO TEMPO" },
  ];

  useEffect(() => {
    const updateTabIndicator = () => {
      const activeButton = tabButtonRefs.current[activeTab];
      const tabsContainer = tabsContainerRef.current;

      if (!activeButton || !tabsContainer) {
        return;
      }

      const buttonRect = activeButton.getBoundingClientRect();
      const containerRect = tabsContainer.getBoundingClientRect();

      setTabIndicatorStyle({
        width: buttonRect.width,
        left: buttonRect.left - containerRect.left,
      });
    };

    updateTabIndicator();
    window.addEventListener("resize", updateTabIndicator);

    return () => {
      window.removeEventListener("resize", updateTabIndicator);
    };
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return isEditing ? (
          <div className="grid gap-6 lg:grid-cols-[1fr] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Editando Informações</h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Nome Completo *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:border-purple-400 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Telefone *</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: formatPhone(e.target.value) })}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:border-purple-400 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Data de Nascimento</label>
                  <input
                    type="text"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: formatBirthDate(e.target.value) })}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:border-purple-400 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">E-mail</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:border-purple-400 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">CPF</label>
                  <input
                    type="text"
                    value={editForm.cpf}
                    onChange={(e) => setEditForm({ ...editForm, cpf: formatCPF(e.target.value) })}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:border-purple-400 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-800">Contato Ativo</p>
                  <p className="text-xs text-slate-500 font-medium">Define se o contato está ativo no sistema.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black uppercase tracking-wider ${editForm.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                    {editForm.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <div className="ios-switch-container">
                    <input
                      id="edit-contato-active-main"
                      type="checkbox"
                      className="ios-switch-input"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                    <label className="ios-switch-track" htmlFor="edit-contato-active-main">
                      <span className="ios-switch-slider" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsEditing(false)}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-8 py-3 text-xs font-black uppercase tracking-widest text-slate-500 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md hover:shadow-rose-100 active:scale-[0.98]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-rose-200/70 to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-rose-800">Cancelar</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={!canSave}
                  className="group relative overflow-hidden rounded-xl bg-purple-600 px-10 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-300 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative z-10 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Salvar Alterações
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[350px_1fr] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              {/* Dados Básicos */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <User className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Dados Básicos</h3>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CPF</p>
                    <p className="text-sm font-bold text-slate-700">{contato.cpf}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data de Nascimento</p>
                    <p className="text-sm font-bold text-slate-700">{contato.birthDate}</p>
                  </div>
                </div>
              </div>

              {/* Contato de Emergência */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                    <Heart className="h-4 w-4" fill="currentColor" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Contato de Emergência</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-700">{contato.emergencyContact.name}</p>
                    <p className="text-[11px] font-medium text-slate-500">
                      {contato.emergencyContact.relationship} • {contato.emergencyContact.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Alergias */}
                <div className="rounded-3xl border-l-4 border-l-rose-500 border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:scale-[1.01]">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Alergias e Restrições</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {contato.allergies.map((allergy) => (
                      <span key={allergy} className="rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Medicamentos */}
                <div className="rounded-3xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:scale-[1.01]">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                      <Pill className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Medicamentos em uso</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {contato.medications.map((med) => (
                      <p key={med} className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {med}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Histórico de Tratamentos */}
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Histórico de Tratamentos</h3>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700 transition-colors">Ver Tudo</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Data</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Procedimento</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Profissional</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {contato.treatments.map((treatment, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{treatment.date}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-slate-800">{treatment.procedure}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{treatment.professional}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-100">
                              {treatment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case "anamnese":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Header da Anamnese */}
            <div className="flex items-center justify-between rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ficha de Anamnese Digital</h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Última atualização: 12/03/2026 por Dra. Mariana Lins</p>
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-purple-600 transition-all hover:bg-purple-100 active:scale-95">
                <Pencil className="h-3.5 w-3.5" />
                Editar Ficha
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bloco: Histórico de Saúde */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Histórico de Saúde</h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Pratica exercícios físicos?</span>
                    <span className="rounded-lg bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-600 ring-1 ring-emerald-100">SIM</span>
                  </div>
                  <div className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Fumante?</span>
                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-400">NÃO</span>
                  </div>
                  <div className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Gestante ou amamentando?</span>
                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-400">NÃO</span>
                  </div>
                  <div className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Diabetes ou Hipertensão?</span>
                    <span className="rounded-lg bg-rose-50 px-3 py-1 text-[10px] font-black uppercase text-rose-600 ring-1 ring-rose-100">SIM (HIPERTENSÃO)</span>
                  </div>
                </div>
              </div>

              {/* Bloco: Estilo de Vida e Hábitos */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                    <History className="h-4 w-4" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Hábitos e Cuidados</h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Queixa Principal</p>
                    <p className="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                      "Gostaria de melhorar a textura da pele e reduzir linhas de expressão ao redor dos olhos."
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uso de Filtro Solar</p>
                    <div className="flex gap-2">
                      <span className="rounded-lg bg-purple-50 px-3 py-1 text-[10px] font-black uppercase text-purple-600 ring-1 ring-purple-100">DIARIAMENTE</span>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qualidade do Sono</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full w-[80%]" />
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest pt-1">
                      <span>Ruim</span>
                      <span>Excelente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner de Personalização (Incentivo para futura feature) */}
            <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-purple-400 p-8 text-white relative overflow-hidden group transition-all hover:shadow-xl hover:shadow-purple-200">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <h4 className="text-lg font-black tracking-tight">Personalize sua Ficha de Anamnese</h4>
                  <p className="text-xs font-medium text-purple-100 mt-2 leading-relaxed opacity-90">
                    Deseja mudar as perguntas ou criar um formulário exclusivo para sua especialidade? 
                    Agora você pode personalizar toda a ficha clínica.
                  </p>
                </div>
                <button 
                  onClick={() => router.push("/configuracoes/anamnese")}
                  className="whitespace-nowrap rounded-xl bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-purple-600 shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Configurar Formulário
                </button>
              </div>
              <FileText className="absolute -right-6 -bottom-6 h-32 w-32 text-white/10 -rotate-12 transition-transform group-hover:rotate-0" />
            </div>
          </div>
        );
      case "prontuario":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-4">
              <ClipboardList className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Prontuário Digital</h3>
            <p className="text-sm text-slate-500 max-w-xs text-center mt-2">
              Esta funcionalidade está em fase final de preparação. Em breve você terá acesso ao histórico clínico completo.
            </p>
          </div>
        );
      case "timeline":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 py-4">
            <div className="relative ml-4 pl-8 border-l-2 border-purple-100 space-y-12">
              <div className="relative">
                <div className="absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-purple-600 ring-4 ring-purple-50 transition-transform hover:scale-125" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">HOJE • 16:30</span>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[8px] font-bold text-purple-600">PRÓXIMO</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-w-2xl transition-all hover:shadow-md hover:border-purple-200">
                    <h4 className="text-sm font-black text-slate-800">Agendamento Confirmado</h4>
                    <p className="text-xs text-slate-500 mt-1">Procedimento: Peeling de Cristal com Dra. Mariana Lins.</p>
                    <div className="mt-3 flex gap-2">
                      <button className="text-[9px] font-bold text-purple-600 px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100">Ver Detalhes</button>
                      <button className="text-[9px] font-bold text-slate-500 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100">Reagendar</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-emerald-500 ring-4 ring-emerald-50" />
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">01 NOV 2023</span>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-w-2xl opacity-80">
                    <h4 className="text-sm font-black text-slate-800">Tratamento Concluído</h4>
                    <p className="text-xs text-slate-500 mt-1">Aplicação de Toxina Botulínica. Paciente relatou satisfação imediata.</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-slate-300 ring-4 ring-slate-50" />
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">15 OUT 2023</span>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-w-2xl opacity-60">
                    <h4 className="text-sm font-black text-slate-800">Limpeza de Pele Profunda</h4>
                    <p className="text-xs text-slate-500 mt-1">Realizado por Est. Fabiana M. sem intercorrências.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Barra de Navegação Superior */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-slate-500 transition-all duration-300 hover:text-purple-600 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="text-sm font-bold tracking-tight transition-colors">Voltar para contatos</span>
        </button>
      </div>

      {/* Header do Perfil */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-purple-100 text-2xl font-bold text-purple-600 shadow-inner">
                {getContatoInitials(contato.name)}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900">{contato.name}</h1>
                <span className="rounded-full bg-purple-50 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-600 ring-1 ring-purple-100">
                  {contato.tag}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  {contato.age} anos
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-purple-400" />
                  {contato.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-purple-400" />
                  {contato.phone}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button 
                  onClick={() => {
                    setIsEditing(true);
                    setActiveTab("info");
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm"
                >
                  <Pencil className="h-4 w-4 text-purple-500" />
                  Editar
                </button>
                <button 
                  onClick={() => router.push(`/agenda?newAppointment=true&patient=${encodeURIComponent(contato.name)}`)}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700 hover:shadow-purple-300"
                >
                  <Calendar className="h-4 w-4" />
                  Novo Agendamento
                </button>
              </>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-4 py-2 rounded-lg ring-1 ring-purple-100 animate-pulse">
                Modo de Edição Ativo
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div ref={tabsContainerRef} className="mt-10 flex border-b border-slate-100 relative items-center gap-8 px-4">
          <div
            className="absolute bottom-0 h-0.5 bg-purple-600 transition-all duration-300 ease-in-out"
            style={{
              width: `${tabIndicatorStyle.width}px`,
              left: `${tabIndicatorStyle.left}px`,
            }}
          />
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={(element) => {
                tabButtonRefs.current[tab.id] = element;
              }}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                activeTab === tab.id ? "text-purple-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Conteúdo Dinâmico com Animação */}
      <div ref={contentRef} className="min-h-[400px] overflow-hidden">
        <div key={activeTab}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
