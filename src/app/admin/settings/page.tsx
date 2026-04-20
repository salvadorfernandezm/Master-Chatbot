import { prisma } from "@/lib/prisma";
import { updateSettings } from "@/app/actions/admin";

export default async function SettingsPage() {
  const settings = await prisma.settings.findFirst() || {
    organizationName: "Master Chatbot IA",
    organizationLogo: null as string | null,
    defaultWelcomeMessage: "¡Hola! Soy el asistente del profesor y estoy aquí para ayudarte.",
    timezone: "UTC"
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Ajustes de la Institución</h1>
        <p className="text-slate-500">Configura los detalles globales que verán los alumnos y profesores.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-700">Identidad Digital</h2>
        </div>
        
        <form action={updateSettings} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nombre de la Organización</label>
              <input 
                name="organizationName"
                defaultValue={settings.organizationName}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                placeholder="Ej. Universidad Antigravity"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Logo de la Organización (URL)</label>
              <input 
                name="organizationLogo"
                defaultValue={settings.organizationLogo || ""}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Huso Horario (Timezone)</label>
              <select 
                name="timezone"
                defaultValue={settings.timezone}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all bg-white"
              >
                <option value="America/Mexico_City">Ciudad de México (CST)</option>
                <option value="UTC">Universal Time (UTC)</option>
                <option value="America/New_York">New York (EST)</option>
                <option value="Europe/Madrid">Madrid (CET)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Mensaje de Bienvenida Global (Default)</label>
            <textarea 
              name="defaultWelcomeMessage"
              defaultValue={settings.defaultWelcomeMessage}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
              placeholder="Escribe el mensaje que verán los alumnos al abrir un chat nuevo..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all text-sm"
            >
              Guardar Cambios Institucionales
            </button>
          </div>
        </form>
      </div>

      {/* Tarjeta de Seguridad o Info Adicional */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
          <h3 className="font-bold text-purple-900 mb-2">Escalabilidad</h3>
          <p className="text-xs text-purple-700 leading-relaxed">
            Estos ajustes afectan a todos los chatbots que no tengan una configuración específica definida.
          </p>
        </div>
        <div className="p-6 bg-slate-800 rounded-2xl text-white md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-4xl opacity-10">🚀</div>
          <h3 className="font-bold mb-2">Estado del Sistema</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Motor de IA: Gemini Flash 1.5 <br/>
            Base de Datos: SQLite (Sincronizada) <br/>
            Almacenamiento Vectorial: Activo
          </p>
        </div>
      </div>
    </div>
  );
}
