"use client";

import { useTransition } from "react";
import { switchProfile } from "./auth-actions";

interface Profile {
  id: number;
  name: string;
}

export default function ProfileSelect({
  profiles = [],
  currentProfileId,
}: {
  profiles?: Profile[];
  currentProfileId: number;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    if (selectedId === currentProfileId) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("targetProfileId", selectedId.toString());
      await switchProfile(formData);
    });
  };

  return (
    <div className="relative">
      <select
        value={currentProfileId}
        onChange={handleChange}
        disabled={isPending}
        className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id} className="bg-slate-900 text-white">
            👤 Perfil: {profile.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
        {isPending ? "⏳" : "▼"}
      </div>
    </div>
  );
}