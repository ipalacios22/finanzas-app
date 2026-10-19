"use client";

import { loginWithPin } from "./auth-actions";
import SubmitButton from "./SubmitButton";

interface PinModalProps {
  profileId: number;
  profileName: string;
  hasError?: boolean;
}

export default function PinModal({ profileId, profileName, hasError }: PinModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs space-y-5 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        
        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl">
          🔒
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Ingresa tu PIN</h2>
          <p className="text-xs text-slate-400">
            Perfil de <strong className="text-emerald-400">{profileName}</strong>
          </p>
        </div>

        <form action={loginWithPin} className="space-y-4">
          <input type="hidden" name="profileId" value={profileId} />

          <input
            type="password"
            name="pin"
            maxLength={6}
            placeholder="****"
            required
            autoFocus
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-emerald-500"
          />

          {hasError && (
            <p className="text-xs text-rose-400 font-semibold animate-bounce">
              ⚠️ PIN incorrecto. Intenta de nuevo.
            </p>
          )}

          <SubmitButton
            label="Desbloquear"
            loadingLabel="Verificando..."
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
          />
        </form>

        <p className="text-[10px] text-slate-500">PIN por defecto: 1234</p>
      </div>
    </div>
  );
}