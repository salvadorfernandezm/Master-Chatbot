export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { updateSettings } from "@/app/actions/admin";

export default async function SettingsPage() {
  const settings = await prisma.settings.findFirst() || {
    organizationName: "Master Chatbot IA",
    organizationLogo: null,
    organizationBuzonInfo: "",
    isBuzonActive: true
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Configuración Institucional</h1>
        <p className="text-slate-500">Controla la identidad de la plataforma y el estado del Buzón Ético.</p>
      </div>

      <form action={updateSettings} className="space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* Identidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Institución</label>
                <input 
                  name="organizationName" 
                  defaultValue={settings.organizationName} 
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL del Logo</label>
                <input 
                  name="organizationLogo" 
                  defaultValue={settings.organizationLogo || ""} 
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none" 
                />
              </div>
            </div>

            {/* CONTROL DEL BUZÓN (Botón de Apagado) */}
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-emerald-900">Estado del Buzón Ético</h3>
                  <p className="text-xs text-emerald-700">Si lo desactivas, los alumnos verán un aviso de mantenimiento.</p>
               </div>
               <select 
                 name="isBuzonActive" 
                 defaultValue={String(settings.isBuzonActive)}
                 className="bg-white border-2 border-emerald-200 p-3 rounded-xl font-black text-xs uppercase outline-none"
               >
                 <option value="true">🟢 Activo / En Línea</option>
                 <option value="false">🔴 Inactivo / Mantenimiento</option>
               </select>
            </div>

            {/* REGLAMENTO / INFO */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reglamento y Mensaje del Buzón (Markdown soportado)</label>
              <textarea 
                name="organizationBuzonInfo" 
                defaultValue={settings.organizationBuzonInfo || ""} 
                rows={10}
                className="w-full px-4 py-4 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-emerald-500 outline-none font-serif text-sm" 
              />
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button type="submit" className="px-10 py-3 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg">
              Guardar Cambios Institucionales
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}