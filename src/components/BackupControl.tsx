"use client";
import { useState, useRef } from "react";
import { exportFullBackup, importFullBackup } from "@/logic/buzon";

export default function BackupControl() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lógica para Descargar
  const handleExport = async () => {
    setLoading(true);
    try {
      const backupData = await exportFullBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Respaldo_Maestro_IA_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Fallo al crear respaldo.");
    } finally {
      setLoading(false);
    }
  };

  // Lógica para Restaurar
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ ¡ADVERTENCIA! Al restaurar, se borrarán los datos actuales para reemplazarlos por los del respaldo. ¿Deseas continuar?")) {
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const result = await importFullBackup(content);
      if (result.success) {
        alert("✅ Sistema restaurado con éxito.");
        window.location.reload();
      } else {
        alert("❌ Error: " + result.error);
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <button 
        onClick={handleExport}
        disabled={loading}
        className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg"
      >
        <span>💾</span> {loading ? 'Procesando...' : 'Descargar Respaldo JSON'}
      </button>

      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="px-6 py-2.5 bg-white border-2 border-slate-800 text-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
      >
        <span>📥</span> {loading ? 'Restaurando...' : 'Restaurar con JSON'}
      </button>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        className="hidden" 
        accept=".json"
      />
    </div>
  );
}