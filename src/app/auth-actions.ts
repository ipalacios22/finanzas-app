"use server";

import { db } from "../db";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Autenticar PIN de un perfil (Cookie de sesión temporal de navegador)
export async function loginWithPin(formData: FormData) {
  const profileId = Number(formData.get("profileId"));
  const pinInput = (formData.get("pin") as string)?.trim();

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));

  if (!profile || profile.pin !== pinInput) {
    redirect(`/?profile=${profileId}&error=pin_incorrecto`);
  }

  const cookieStore = await cookies();
  
  // Guardamos la sesión del perfil activo
  cookieStore.set("active_auth_profile", profileId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect(`/?profile=${profileId}`);
}

// Cambiar de perfil (Limpia la sesión activa para obligar a pedir PIN en el nuevo)
export async function switchProfile(formData: FormData) {
  const targetProfileId = Number(formData.get("targetProfileId"));

  const cookieStore = await cookies();
  // Borramos la sesión autenticada activa
  cookieStore.delete("active_auth_profile");

  redirect(`/?profile=${targetProfileId}`);
}

// Bloquear / Cerrar Sesión Manualmente
export async function lockSession(profileId: number) {
  const cookieStore = await cookies();
  cookieStore.delete("active_auth_profile");
  redirect(`/?profile=${profileId}`);
}