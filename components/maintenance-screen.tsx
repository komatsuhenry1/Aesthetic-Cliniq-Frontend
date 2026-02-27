type MaintenanceScreenProps = {
  title: string;
  description: string;
};

export function MaintenanceScreen({ title, description }: MaintenanceScreenProps) {
  return (
    <section className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center justify-center">
      <article className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Em manutencao
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">{description}</p>
      </article>
    </section>
  );
}
