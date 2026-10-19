"use client";

import { useState } from "react";
import SubmitButton from "./SubmitButton";

interface MasterPinModalProps {
  actionType: "edit" | "delete";
  profileName: string;
  onConfirm: () => void;
  onCancel: () => void;
  verifyAction: (pin: string) => Promise<boolean>;
}

export default function MasterPinModal({
  actionType,
  profileName,
  onConfirm,
  onCancel,
  verifyAction,
}: MasterPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const isValid = await verifyAction(pin);
    setLoading(false);

    if (isValid) {
      onConfirm();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl">
          🔑
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">PIN Maestro Requerido</h2>
          <p className="text-xs text-slate-400">
            Para {actionType === "edit" ? "editar" : "eliminar"} el perfil de{" "}
            <strong className="text-amber-400">{profileName}</strong> ingresa el PIN de administrador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Ingrese PIN Maestro"
            required
            autoFocus
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-rose-500"
          />

          {error && (
            <p className="text-xs text-rose-400 font-semibold animate-bounce">
              ⚠️ PIN Maestro incorrecto.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-rose-500/20"
            >
              {loading ? "Verificando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}