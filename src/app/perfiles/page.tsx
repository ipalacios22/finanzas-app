import { db } from "../../db";
import { profiles } from "../../db/schema";
import { createProfile, updateProfile } from "../actions";
import Link from "next/link";
import SubmitButton from "../SubmitButton";
import ProfileListProtected from "./ProfileListProtected";

export default async function PerfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ editId?: string }>;
}) {
  const params = await searchParams;
  const editId = params.editId ? Number(params.editId) : null;

  const listaPerfiles = await db.select().from(profiles);
  const perfilAEditar = editId ? listaPerfiles.find((p) => p.id === editId) : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Encabezado */}
        <header className="flex justify-between items-center pb-2 border-b border-slate-800/80">
          <Link
            href="/"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full font-medium transition active:scale-95"
          >
            ← Volver a Finanzas
          </Link>
          <h1 className="text-base font-bold text-white">Gestión de Perfiles</h1>
        </header>

        {/* Formulario para Crear / Editar */}
        <section className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            {perfilAEditar ? `✏️ Editar perfil (${perfilAEditar.name})` : "➕ Crear nuevo perfil"}
          </h2>

          <form action={perfilAEditar ? updateProfile : createProfile} className="space-y-3">
            {perfilAEditar && <input type="hidden" name="id" value={perfilAEditar.id} />}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nombre del Perfil</label>
              <input
                type="text"
                name="name"
                defaultValue={perfilAEditar?.name || ""}
                placeholder="Ej. Él, Ella..."
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Límite ($)</label>
                <input
                  type="number"
                  name="spendingLimit"
                  step="any"
                  defaultValue={perfilAEditar?.spendingLimit || "2000.00"}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">PIN Acceso</label>
                <input
                  type="password"
                  name="pin"
                  maxLength={6}
                  defaultValue={perfilAEditar?.pin || "1234"}
                  placeholder="1234"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 text-center tracking-widest"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {perfilAEditar && (
                <Link
                  href="/perfiles"
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-xl text-center transition flex items-center justify-center"
                >
                  Cancelar
                </Link>
              )}
              <SubmitButton
                label={perfilAEditar ? "Actualizar Perfil" : "Guardar Perfil"}
                loadingLabel={perfilAEditar ? "Actualizando..." : "Guardando..."}
                icon={perfilAEditar ? "✏️" : "+"}
                className={`${
                  perfilAEditar ? "w-1/2 bg-amber-500 hover:bg-amber-400" : "w-full bg-emerald-500 hover:bg-emerald-400"
                } text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer`}
              />
            </div>
          </form>
        </section>

        {/* Lista protegida con PIN Maestro */}
        <ProfileListProtected listaPerfiles={listaPerfiles} />

      </div>
    </main>
  );
}