import { connection } from "next/server";
import { db } from "../../db";
import { profiles } from "../../db/schema";
import { createProfile, updateProfile, deleteProfile } from "../actions";
import Link from "next/link";
import SubmitButton from "../SubmitButton";

export default async function PerfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ editId?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const editId = params.editId ? Number(params.editId) : null;

  const listaPerfiles = await db.select().from(profiles);
  const perfilAEditar = editId ? listaPerfiles.find((p) => p.id === editId) : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Encabezado con navegación de regreso */}
        <header className="flex justify-between items-center pb-2 border-b border-slate-800/80">
          <Link
            href="/"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full font-medium transition active:scale-95"
          >
            ← Volver a Finanzas
          </Link>
          <h1 className="text-base font-bold text-white">Gestión de Perfiles</h1>
        </header>

        {/* FORMULARIO: Crear o Editar */}
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
                placeholder="Ej. Él, Ella, Fondo de Reserva..."
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Límite de Presupuesto ($)</label>
              <input
                type="number"
                name="spendingLimit"
                step="any"
                defaultValue={perfilAEditar?.spendingLimit || "2000.00"}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
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

        {/* LISTADO DE PERFILES (READ & DELETE) */}
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
                      Límite: <span className="text-emerald-400">${Number(p.spendingLimit).toLocaleString("es-MX")}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/perfiles?editId=${p.id}`}
                      className="text-slate-400 hover:text-amber-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                      title="Editar Perfil"
                    >
                      ✏️
                    </Link>

                    <form action={deleteProfile}>
                      <input type="hidden" name="id" value={p.id} />
                      <SubmitButton
                        label="🗑️"
                        loadingLabel="..."
                        className="text-slate-500 hover:text-rose-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                      />
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </main>
  );
}