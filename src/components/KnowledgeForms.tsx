"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ 
  text, 
  loadingText, 
  className 
}: { 
  text: string, 
  loadingText: string, 
  className: string 
}) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={`${className} flex items-center justify-center gap-2 ${pending ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {pending ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        text
      )}
    </button>
  );
}

export function UploadDocumentForm({ 
  action, 
  knowledgeBaseId 
}: { 
  action: (formData: FormData) => Promise<void>, 
  knowledgeBaseId: string 
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="knowledgeBaseId" value={knowledgeBaseId} />
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-purple-300 transition-all relative group">
        <input 
          type="file" 
          name="file" 
          required 
          accept=".pdf,.docx,.xlsx,.xls,.txt"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        />
        <div className="text-slate-400 group-hover:text-purple-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto mb-2 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.38-3.75 4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5H6.75Z" />
          </svg>
          <p className="text-sm font-semibold text-slate-600">Haz clic o arrastra un archivo</p>
          <p className="text-xs mt-1 text-slate-400">PDF o Word (.docx)</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <label className="text-[10px] font-black text-slate-500 uppercase flex-1">Omitir primeras páginas (Índice):</label>
        <input 
          type="number" 
          name="skipPages" 
          placeholder="0" 
          min="0"
          className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <SubmitButton 
        text="Procesar e Indexar" 
        loadingText="Analizando documento..." 
        className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl transition-all shadow-lg active:scale-95" 
      />
    </form>
  );
}

export function AddUrlForm({ 
  action, 
  knowledgeBaseId 
}: { 
  action: (formData: FormData) => Promise<void>, 
  knowledgeBaseId: string 
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="knowledgeBaseId" value={knowledgeBaseId} />
      <input 
        type="url" 
        name="url" 
        required 
        placeholder="https://..."
        className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-slate-50"
      />
      <SubmitButton 
        text="Leer Página Web" 
        loadingText="Extrayendo contenido..." 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg active:scale-95" 
      />
    </form>
  );
}
