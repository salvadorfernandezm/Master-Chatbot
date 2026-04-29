"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        const interactions = Array.isArray(json) ? json : [];
        setData(interactions);

        // --- PROCESAR DATOS PARA LA GRÁFICA DE BARRAS (Uso por Bot) ---
        const counts = interactions.reduce((acc: any, curr: any) => {
          const botName = curr.chatbot?.name || "Desconocido";
          acc[botName] = (acc[botName] || 0) + 1;
          return acc;
        }, {});

        const formatted = Object.keys(counts).map(name => ({
          name: name.length > 15 ? name.substring(0, 15) + "..." : name,
          consultas: counts[name]
        }));
        setChartData(formatted);

      } catch (err) {
        console.error("Error cargando analíticas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse italic text-slate-500">📊 Generando reporte académico...</div>;

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Monitor de Impacto</h1>
          <p className="text-slate-500">Análisis de consultas y comportamiento de los alumnos.</p>
        </div>
        <div className="bg-purple-600 text-white px-4 py-2 rounded-2xl font-bold text-sm shadow-lg shadow-purple-200">
          Total: {data.length} consultas
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICA: USO POR CHATBOT */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
          <span>📊</span> Popularidad de los Chatbots
        </h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                cursor={{fill: '#f8fafc'}}
              />
              <Bar dataKey="consultas" radius={[10, 10, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECCIÓN DE LISTADO: ÚLTIMAS INTERACCIONES (EL "LOG" DE PREGUNTAS) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <span>💬</span> Últimas 30 Conversaciones Reales
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {data.slice(0, 30).map((item, i) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {item.chatbot?.name || "Chatbot"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(item.createdAt).toLocaleString('es-MX')}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-blue-500 font-bold text-sm">P:</span>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{item.query}</p>
                </div>
                <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-purple-600 font-bold text-sm">R:</span>
                  <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-3 hover:line-clamp-none transition-all">
                    {item.response}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}