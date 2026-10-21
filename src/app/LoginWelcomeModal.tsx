"use client";

import { useState } from "react";
import Link from "next/link";
import { loginWithPin } from "./auth-actions";
import SubmitButton from "./SubmitButton";

interface Profile {
  id: number;
  name: string;
}

export default function LoginWelcomeModal({
  profiles,
  hasError,
}: {
  profiles: Profile[];
  hasError: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<number>(
    profiles[0]?.id || 0
  );
  // Si viene con error, mantenemos el campo de PIN abierto por defecto
  const [showPinInput, setShowPinInput] = useState<boolean>(hasError);

  // Filtrar perfiles por búsqueda
  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-[380px] bg-slate-900 border border-slate-800 rounded-[36px] p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado */}
        <div className="space-y-1.5">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-emerald-500/10">
            💳
          </div>
          <h1 className="text-xl font-black text-white tracking-wide">Mis Finanzas</h1>
          <p className="text-xs text-slate-400">
            Selecciona tu perfil o crea uno nuevo para ingresar
          </p>
        </div>

        {/* Buscador de Perfiles */}
        {profiles.length > 3 && (
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar perfil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        )}

        {/* Lista de Perfiles */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ¿Quién eres?
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {filteredProfiles.length} {filteredProfiles.length === 1 ? "perfil" : "perfiles"}
            </span>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {filteredProfiles.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                No se encontraron perfiles con "{searchQuery}"
              </p>
            ) : (
              filteredProfiles.map((p) => {
                const isSelected = selectedProfileId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProfileId(p.id);
                      setShowPinInput(true);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex justify-between items-center transition cursor-pointer ${
                      isSelected && showPinInput
                        ? "bg-slate-950 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold text-sm">👤 {p.name}</span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {isSelected && showPinInput ? "Seleccionado" : "Ingresar →"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Formulario de PIN */}
        {showPinInput && (
          <form action={loginWithPin} className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
            <input type="hidden" name="profileId" value={selectedProfileId} />
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Ingresa el PIN de tu perfil
              </label>
              <input
                type="password"
                name="pin"
                maxLength={6}
                required
                autoFocus
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-lg tracking-[0.4em] font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {hasError && (
              <p className="text-xs font-semibold text-rose-400 animate-bounce">
                ⚠️ PIN incorrecto. Inténtalo de nuevo.
              </p>
            )}

            <SubmitButton
              label="Entrar a mi perfil"
              loadingLabel="Verificando..."
              icon="🔓"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
            />
          </form>
        )}

        {/* Botón para crear nuevo perfil */}
        <div className="pt-2 border-t border-slate-800/60">
          <Link
            href="/perfiles"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>➕</span>
            <span>Crear un perfil nuevo</span>
          </Link>
        </div>

      </div>
    </div>
  );
}