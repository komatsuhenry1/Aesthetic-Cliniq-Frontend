"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck, Clock, CreditCard, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PatientHomePage() {
  const [userName, setUserName] = useState<string>("Visitante");
  const router = useRouter();

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      const firstName = storedName.split(" ")[0];
      setUserName(firstName);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900 pb-12">
      {/* Header Premium */}
      <header className="relative overflow-hidden bg-gradient-to-br from-purple-800 to-indigo-900 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black tracking-tighter">Aesthetic Cliniq</h1>
          </div>
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight mb-3">
              Olá, {userName}! <span className="inline-block animate-bounce">👋</span>
            </h2>
            <p className="text-lg text-purple-200 font-medium">
              Bem-vindo ao seu portal exclusivo. Aqui o cuidado com você está em primeiro lugar.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        {/* Revolução dos Agendamentos */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Cuidado sem complicações</h3>
          </div>
          <p className="text-slate-600 max-w-3xl leading-relaxed mb-6">
            A Aesthetic Cliniq revolucionou o mundo dos agendamentos para trazer tranquilidade para a sua rotina.
            Agora você não precisa mais aguardar atendimento telefônico para marcar e gerenciar seus procedimentos.
          </p>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group">
              <CalendarCheck className="w-8 h-8 text-indigo-500 mb-4 transition-transform group-hover:scale-110" />
              <h4 className="font-bold text-slate-800 mb-2">Agendamento Fácil</h4>
              <p className="text-sm text-slate-500">Escolha o melhor horário e especialista em poucos cliques, 100% online.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group">
              <Clock className="w-8 h-8 text-fuchsia-500 mb-4 transition-transform group-hover:scale-110" />
              <h4 className="font-bold text-slate-800 mb-2">Zero Atrasos</h4>
              <p className="text-sm text-slate-500">Acompanhe seus horários em tempo real, sem surpresas no momento do atendimento.</p>
            </div>
            <div className="hidden md:flex flex-col bg-slate-900 rounded-2xl p-6 shadow-lg text-white justify-center items-center text-center relative overflow-hidden group cursor-pointer transition-all hover:-translate-y-1" onClick={() => router.push('/agenda')}>
              <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transition-transform group-hover:rotate-12">
                <CalendarCheck className="w-32 h-32" />
              </div>
              <h4 className="font-bold text-lg mb-2 relative z-10">Sua Agenda</h4>
              <p className="text-sm text-slate-400 mb-4 relative z-10">Ir para agendamentos</p>
              <div className="bg-white/10 rounded-full p-3 backdrop-blur-sm relative z-10 group-hover:bg-purple-500 transition-colors">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </section>

        {/* Planos de Pagamento */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-sm">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Planos de Pagamento Flexíveis</h3>
          </div>
          
          <div className="relative rounded-3xl bg-white overflow-hidden shadow-sm border border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/50 to-emerald-50/30"></div>
            <div className="relative p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                  Em Breve
                </span>
                <h4 className="text-xl font-bold text-slate-900 mb-3">Pague como preferir</h4>
                <p className="text-slate-600 mb-5 leading-relaxed">
                  Estamos desenvolvendo novos planos de assinatura e pacotes de procedimentos fechados para garantir 
                  descontos imperdíveis nos seus tratamentos favoritos. Você poderá parcelar e gerenciar sua 
                  carteira digital direto pelo nosso portal.
                </p>
                <button className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 group">
                  Ativar notificações
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              
              <div className="w-full md:w-auto shrink-0 flex gap-4">
                <div className="w-32 py-6 px-4 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-slate-100 flex flex-col items-center rotate-[-4deg] self-end">
                  <div className="h-2 w-10 bg-slate-200 rounded-full mb-4"></div>
                  <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <span className="font-bold text-slate-400">Pix</span>
                  </div>
                  <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
                </div>
                <div className="w-32 py-6 px-4 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col items-center relative z-10 top-2">
                  <div className="h-2 w-10 bg-slate-200 rounded-full mb-4"></div>
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="h-2 w-20 bg-slate-100 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action Mobile */}
        <div className="md:hidden">
          <button 
            onClick={() => router.push('/agenda')}
            className="w-full h-14 bg-slate-900 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            Ir para Agenda
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
