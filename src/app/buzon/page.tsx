import { createTicket } from "@/app/actions/admin";

export default function BuzonPublico() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-8 text-white text-center">
          <div className="text-4xl mb-4 text-lime-400">📬</div>
          <h1 className="text-2xl font-black uppercase tracking-widest">Buzón Inteligente</h1>
          <p className="text-slate-400 text-sm mt-2 italic">Facultad de Psicología y Terapia de la Comunicación Humana</p>
        </div>

        <form action={createTicket} className="p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de Reporte</label>
              <select name="type" required className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-purple-500">
                <option value="SUGERENCIA">Sugerencia General</option>
                <option value="ACADEMICA">Asunto Académico</option>
                <option value="INFRAESTRUCTURA">Mantenimiento / Instalaciones</option>
                <option value="GRAVE">Reporte Confidencial (Acoso/Gravedad)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Identidad (Opcional)</label>
              <input name="studentName" placeholder="Tu nombre (puedes dejarlo vacío)" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-purple-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Descripción del hecho</label>
            <textarea name="content" required rows={5} placeholder="Describe aquí tu situación con respeto y claridad..." className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-purple-500 resize-none" />
          </div>

          <div className="p-4 bg-lime-50 rounded-2xl border border-lime-100 text-[10px] text-lime-800 leading-relaxed uppercase font-bold text-center">
             🛡️ Este buzón es un espacio seguro. Los reportes son analizados por inteligencia artificial y enrutados a las autoridades competentes.
          </div>

          <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all hover:bg-black">
            Enviar a Revisión
          </button>
        </form>
      </div>
    </div>
  );
}