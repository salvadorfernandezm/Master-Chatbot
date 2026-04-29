export const dynamic = 'force-dynamic';
export const revalidate = 0;

"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

interface AnalyticsData {
  totalInteractions: number;
  queriesByDay: { date: string; count: number }[];
  queriesByBot: { name: string; count: number }[];
  csvData: { fecha: string; chatbot: string; pregunta: string; respuesta: string }[];
}

const BOT_COLORS = [
  "#7c3aed", "#4f46e5", "#0891b2", "#059669", "#d97706",
  "#dc2626", "#db2777", "#9333ea", "#2563eb",
];

function downloadCSV(data: AnalyticsData["csvData"]) {
  const headers = ["Fecha", "Chatbot", "Pregunta", "Respuesta (extracto)"];
  const rows = data.map((r) => [
    `"${r.fecha}"`,
    `"${r.chatbot}"`,
    `"${r.pregunta.replace(/"/g, "'")}"`,
    `"${r.respuesta.replace(/"/g, "'")}"`,
  ]);
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `actividad-chatbots-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl text-sm">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-purple-300">{payload[0].value} consulta(s)</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Error cargando datos"); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2 items-center text-slate-500">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          <span className="ml-2 font-medium">Cargando analíticas...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-center text-red-500 py-20">{error}</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Analíticas</h1>
          <p className="text-slate-500 mt-1 italic">Inteligencia pedagógica en tiempo real de tus tutores IA.</p>
        </div>
        <button
          onClick={() => downloadCSV(data.csvData)}
          disabled={data.csvData.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Consultas Totales", value: data.totalInteractions, icon: "⚡", color: "from-orange-500 to-rose-500", shadow: "shadow-orange-500/20" },
          { label: "Días con Actividad", value: data.queriesByDay.length, icon: "📅", color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
          { label: "Chatbots Activos", value: data.queriesByBot.length, icon: "🤖", color: "from-purple-600 to-indigo-600", shadow: "shadow-purple-500/20" },
        ].map((kpi) => (
          <div key={kpi.label} className={`group bg-white rounded-[2rem] p-8 shadow-xl ${kpi.shadow} border border-slate-100 flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300`}>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl text-white bg-gradient-to-br ${kpi.color} shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{kpi.label}</p>
              <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart — Consultas por Día */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50">
        <h2 className="text-xl font-black text-slate-800 mb-1">Consultas por Día <span className="text-slate-300 font-normal">(últimos 30 días)</span></h2>
        <p className="text-xs text-slate-400 mb-6">Identifica cuándo tus alumnos estudian más y cuándo necesitan más apoyo.</p>
        {data.queriesByDay.length === 0 ? (
          <div className="text-center text-slate-300 italic py-16">Sin actividad registrada aún.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.queriesByDay} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                name="Consultas"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#7c3aed" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar Chart — Consultas por Chatbot */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50">
        <h2 className="text-xl font-black text-slate-800 mb-1">Uso por Chatbot</h2>
        <p className="text-xs text-slate-400 mb-6">Descubre qué tutores IA son los favoritos y cuáles necesitan más difusión.</p>
        {data.queriesByBot.length === 0 ? (
          <div className="text-center text-slate-300 italic py-16">Sin actividad registrada aún.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.queriesByBot} margin={{ top: 5, right: 20, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Consultas" radius={[8, 8, 0, 0]}>
                {data.queriesByBot.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={BOT_COLORS[index % BOT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabla de actividad reciente */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800">Historial de Conversaciones</h2>
            <p className="text-xs text-slate-400 mt-0.5">Últimas 20 interacciones registradas</p>
          </div>
          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
            {data.csvData.length} total
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {data.csvData.length === 0 ? (
            <div className="text-center text-slate-300 italic py-16">Sin actividad registrada aún.</div>
          ) : (
            [...data.csvData].reverse().slice(0, 20).map((row, i) => (
              <div key={i} className="px-8 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                    🤖 {row.chatbot}
                  </span>
                  <span className="text-[10px] text-slate-400">{row.fecha}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  <span className="text-slate-400 mr-1">❓</span>
                  {row.pregunta.length > 140 ? row.pregunta.slice(0, 140) + "…" : row.pregunta}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
                  <span className="text-emerald-500 mr-1">✅</span>
                  {row.respuesta}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
