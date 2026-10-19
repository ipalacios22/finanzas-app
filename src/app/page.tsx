import { db } from "../db";
import { profiles, expenses } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileSelect from "./ProfileSelect";
import SubmitButton from "./SubmitButton";

// Server Actions directas para manejar la BD
async function handleAddExpense(formData: FormData) {
  "use server";
  const profileId = Number(formData.get("profileId"));
  const concept = formData.get("concept") as string;
  const amount = Number(formData.get("amount"));

  if (!amount || amount <= 0) return;

  await db.insert(expenses).values({
    profileId,
    concept: concept.trim() || "Gasto sin concepto",
    amount: amount.toString(),
  });

  revalidatePath("/");
}

async function handleDeleteExpense(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/");
}

async function handleUpdateLimit(formData: FormData) {
  "use server";
  const profileId = Number(formData.get("profileId"));
  const newLimit = Number(formData.get("newLimit"));

  if (newLimit > 0) {
    await db
      .update(profiles)
      .set({ spendingLimit: newLimit.toString() })
      .where(eq(profiles.id, profileId));

    revalidatePath("/");
    redirect(`/?profile=${profileId}`);
  }
}

async function handleReset(formData: FormData) {
  "use server";
  const profileId = Number(formData.get("profileId"));
  await db.delete(expenses).where(eq(expenses.profileId, profileId));
  revalidatePath("/");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; limitModal?: string }>;
}) {
  const params = await searchParams;

  // Obtener o crear perfiles iniciales en la BD si está vacía
  let allProfiles = await db.select().from(profiles);
  if (allProfiles.length === 0) {
    const [p1] = await db.insert(profiles).values({ name: "Él", spendingLimit: "2000.00" }).returning();
    const [p2] = await db.insert(profiles).values({ name: "Ella", spendingLimit: "2000.00" }).returning();
    allProfiles = [p1, p2];
  }

  // Perfil activo (por defecto el primero)
  const activeProfileId = params.profile ? Number(params.profile) : allProfiles[0].id;
  const currentProfile = allProfiles.find((p) => p.id === activeProfileId) || allProfiles[0];

  // Obtener gastos del perfil activo
  const listaGastos = await db
    .select()
    .from(expenses)
    .where(eq(expenses.profileId, currentProfile.id))
    .orderBy(desc(expenses.createdAt));

  const limite = Number(currentProfile.spendingLimit);
  const totalGasto = listaGastos.reduce((sum, item) => sum + Number(item.amount), 0);
  const porcentaje = Math.min(Math.round((totalGasto / limite) * 100), 100);
  const excedeLimite = totalGasto > limite;

  // Clases dinámicas según el semáforo
  let barraColor = "bg-emerald-500";
  let badgeTexto = "Dentro del presupuesto";
  let badgeColor = "text-emerald-400";
  let cardGlow = "shadow-emerald-500/10 border-slate-800/80";
  let totalColor = "text-white";

  if (excedeLimite) {
    barraColor = "bg-rose-500 animate-pulse";
    badgeTexto = `⚠️ Límite excedido por $${(totalGasto - limite).toLocaleString("es-MX")}`;
    badgeColor = "text-rose-400";
    cardGlow = "shadow-rose-500/30 border-rose-500/50";
    totalColor = "text-rose-400";
  } else if (porcentaje >= 75) {
    barraColor = "bg-amber-500";
    badgeTexto = "⚡ Cerca del límite";
    badgeColor = "text-amber-400";
    cardGlow = "shadow-amber-500/20 border-amber-500/40";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      {/* Contenedor tipo Celular */}
      <div className="w-full max-w-[393px] bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Encabezado y Selector Select */}
        <header className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-wide text-white">Mis Finanzas</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/perfiles"
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full font-medium transition active:scale-95"
              >
                ⚙️ Perfiles
              </Link>
              <form action={handleReset}>
                <input type="hidden" name="profileId" value={currentProfile.id} />
                <SubmitButton
                  label="Reset $0"
                  loadingLabel="Limpiando..."
                  icon="↺"
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full font-medium active:scale-95 cursor-pointer"
                />
              </form>
            </div>
          </div>

          {/* Componente Cliente para el Selector Select */}
          <ProfileSelect
            profiles={allProfiles}
            currentProfileId={currentProfile.id}
          />
        </header>

        {/* Display Acumulado + Barra de Límite */}
        <section className={`bg-slate-950 border rounded-2xl p-5 shadow-lg transition-all duration-300 space-y-4 ${cardGlow}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Gasto Acumulado</span>
              <p className={`text-4xl font-extrabold mt-1 tracking-tight ${totalColor}`}>
                ${totalGasto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 ${badgeColor}`}>
              {badgeTexto}
            </span>
          </div>

          {/* Límite y Botón de Editar */}
          <div className="space-y-2 pt-1 border-t border-slate-800/60">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">
                Límite: ${limite.toLocaleString("es-MX")}
              </span>
              
              <a 
                href={`/?profile=${currentProfile.id}&limitModal=true`}
                className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-lg transition-all shadow-sm active:scale-95"
              >
                <span>✏️</span>
                <span>Editar Límite</span>
              </a>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full ${barraColor} transition-all duration-500 rounded-full`} 
                style={{ width: `${porcentaje}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Progreso del límite</span>
              <span>{porcentaje}% consumido</span>
            </div>
          </div>
        </section>

        {/* Formulario Sumador Rápido */}
        <form action={handleAddExpense} className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/60">
          <input type="hidden" name="profileId" value={currentProfile.id} />
          <span className="text-xs font-semibold text-slate-300 block">Sumar nuevo gasto</span>
          
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              name="amount"
              placeholder="$ Monto"
              step="any"
              required
              className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              name="concept"
              placeholder="Nota (ej. Tacos)"
              className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <SubmitButton
            label="Sumar Gasto"
            loadingLabel="Sumando..."
            icon="+"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
          />
        </form>

        {/* Historial de la Sesión con Fecha */}
        <section className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Lista del corte actual</span>
            <span>{listaGastos.length} elementos</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {listaGastos.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                Sin gastos registrados en este corte.
              </p>
            ) : (
              listaGastos.map((item) => {
                // Formatear la fecha para que se vea amigable (ej. 18 oct, 22:15)
                const fechaFormateada = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div key={item.id} className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-200 font-semibold block">{item.concept}</span>
                      {fechaFormateada && (
                        <span className="text-[10px] text-slate-500 block">📅 {fechaFormateada}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-rose-400 text-sm">-${Number(item.amount).toLocaleString("es-MX")}</span>
                      <form action={handleDeleteExpense}>
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton
                          label="✕"
                          loadingLabel="..."
                          className="text-slate-500 hover:text-rose-400 font-bold px-1 rounded cursor-pointer"
                        />
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Pie de página */}
        <footer className="pt-2 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          <span>Sincronizado en tiempo real con Neon DB</span>
        </footer>

      </div>

      {/* MODAL PARA EDITAR LÍMITE MANUALMENTE */}
      {params.limitModal === "true" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-base font-bold text-white">Editar Límite de Gasto</h2>
            <p className="text-xs text-slate-400">
              Establece el nuevo tope máximo para el perfil de <strong className="text-emerald-400">{currentProfile.name}</strong>.
            </p>

            <form action={handleUpdateLimit} className="space-y-4">
              <input type="hidden" name="profileId" value={currentProfile.id} />
              <input
                type="number"
                name="newLimit"
                defaultValue={limite}
                required
                step="any"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
              />

              <div className="flex gap-2 pt-2">
                <a
                  href={`/?profile=${currentProfile.id}`}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs text-center transition flex items-center justify-center"
                >
                  Cancelar
                </a>
                <SubmitButton
                  label="Guardar"
                  loadingLabel="Guardando..."
                  className="w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}