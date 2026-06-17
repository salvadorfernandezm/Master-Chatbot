export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { updateSettings } from "@/actions/operaciones";

export default async function SettingsPage() {
  const settings = await prisma.settings.findFirst() || {
    organizationName: "Master Chatbot IA",
    organizationLogo: null,
    organizationBuzonInfo: "",
    isBuzonActive: true
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Configuración Institucional</h1>
        <p className="text-slate-500">Controla la identidad y el estado del Buzón Ético.</p>
      </div>

      <form action={updateSettings} className="space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* Identidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Institución</label>
                <input name="organizationName" defaultValue={settings.organizationName} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Logo (https://...)</label>
                <input name="organizationLogo" defaultValue={settings.organizationLogo || ""} className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
            </div>

            {/* BOTÓN DE APAGADO (Visualmente más claro) */}
            <div className={`p-6 rounded-[2rem] border transition-all ${settings.isBuzonActive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className={`font-bold ${settings.isBuzonActive ? 'text-emerald-900' : 'text-red-900'}`}>
                        {settings.isBuzonActive ? '🟢 Buzón en Línea' : '🔴 Buzón en Mantenimiento'}
                     </h3>
                     <p className="text-[10px] uppercase font-bold opacity-60">Cambia el estado abajo y dale a guardar</p>
                  </div>
                  <select 
                    name="isBuzonActive" 
                    defaultValue={String(settings.isBuzonActive)}
                    className="bg-white border-2 border-slate-200 p-3 rounded-xl font-black text-xs uppercase outline-none"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Desactivar</option>
                  </select>
               </div>
            </div>

            {/* REGLAMENTO (El cuadro que se perdió) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reglamento y Mensaje del Buzón</label>
              <textarea 
                name="organizationBuzonInfo" 
                defaultValue={settings.organizationBuzonInfo || ""} 
                rows={12}
                className="w-full px-4 py-4 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-emerald-500 outline-none font-serif text-sm leading-relaxed" 
                placeholder="Escribe aquí el texto que leerán los alumnos..."
              />
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button type="submit" className="px-10 py-3 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95">
              Guardar y Aplicar Cambios
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}