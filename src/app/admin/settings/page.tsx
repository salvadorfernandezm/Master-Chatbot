"use client";

import { useState, useEffect } from "react";
import { updateSettings } from "@/lib/actions";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats-buzon')
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse">Cargando configuración...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 font-sans text-left">
      <header className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800">Configuración del Sistema</h1>
        <p className="text-slate-500">Personaliza la identidad institucional y los responsables.</p>
      </header>

      <form action={updateSettings} className="space-y-8">
        {/* SECCIÓN 1: IDENTIDAD */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <h2 className="text-sm font-black uppercase text-emerald-600 tracking-widest border-b pb-4">1. Identidad de la Organización</h2>
          
<div className="space-y-2">
  <label className="text-xs font-bold text-slate-500 uppercase ml-2">URL del Logo de la Organización</label>
  <input 
    name="organizationLogo" 
    defaultValue={settings?.organizationLogo} 
    placeholder="https://ejemplo.com/logo.png"
    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm"
  />
</div>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-2">Nombre de la Institución</label>
              <input 
                name="organizationName" 
                defaultValue={settings?.organizationName} 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-2">Reglamento del Buzón (Markdown)</label>
              <textarea 
                name="organizationBuzonInfo" 
                defaultValue={settings?.organizationBuzonInfo} 
                rows={8}
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: RESPONSABLES (PUNTO 8C) */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
          <h2 className="text-sm font-black uppercase text-purple-600 tracking-widest border-b pb-4">2. Cuadro de Honor (Responsables)</h2>
          <p className="text-[10px] text-slate-400 italic uppercase">Estos nombres aparecerán en las gráficas de Impacto Institucional.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Secretaría Académica</label>
              <input name="nameAcademica" defaultValue={settings?.nameAcademica} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-purple-500 transition-all text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Secretaría Administrativa</label>
              <input name="nameAdministrativa" defaultValue={settings?.nameAdministrativa} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-purple-500 transition-all text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Dirección General</label>
              <input name="nameDireccion" defaultValue={settings?.nameDireccion} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-purple-500 transition-all text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Soporte Técnico</label>
              <input name="nameTecnico" defaultValue={settings?.nameTecnico} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-purple-500 transition-all text-sm" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: CONTROL DE INTERRUPTOR */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase text-amber-600 tracking-widest">3. Estado del Buzón</h2>
            <p className="text-xs text-slate-400">Si lo apagas, los alumnos verán un mensaje de mantenimiento.</p>
          </div>
          <select 
  name="isBuzonActive" 
  key={settings?.isBuzonActive} // La key fuerza a React a redibujar el valor real
  defaultValue={settings?.isBuzonActive?.toString()}
  className="bg-slate-100 p-4 rounded-2xl font-bold outline-none"
>
  <option value="true">🟢 Activo</option>
  <option value="false">🔴 Apagado</option>
</select>
        </div>

        <button 
          type="submit" 
          className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95"
        >
          Guardar Cambios Maestros
        </button>
      </form>
    </div>
  );
}