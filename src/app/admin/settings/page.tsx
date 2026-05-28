export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from "@/lib/prisma";
import { updateSettings } from "@/app/actions/admin";

export default async function SettingsPage() {
  const settings = await prisma.settings.findFirst() || {
    organizationName: "Master Chatbot IA",
    organizationLogo: null,
    defaultWelcomeMessage: "¡Hola! ¿En qué puedo ayudarte?",
    organizationBuzonInfo: "", // Valor por defecto
    timezone: "America/Mexico_City"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="mb-4">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Ajustes Globales</h1>
        <p className="text-slate-500">Configura la identidad de tu Ecosistema Educativo.</p>
      </div>

      <form action={updateSettings} className="space-y-8">
        {/* Bloque de Identidad */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <span>🏛️</span> Identidad Institucional
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
              <input name="organizationName" defaultValue={settings.organizationName} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo (URL)</label>
              <input name="organizationLogo"" defaultValue={settings.organizationLogo || ""} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Bloque del BUZÓN (TU NUEVA OCURRENCIA) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-lime-400 flex items-center gap-2">
            <span>📬</span> Reglamento del Buzón Inteligente
          </h2>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Información que verá el Alumno (Botón "i" del Buzón)
            </label>
            <textarea name="organizationBuzonInfo" 
<select name="isBuzonActive" ... /> 
    defaultValue={settings.organizationBuzonInfo || ""}
  rows={10} // Le puse un poco más de espacio para que sea cómodo redactar
  placeholder="Escribe el reglamento aquí..."
  className="w-full px-5 py-4 rounded-2xl bg-[#fdfcf9] text-slate-900 border-2 border-slate-300 shadow-inner placeholder-slate-400 focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none font-serif italic"
/>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="px-10 py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-purple-700 active:scale-95 transition-all">
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}