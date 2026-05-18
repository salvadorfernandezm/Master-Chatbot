// En tu ChatClient.tsx, asegúrate de que el botón de Info tenga esta lógica:
{infoMessage && (
  <button 
    onClick={() => setIsInfoOpen(true)}
    className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-serif italic text-lg hover:bg-emerald-700 shadow-lg active:scale-90"
  >
    i
  </button>
)}

{/* Y el cuadro de Info, añádele una carga segura: */}
{isInfoOpen && (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border">
      <h3 className="font-black text-slate-800 mb-4 text-center">Reglamento del Buzón</h3>
      {infoMessage ? (
        <div className="text-sm text-slate-600 italic leading-relaxed mb-6 whitespace-pre-wrap">
           {infoMessage}
        </div>
      ) : (
        <p className="text-slate-400 italic">No hay reglamento cargado aún.</p>
      )}
      <button 
        onClick={() => setIsInfoOpen(false)}
        className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black"
      >
        Cerrar
      </button>
    </div>
  </div>
)}