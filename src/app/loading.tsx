export default function Loading() {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[393px] bg-slate-900 border border-slate-800 rounded-[40px] p-8 shadow-2xl flex flex-col items-center justify-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-xs font-semibold text-slate-400 animate-pulse">
            Cargando datos...
          </p>
        </div>
      </main>
    );
  }