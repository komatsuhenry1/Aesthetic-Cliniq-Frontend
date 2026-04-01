"use client";

import { useRouter } from "next/navigation";
import {
  Settings2,
  FileText,
  Users,
  CreditCard,
  ShieldCheck,
  Bell,
  Palette,
  ChevronRight,
  Database,
} from "lucide-react";

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  status?: "ready" | "maintenance";
}

export default function ConfiguracoesPage() {
  const router = useRouter();

  const settings: SettingItem[] = [
    {
      id: "anamnese",
      title: "Configuração de Anamnese",
      description: "Personalize os formulários e questionários clínicos da sua unidade.",
      icon: FileText,
      href: "/configuracoes/anamnese",
      status: "ready",
    },
    {
      id: "profile",
      title: "Perfil da Clínica",
      description: "Edite o nome, logo e informações de contato da clínica.",
      icon: Users,
      href: "#",
      status: "maintenance",
    },
    {
      id: "finance",
      title: "Financeiro e Planos",
      description: "Gerencie métodos de pagamento e assinaturas.",
      icon: CreditCard,
      href: "#",
      status: "maintenance",
    },
    {
      id: "security",
      title: "Segurança e Permissões",
      description: "Controle o acesso de profissionais e secretárias.",
      icon: ShieldCheck,
      href: "#",
      status: "maintenance",
    },
    {
      id: "notifications",
      title: "Notificações",
      description: "Configure lembretes de WhatsApp e e-mails automáticos.",
      icon: Bell,
      href: "#",
      status: "maintenance",
    },
    {
      id: "appearance",
      title: "Aparência",
      description: "Personalize as cores e o tema visual do seu sistema.",
      icon: Palette,
      href: "#",
      status: "maintenance",
    },
    {
      id: "backup",
      title: "Backup e Dados",
      description: "Exporte seus dados ou gerencie o histórico do sistema.",
      icon: Database,
      href: "#",
      status: "maintenance",
    },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <section>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">Configurações</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Gerencie todos os parâmetros do seu sistema</p>
          </div>
        </div>
      </section>

      {/* Settings Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map((item) => (
          <button
            key={item.id}
            onClick={() => item.status === "ready" && router.push(item.href)}
            className={`group relative flex flex-col items-start rounded-3xl border border-slate-200 bg-white p-6 text-left transition-all duration-300 ${
              item.status === "ready"
                ? "hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100"
                : "cursor-not-allowed opacity-60"
            }`}
          >
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
              item.status === "ready" 
                ? "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-purple-200"
                : "bg-slate-50 text-slate-400"
            }`}>
              <item.icon className="h-6 w-6" />
            </div>

            <div className="mb-8 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{item.title}</h3>
                {item.status === "maintenance" && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase text-slate-400">Em breve</span>
                )}
              </div>
              <p className="text-xs font-medium leading-relaxed text-slate-500">{item.description}</p>
            </div>

            <div className="mt-auto flex w-full items-center justify-between border-t border-slate-50 pt-4">
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                item.status === "ready" ? "text-purple-600" : "text-slate-400"
              }`}>
                {item.status === "ready" ? "Configurar agora" : "Aguardando liberação"}
              </span>
              <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${
                item.status === "ready" ? "text-purple-400 group-hover:translate-x-1" : "text-slate-300"
              }`} />
            </div>
          </button>
        ))}
      </section>

      {/* Info Card */}
      <section className="rounded-3xl bg-slate-900 p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-xl font-black tracking-tight italic">Sua clínica, suas regras.</h2>
          <p className="mt-3 text-sm font-medium text-slate-400 leading-relaxed">
            As configurações permitem que você adapte o sistema exatamente ao fluxo de trabalho da sua equipe. 
            Mantenha seus formulários e parâmetros sempre atualizados para garantir a melhor experiência para seus pacientes.
          </p>
        </div>
        <Settings2 className="absolute -right-6 -bottom-6 h-40 w-40 text-white/5 -rotate-12" />
      </section>
    </div>
  );
}
