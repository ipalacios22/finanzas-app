import { db } from "../db";
import { profiles, expenses } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import ProfileSelect from "./ProfileSelect";
import SubmitButton from "./SubmitButton";
import LoginWelcomeModal from "./LoginWelcomeModal";
import EditExpenseForm from "./EditExpenseForm";

// Obtiene estrictamente el YYYY-MM-DD local de cualquier fecha
function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Obtiene el YYYY-MM-DD del lunes de la semana actual
function getLunesActualStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(d.getFullYear(), d.getMonth(), diff);
  return toLocalDateStr(lunes);
}

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

async function handleProcesarSemana(formData: FormData) {
  "use server";
  const profileId = Number(formData.get("profileId"));
  const accion = formData.get("accion") as string;
  const sobrante = Number(formData.get("sobrante") || 0);
  const strLunes = getLunesActualStr();

  const cookieStore = await cookies();
  cookieStore.set(`semana_procesada_${profileId}_${strLunes}`, "true", { path: "/" });

  if (accion === "acumular" && sobrante > 0) {
    const perfil = await db.select().from(profiles).where(eq(profiles.id, profileId)).then(res => res[0]);
    if (perfil) {
      const nuevoLimite = Number(perfil.spendingLimit) + sobrante;
      await db.update(profiles).set({ spendingLimit: nuevoLimite.toString() }).where(eq(profiles.id, profileId));
    }
  }

  revalidatePath("/");
  redirect(`/?profile=${profileId}`);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    profile?: string;
    limitModal?: string;
    editExpenseId?: string;
    error?: string;
    confirmarAccion?: string;
    verSemana?: string;
  }>;
}) {
  const params = await searchParams;

  let allProfiles = await db.select().from(profiles);
  if (allProfiles.length === 0) {
    const [p1] = await db.insert(profiles).values({ name: "Él", spendingLimit: "500.00", pin: "1234" }).returning();
    const [p2] = await db.insert(profiles).values({ name: "Ella", spendingLimit: "500.00", pin: "1234" }).returning();
    allProfiles = [p1, p2];
  }

  const activeProfileId = params.profile ? Number(params.profile) : allProfiles[0].id;
  const currentProfile = allProfiles.find((p) => p.id === activeProfileId) || allProfiles[0];

  const cookieStore = await cookies();
  const activeAuthProfile = cookieStore.get("active_auth_profile")?.value;
  const isAuthenticated = activeAuthProfile === currentProfile.id.toString();

  if (!isAuthenticated) {
    return (
      <LoginWelcomeModal
        profiles={allProfiles}
        hasError={params.error === "pin_incorrecto"}
      />
    );
  }

  const strLunesActual = getLunesActualStr();

  const todosLosGastos = await db
    .select()
    .from(expenses)
    .where(eq(expenses.profileId, currentProfile.id))
    .orderBy(desc(expenses.createdAt));

  const gastosAnteriores = todosLosGastos.filter((item) => {
    if (!item.createdAt) return false;
    const fechaGastoStr = toLocalDateStr(new Date(item.createdAt));
    return fechaGastoStr < strLunesActual;
  });

  const listaGastos = todosLosGastos.filter((item) => {
    if (!item.createdAt) return true;
    const fechaGastoStr = toLocalDateStr(new Date(item.createdAt));
    return fechaGastoStr >= strLunesActual;
  });

  const semanasPasadasMap = gastosAnteriores.reduce((acc, item) => {
    if (!item.createdAt) return acc;
    const fecha = new Date(item.createdAt);
    const day = fecha.getDay();
    const diff = fecha.getDate() - day + (day === 0 ? -6 : 1);
    const lunesSemana = toLocalDateStr(new Date(fecha.getFullYear(), fecha.getMonth(), diff));

    if (!acc[lunesSemana]) {
      acc[lunesSemana] = {
        lunes: lunesSemana,
        gastos: [],
        total: 0,
      };
    }
    acc[lunesSemana].gastos.push(item);
    acc[lunesSemana].total += Number(item.amount);
    return acc;
  }, {} as Record<string, { lunes: string; gastos: typeof gastosAnteriores; total: number }>);

  const listaSemanasPasadas = Object.values(semanasPasadasMap);
  const semanaSeleccionada = params.verSemana 
    ? listaSemanasPasadas.find(s => s.lunes === params.verSemana) 
    : null;

  const limiteBase = Number(currentProfile.spendingLimit);
  
  const yaFueProcesadaEstaSemana = cookieStore.get(`semana_procesada_${currentProfile.id}_${strLunesActual}`)?.value === "true";
  const mostrarModalSemana = gastosAnteriores.length > 0 && !yaFueProcesadaEstaSemana && !params.confirmarAccion;

  const totalGastadoAnterior = gastosAnteriores.reduce((sum, item) => sum + Number(item.amount), 0);
  const sobranteCalculado = Math.max(0, limiteBase - totalGastadoAnterior);

  const totalGasto = listaGastos.reduce((sum, item) => sum + Number(item.amount), 0);
  const restante = limiteBase - totalGasto;
  const porcentaje = Math.min(Math.round((totalGasto / limiteBase) * 100), 100);
  const excedeLimite = totalGasto > limiteBase;

  let barraColor = "bg-emerald-500";
  let badgeTexto = "Dentro del presupuesto";
  let badgeColor = "text-emerald-400";
  let cardGlow = "shadow-emerald-500/10 border-slate-800/80";
  let displayColor = "text-emerald-400";

  if (excedeLimite) {
    barraColor = "bg-rose-500 animate-pulse";
    badgeTexto = `⚠️ Excedido por $${Math.abs(restante).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
    badgeColor = "text-rose-400";
    cardGlow = "shadow-rose-500/30 border-rose-500/50";
    displayColor = "text-rose-400";
  } else if (porcentaje >= 75) {
    barraColor = "bg-amber-500";
    badgeTexto = "⚡ Cerca del límite";
    badgeColor = "text-amber-400";
    cardGlow = "shadow-amber-500/20 border-amber-500/40";
    displayColor = "text-amber-400";
  }

  const gastoAEditar = params.editExpenseId
    ? todosLosGastos.find((g) => g.id === Number(params.editExpenseId))
    : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      
      <div className="w-full max-w-[393px] bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
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

          <ProfileSelect
            profiles={allProfiles}
            currentProfileId={currentProfile.id}
          />
        </header>

        <section className={`bg-slate-950 border rounded-2xl p-5 shadow-lg transition-all duration-300 space-y-4 ${cardGlow}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                Dinero Disponible (Semana Actual)
              </span>
              <p className={`text-4xl font-extrabold mt-1 tracking-tight ${displayColor}`}>
                ${restante.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <span>Gastado hasta ahora:</span>
                <strong className="text-slate-200 font-bold">
                  ${totalGasto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
            
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 ${badgeColor}`}>
              {badgeTexto}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">
                Límite: ${limiteBase.toLocaleString("es-MX")}
              </span>
              
              <a 
                href={`/?profile=${currentProfile.id}&limitModal=true`}
                className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-lg transition-all shadow-sm active:scale-95"
              >
                <span>✏️</span>
                <span>Editar Límite</span>
              </a>
            </div>

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

        {/* Historial con botones de Editar y Eliminar */}
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-400 text-sm mr-1">-${Number(item.amount).toLocaleString("es-MX")}</span>
                      
                      <Link
                        href={`/?profile=${currentProfile.id}&editExpenseId=${item.id}`}
                        className="text-slate-400 hover:text-amber-400 font-bold px-1 rounded transition"
                        title="Editar Gasto"
                      >
                        ✏️
                      </Link>

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

        {/* 📚 SECCIÓN DE HISTORIAL DE SEMANAS PASADAS AGRUPADAS */}
        {listaSemanasPasadas.length > 0 && (
          <section className="space-y-2 pt-3 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>📚 Historial semanas pasadas</span>
              <span>{listaSemanasPasadas.length} semanas</span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {listaSemanasPasadas.map((semana) => {
                const fechaLunesFormatted = new Date(semana.lunes + "T00:00:00").toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                });

                return (
                  <a
                    key={semana.lunes}
                    href={`/?profile=${currentProfile.id}&verSemana=${semana.lunes}`}
                    className="bg-slate-950/60 hover:bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs transition block cursor-pointer group"
                  >
                    <div>
                      <span className="text-slate-200 font-semibold block group-hover:text-emerald-400 transition">
                        Semana del {fechaLunesFormatted}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{semana.gastos.length} movimientos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-300 text-sm">-${semana.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      <span className="text-slate-600 group-hover:text-slate-400">👁️</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <footer className="pt-2 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          <span>Sincronizado en tiempo real con Neon DB</span>
        </footer>

      </div>

      {/* MODAL DE NUEVA SEMANA */}
      {mostrarModalSemana && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <span className="text-3xl">🎉</span>
              <h2 className="text-lg font-bold text-white">¡Nueva semana detectada!</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                De la semana pasada te sobraron <strong className="text-emerald-400">${sobranteCalculado.toFixed(2)}</strong>. ¿Cómo deseas arrancar este nuevo ciclo?
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href={`/?profile=${currentProfile.id}&confirmarAccion=acumular`}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-500/20 text-center block transition active:scale-[0.98]"
              >
                Sumar sobrante (${(limiteBase + sobranteCalculado).toFixed(2)} total)
              </a>

              <a
                href={`/?profile=${currentProfile.id}&confirmarAccion=reiniciar`}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-xs text-center block transition active:scale-[0.98]"
              >
                Empezar limpio con mis ${limiteBase.toFixed(2)}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL DE CONFIRMACIÓN ANTES DE APLICAR LA ACCIÓN */}
      {params.confirmarAccion && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <span className="text-3xl">⚠️</span>
              <h2 className="text-base font-bold text-white">¿Confirmar acción?</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {params.confirmarAccion === "acumular"
                  ? `Se sumará el sobrante de $${sobranteCalculado.toFixed(2)} a tu límite para esta semana.`
                  : "Se iniciará la semana con tu límite limpio, archivando el periodo anterior."}
              </p>
            </div>

            <form action={handleProcesarSemana} className="space-y-2.5 pt-1">
              <input type="hidden" name="profileId" value={currentProfile.id} />
              <input type="hidden" name="accion" value={params.confirmarAccion} />
              <input type="hidden" name="sobrante" value={sobranteCalculado} />

              <SubmitButton
                label="Sí, confirmar"
                loadingLabel="Aplicando..."
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-500/20 text-center block transition active:scale-[0.98] cursor-pointer"
              />

              <a
                href={`/?profile=${currentProfile.id}`}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-xs text-center block transition active:scale-[0.98]"
              >
                Regresar / Cancelar
              </a>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VER EL DETALLE DE UNA SEMANA PASADA */}
      {semanaSeleccionada && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white">Detalle de Semana</h2>
                <p className="text-[11px] text-slate-400">
                  Corte iniciado el {new Date(semanaSeleccionada.lunes + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                -${semanaSeleccionada.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 pt-1">
              {semanaSeleccionada.gastos.map((gasto) => {
                const fechaGasto = gasto.createdAt
                  ? new Date(gasto.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
                  : "";

                return (
                  <div key={gasto.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-200 font-semibold block">{gasto.concept}</span>
                      <span className="text-[10px] text-slate-500 block">📅 {fechaGasto}</span>
                    </div>
                    <span className="font-bold text-rose-400">-${Number(gasto.amount).toLocaleString("es-MX")}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <a
                href={`/?profile=${currentProfile.id}`}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs text-center block transition"
              >
                Cerrar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR GASTO */}
      {gastoAEditar && (
        <EditExpenseForm
          expense={gastoAEditar}
          profileId={currentProfile.id}
        />
      )}

      {/* MODAL PARA EDITAR LÍMITE */}
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
                defaultValue={limiteBase}
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