"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  label?: string;
  loadingLabel?: string;
  className?: string;
  icon?: string;
}

export default function SubmitButton({
  label = "Guardar",
  loadingLabel = "Guardando...",
  className = "w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-emerald-500/20 active:scale-[0.98] cursor-pointer",
  icon,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center justify-center gap-1.5 transition ${className} ${
        pending ? "opacity-70 cursor-not-allowed" : ""
      }`}
    >
      {pending ? (
        <>
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
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
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}