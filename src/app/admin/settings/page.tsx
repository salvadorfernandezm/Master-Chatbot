"use client";
import { useState, useEffect } from "react";
import { updateSettings } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadSettings = () => {
    setLoading(true);
    // Añadimos ?t=... para que el navegador no use datos viejos (cache busting)
    fetch(`/api/admin/stats-buzon?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase">Sincronizando con el búnker...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 font-sans text-left">
      <header className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800">Configuración</h1>
        <p className="text-slate-500">Control maestro de la plataforma institucional.</p>
      </header>

      <form action={async (formData) => {
          await updateSettings(formData);
          // Forzamos a que la página se entere del cambio
          loadSettings();
          alert("✅ Cambios guardados con éxito.");
      }} className="space-y-8">
        
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <h2 className="text-sm font-black uppercase text-emerald-600 tracking-widest border-b pb-4">1. Identidad Visual</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-2">URL del Logo (JPG o PNG)</label>
              <input name="organizationLogo" defaultValue={settings?.organizationLogo} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-2">Nombre Institucional</label>
              <input name="organizationName" defaultValue={settings?.organizationName} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-2">Reglamento (Markdown)</label>
              <textarea name="organizationBuzonInfo" defaultValue={settings?.organizationBuzonInfo} rows={6} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 font-mono text-xs" />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <h2 className="text-sm font-black uppercase text-purple-600 tracking-widest border-b pb-4">2. Responsables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="nameAcademica" defaultValue={settings?.nameAcademica} placeholder="Académica" className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm" />
            <input name="nameAdministrativa" defaultValue={settings?.nameAdministrativa} placeholder="Administrativa" className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm" />
            <input name="nameDireccion" defaultValue={settings?.nameDireccion} placeholder="Dirección" className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm" />
            <input name="nameTecnico" defaultValue={settings?.nameTecnico} placeholder="Soporte" className="bg-slate-50 p-4 rounded-xl border border-slate-100 outline-none text-sm" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase text-amber-600 tracking-widest">3. Interruptor de Pánico</h2>
            <p className="text-xs text-slate-400">Estado actual: {settings?.isBuzonActive ? 'Activo' : 'Mantenimiento'}</p>
          </div>
          <select 
            name="isBuzonActive" 
            key={settings?.isBuzonActive ? 'active' : 'inactive'} // Forzamos el re-dibujado
            defaultValue={settings?.isBuzonActive ? "true" : "false"}
            className={`p-4 rounded-2xl font-black text-xs uppercase border-none outline-none shadow-lg ${settings?.isBuzonActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
          >
            <option value="true">🟢 Buzón Activo</option>
            <option value="false">🔴 En Mantenimiento</option>
          </select>
        </div>

        <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95">
          Guardar Cambios Maestros
        </button>
      </form>
    </div>
  );
}