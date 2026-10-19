"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProfile, verifyMasterPin } from "../actions";
import MasterPinModal from "../MasterPinModal";

interface Profile {
  id: number;
  name: string;
  spendingLimit: string;
}

export default function ProfileListProtected({
  listaPerfiles = [],
}: {
  listaPerfiles?: Profile[];
}) {
  const router = useRouter();
  const [modalData, setModalData] = useState<{
    actionType: "edit" | "delete";
    profile: Profile;
  } | null>(null);

  const handleConfirm = async () => {
    if (!modalData) return;

    if (modalData.actionType === "edit") {
      router.push(`/perfiles?editId=${modalData.profile.id}`);
      setModalData(null);
    } else if (modalData.actionType === "delete") {
      const formData = new FormData();
      formData.append("id", modalData.profile.id.toString());
      await deleteProfile(formData);
      setModalData(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
        <span>Perfiles Existentes</span>
        <span>{listaPerfiles.length} perfiles</span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {listaPerfiles.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
            No hay perfiles. Crea uno arriba.
          </p>
        ) : (
          listaPerfiles.map((p) => (
            <div
              key={p.id}
              className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center text-xs"
            >
              <div>
                <p className="font-bold text-white text-sm">👤 {p.name}</p>
                <p className="text-slate-400 text-[11px]">
                  Límite:{" "}
                  <span className="text-emerald-400">
                    ${Number(p.spendingLimit).toLocaleString("es-MX")}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalData({ actionType: "edit", profile: p })}
                  className="text-slate-400 hover:text-amber-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                  title="Editar Perfil (Requiere PIN Maestro)"
                >
                  ✏️
                </button>

                <button
                  type="button"
                  onClick={() => setModalData({ actionType: "delete", profile: p })}
                  className="text-slate-500 hover:text-rose-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                  title="Eliminar Perfil (Requiere PIN Maestro)"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalData && (
        <MasterPinModal
          actionType={modalData.actionType}
          profileName={modalData.profile.name}
          onConfirm={handleConfirm}
          onCancel={() => setModalData(null)}
          verifyAction={verifyMasterPin}
        />
      )}
    </section>
  );
}