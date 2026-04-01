"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  GripVertical,
  Trash2,
  Settings2,
  FileText,
  Save,
  CheckCircle2,
  Type,
  CheckSquare,
  List,
  Layout,
  Eye,
  X,
  ChevronRight,
} from "lucide-react";

type QuestionType = "text" | "boolean" | "select" | "scale";

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  options?: string[];
  scaleLabels?: { min: string; max: string };
  required: boolean;
}

interface Category {
  id: string;
  title: string;
  questions: Question[];
}

export default function AnamneseConfigPage() {
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      title: "Histórico de Saúde",
      questions: [
        { id: "q1", type: "boolean", label: "Pratica exercícios físicos?", required: true },
        { id: "q2", type: "text", label: "Possui alguma alergia?", placeholder: "Liste as alergias...", required: false },
      ],
    },
    {
      id: "2",
      title: "Hábitos e Estilo de Vida",
      questions: [
        { id: "q3", type: "scale", label: "Qualidade do Sono", scaleLabels: { min: "Ruim", max: "Excelente" }, required: false },
        { id: "q4", type: "select", label: "Frequência de uso de filtro solar", options: ["Diariamente", "Às vezes", "Nunca"], required: true },
      ],
    },
  ]);

  const [activeCategory, setActiveCategory] = useState<string>("1");

  const addCategory = () => {
    const newId = String(Date.now());
    setCategories([
      ...categories,
      { id: newId, title: "Nova Categoria", questions: [] },
    ]);
    setActiveCategory(newId);
  };

  const addQuestion = (categoryId: string, type: QuestionType) => {
    const newQuestion: Question = {
      id: String(Date.now()),
      type,
      label: "Nova Pergunta",
      required: false,
    };

    if (type === "select") {
      newQuestion.options = ["Opção 1", "Opção 2"];
    }

    if (type === "scale") {
      newQuestion.scaleLabels = { min: "Ruim", max: "Excelente" };
    }

    setCategories(
      categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            questions: [...cat.questions, newQuestion],
          };
        }
        return cat;
      })
    );
  };

  const removeQuestion = (categoryId: string, questionId: string) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            questions: cat.questions.filter((q) => q.id !== questionId),
          };
        }
        return cat;
      })
    );
  };

  const updateQuestion = (categoryId: string, questionId: string, updates: Partial<Question>) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            questions: cat.questions.map((q) =>
              q.id === questionId ? { ...q, ...updates } : q
            ),
          };
        }
        return cat;
      })
    );
  };

  const addOption = (categoryId: string, questionId: string) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            questions: cat.questions.map((q) => {
              if (q.id === questionId) {
                return { ...q, options: [...(q.options || []), `Opção ${(q.options?.length || 0) + 1}`] };
              }
              return q;
            }),
          };
        }
        return cat;
      })
    );
  };

  const removeOption = (categoryId: string, questionId: string, optionIndex: number) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            questions: cat.questions.map((q) => {
              if (q.id === questionId) {
                return { ...q, options: q.options?.filter((_, i) => i !== optionIndex) };
              }
              return q;
            }),
          };
        }
        return cat;
      })
    );
  };

  const updateOption = (categoryId: string, questionId: string, optionIndex: number, value: string) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            questions: cat.questions.map((q) => {
              if (q.id === questionId) {
                const newOptions = [...(q.options || [])];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
              }
              return q;
            }),
          };
        }
        return cat;
      })
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-500 transition-all duration-300 hover:text-purple-600 active:scale-95 mb-2"
          >
            <ChevronLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="text-sm font-bold tracking-tight">Voltar</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Configuração de Anamnese</h1>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Personalize o formulário clínico da sua unidade</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-purple-600 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Ficha
            </span>
          </button>
          <button className="group relative overflow-hidden rounded-xl bg-purple-600 px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-300 active:scale-95">
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative z-10 flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Configuração
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar de Categorias */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categorias</h3>
              <button
                onClick={addCategory}
                className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    activeCategory === cat.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{cat.title}</span>
                  <span className={`text-[10px] opacity-60 ${activeCategory === cat.id ? "text-white" : "text-slate-400"}`}>
                    {cat.questions.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-5 w-5 text-purple-400" />
              <h4 className="text-sm font-black uppercase tracking-widest">Dica Pro</h4>
            </div>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              Mantenha as perguntas curtas e diretas para facilitar o preenchimento durante a consulta.
            </p>
          </div>
        </div>

        {/* Editor de Perguntas */}
        <div className="space-y-6">
          {categories.find((c) => c.id === activeCategory) && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                <input
                  type="text"
                  value={categories.find((c) => c.id === activeCategory)?.title}
                  onChange={(e) => {
                    setCategories(categories.map(c => c.id === activeCategory ? { ...c, title: e.target.value } : c));
                  }}
                  className="bg-transparent text-sm font-black text-slate-800 uppercase tracking-widest outline-none focus:text-purple-600 transition-colors w-full"
                />
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="p-8 space-y-6">
                {categories.find((c) => c.id === activeCategory)?.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="group relative flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-5 transition-all hover:border-purple-200 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-2 cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-purple-400">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {q.type === "text" && <Type className="h-3.5 w-3.5 text-slate-400" />}
                            {q.type === "boolean" && <CheckSquare className="h-3.5 w-3.5 text-slate-400" />}
                            {q.type === "select" && <List className="h-3.5 w-3.5 text-slate-400" />}
                            {q.type === "scale" && <Layout className="h-3.5 w-3.5 text-slate-400" />}
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {q.type === "text" ? "Resposta Aberta" : 
                               q.type === "boolean" ? "Sim / Não" :
                               q.type === "select" ? "Múltipla Escolha" : "Escala Visual"}
                            </span>
                          </div>
                          <button
                            onClick={() => removeQuestion(activeCategory, q.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={q.label}
                          onChange={(e) => updateQuestion(activeCategory, q.id, { label: e.target.value })}
                          placeholder="Digite sua pergunta..."
                          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
                        />

                        {/* Configurações específicas por tipo */}
                        {q.type === "select" && (
                          <div className="space-y-3 pt-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opções de Resposta</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options?.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white rounded-lg border border-slate-100 px-3 py-1.5 group/opt shadow-sm">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(activeCategory, q.id, i, e.target.value)}
                                    className="flex-1 text-xs font-medium text-slate-600 outline-none"
                                  />
                                  <button
                                    onClick={() => removeOption(activeCategory, q.id, i)}
                                    className="opacity-0 group-hover/opt:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addOption(activeCategory, q.id)}
                                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:border-purple-300 hover:text-purple-600 transition-all"
                              >
                                <Plus className="h-3 w-3" />
                                Adicionar Opção
                              </button>
                            </div>
                          </div>
                        )}

                        {q.type === "scale" && (
                          <div className="space-y-3 pt-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configuração da Escala</p>
                            <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                              <div className="flex-1 space-y-1">
                                <label className="text-[8px] font-black uppercase text-slate-400">Rótulo Mínimo</label>
                                <input
                                  type="text"
                                  value={q.scaleLabels?.min}
                                  onChange={(e) => updateQuestion(activeCategory, q.id, { scaleLabels: { ...q.scaleLabels!, min: e.target.value } })}
                                  className="w-full text-xs font-bold text-slate-600 outline-none"
                                />
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-200" />
                              <div className="flex-1 space-y-1 text-right">
                                <label className="text-[8px] font-black uppercase text-slate-400">Rótulo Máximo</label>
                                <input
                                  type="text"
                                  value={q.scaleLabels?.max}
                                  onChange={(e) => updateQuestion(activeCategory, q.id, { scaleLabels: { ...q.scaleLabels!, max: e.target.value } })}
                                  className="w-full text-xs font-bold text-slate-600 text-right outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Seletor de Tipo de Pergunta */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Adicionar nova pergunta</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => addQuestion(activeCategory, "text")}
                      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 transition-all hover:border-purple-200 hover:bg-purple-50 group"
                    >
                      <Type className="h-5 w-5 text-slate-400 group-hover:text-purple-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-700">Aberta</span>
                    </button>
                    <button
                      onClick={() => addQuestion(activeCategory, "boolean")}
                      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 transition-all hover:border-purple-200 hover:bg-purple-50 group"
                    >
                      <CheckSquare className="h-5 w-5 text-slate-400 group-hover:text-purple-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-700">Sim/Não</span>
                    </button>
                    <button
                      onClick={() => addQuestion(activeCategory, "select")}
                      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 transition-all hover:border-purple-200 hover:bg-purple-50 group"
                    >
                      <List className="h-5 w-5 text-slate-400 group-hover:text-purple-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-700">Seleção</span>
                    </button>
                    <button
                      onClick={() => addQuestion(activeCategory, "scale")}
                      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 transition-all hover:border-purple-200 hover:bg-purple-50 group"
                    >
                      <Layout className="h-5 w-5 text-slate-400 group-hover:text-purple-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-purple-700">Escala</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pré-visualização */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-50 rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-300">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-widest">Prévia da Ficha</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Visualização do Profissional</p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">{cat.title}</h3>
                  </div>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    {cat.questions.map((q) => (
                      <div key={q.id} className={`space-y-3 ${q.type === 'text' ? 'sm:col-span-2' : ''}`}>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {q.label} {q.required && <span className="text-rose-500">*</span>}
                        </label>

                        {q.type === "text" && (
                          <textarea
                            disabled
                            placeholder={q.placeholder || "Resposta do paciente..."}
                            className="w-full min-h-[80px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-400 outline-none resize-none shadow-sm"
                          />
                        )}

                        {q.type === "boolean" && (
                          <div className="flex gap-2">
                            <button disabled className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">SIM</button>
                            <button disabled className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">NÃO</button>
                          </div>
                        )}

                        {q.type === "select" && (
                          <div className="relative">
                            <select disabled className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-400 outline-none shadow-sm">
                              <option>Selecione uma opção...</option>
                              {q.options?.map((opt, i) => (
                                <option key={i}>{opt}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronRight className="h-4 w-4 text-slate-300 rotate-90" />
                            </div>
                          </div>
                        )}

                        {q.type === "scale" && (
                          <div className="space-y-4 pt-2">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                              <div className="absolute left-1/2 top-0 h-full w-2 bg-purple-600 rounded-full" />
                            </div>
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest pt-1">
                              <span>{q.scaleLabels?.min}</span>
                              <span>{q.scaleLabels?.max}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {categories.every(cat => cat.questions.length === 0) && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                    <FileText className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-slate-400">Nenhuma pergunta configurada</p>
                    <p className="text-sm font-medium text-slate-400">Adicione perguntas para ver a prévia.</p>
                  </div>
                </div>
              )}
            </div>

            <footer className="border-t border-slate-200 bg-white px-8 py-6 flex items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">
                Esta é apenas uma prévia visual do preenchimento.
              </p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
