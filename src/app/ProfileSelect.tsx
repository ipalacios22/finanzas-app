"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface Profile {
  id: number;
  name: string;
}

export default function ProfileSelect({
  profiles,
  currentProfileId,
}: {
  profiles: Profile[];
  currentProfileId: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    startTransition(() => {
      router.push(`/?profile=${selectedId}`);
    });
  };

  return (
    <div className="relative">
      <select
        value={currentProfileId}
        onChange={handleChange}
        disabled={isPending}
        className={`w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer pr-10 shadow-inner transition ${
          isPending ? "opacity-60 cursor-wait" : ""
        }`}
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id} className="bg-slate-900 text-white">
            {isPending && p.id === currentProfileId
              ? "⏳ Cargando perfil..."
              : `👤 Perfil: ${p.name}`}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-xs">
        {isPending ? (
          <svg
            className="animate-spin h-3.5 w-3.5 text-emerald-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          "▼"
        )}
      </div>
    </div>
  );
}