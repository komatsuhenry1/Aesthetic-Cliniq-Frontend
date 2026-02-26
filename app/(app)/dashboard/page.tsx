const cards = [
  { title: "Receita Mensal", value: "R$ 42.850,00", trend: "+12.5%" },
  { title: "Agendamentos", value: "1.240", trend: "+4.2%" },
  { title: "Novos Clientes", value: "48", trend: "+18%" },
  { title: "Pacote Mais Vendido", value: "Botox Elite ", trend: "Top Sales" },
];

const appointments = [
  { patient: "Sarah Jenkins", procedure: "Botox Full Face", time: "09:30", professional: "Dr. Smith" },
  { patient: "Lucas Andrade", procedure: "Limpeza de Pele", time: "10:15", professional: "Dra. Marina" },
  { patient: "Amanda Rocha", procedure: "Preenchimento Labial", time: "11:00", professional: "Dra. Paula" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Welcome back. Here&apos;s what&apos;s happening with your clinic today.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {card.title}
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="mt-2 text-sm font-semibold text-blue-600">{card.trend}</p>
          </article>
        ))}
      </section>

    

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Próximos Agendamentos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-400">
                <th className="pb-3 font-semibold">Paciente</th>
                <th className="pb-3 font-semibold">Procedimento</th>
                <th className="pb-3 font-semibold">Horário</th>
                <th className="pb-3 font-semibold">Profissional</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={`${appointment.patient}-${appointment.time}`} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-700">{appointment.patient}</td>
                  <td className="py-3 text-slate-600">{appointment.procedure}</td>
                  <td className="py-3 text-slate-600">{appointment.time}</td>
                  <td className="py-3 text-slate-600">{appointment.professional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
