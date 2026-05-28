export default async function PublicBuzonPage() {
  const settings = await prisma.settings.findFirst();
  
  // SI EL BUZÓN ESTÁ APAGADO:
  if (settings && settings.isBuzonActive === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md p-10 rounded-[3rem] border border-white/10 bg-slate-900 shadow-2xl">
          <div className="text-5xl mb-6">🚧</div>
          <h1 className="text-xl font-black uppercase tracking-widest mb-4">Buzón en Mantenimiento</h1>
          <p className="text-slate-400 text-sm italic">
            "Estamos ajustando el sistema para servirte mejor. Por favor, vuelve más tarde."
          </p>
        </div>
      </div>
    );
  }

  // SI ESTÁ ACTIVO:
  const reglamentoReal = settings?.organizationBuzonInfo || "Reglamento pendiente de carga.";
  return <BuzonClient reglamento={reglamentoReal} />;
}