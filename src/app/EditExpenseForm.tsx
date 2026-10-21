"use client";

import Link from "next/link";
import SubmitButton from "./SubmitButton";
import { updateExpense } from "./actions";

interface Expense {
  id: number;
  amount: string;
  concept: string;
}

export default function EditExpenseForm({
  expense,
  profileId,
}: {
  expense: Expense;
  profileId: number;
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-base font-bold text-white">Editar Gasto</h2>

        <form
          action={async (formData) => {
            await updateExpense(formData);
            window.location.href = `/?profile=${profileId}`;
          }}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={expense.id} />

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Monto ($)</label>
            <input
              type="number"
              name="amount"
              defaultValue={expense.amount}
              required
              step="any"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Concepto / Nota</label>
            <input
              type="text"
              name="concept"
              defaultValue={expense.concept}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Link
              href={`/?profile=${profileId}`}
              className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs text-center transition flex items-center justify-center"
            >
              Cancelar
            </Link>
            <SubmitButton
              label="Guardar Cambios"
              loadingLabel="Guardando..."
              icon="✏️"
              className="w-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer"
            />
          </div>
        </form>
      </div>
    </div>
  );
}