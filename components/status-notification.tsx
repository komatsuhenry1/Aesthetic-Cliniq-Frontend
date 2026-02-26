import { CheckCircle2, X } from "lucide-react";

type StatusNotificationProps = {
  title: string;
  description: string;
  onClose: () => void;
};

export function StatusNotification({ title, description, onClose }: StatusNotificationProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[60] w-[min(92vw,430px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/60">
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-slate-800">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={onClose}
          aria-label="Fechar notificação"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="h-1.5 bg-emerald-300" />
    </div>
  );
}
