
"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Error al obtener datos");
        const json = await res.json();
        // Verificamos que lo que recibimos sea una lista (array)
        setData(Array.isArray(json) ? json : []);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 italic text-slate-500 animate-pulse">
      📊 Preparando analíticas reales...
    </div>
  );

  if (error) return (
    <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100">
      ⚠️ No se pudieron cargar las analíticas. Asegúrate de que haya interacciones registradas.
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Monitor de Actividad</h1>
      
      {data.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400">
          Aún no hay interacciones registradas para mostrar en las gráficas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Aquí irían tus gráficas normales de Recharts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="createdAt" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="id" fill="#8884d8" name="Interacción" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}