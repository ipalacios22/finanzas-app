"use server";

import { db } from "../db";
import { profiles, expenses } from "../db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Crear un nuevo perfil
export async function createProfile(formData: FormData) {
  const name = formData.get("name") as string;
  const spendingLimit = formData.get("spendingLimit") as string;

  if (!name || !name.trim()) return;

  await db.insert(profiles).values({
    name: name.trim(),
    spendingLimit: spendingLimit && Number(spendingLimit) > 0 ? spendingLimit : "2000.00",
  });

  revalidatePath("/");
  revalidatePath("/perfiles");
}

// Editar/Actualizar un perfil
export async function updateProfile(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const spendingLimit = formData.get("spendingLimit") as string;

  if (!id) return;

  await db
    .update(profiles)
    .set({
      name: name.trim(),
      spendingLimit: spendingLimit ? spendingLimit : "2000.00",
    })
    .where(eq(profiles.id, id));

  revalidatePath("/");
  revalidatePath("/perfiles");
}

// Eliminar un perfil (los gastos asociados se eliminarán en cascada)
export async function deleteProfile(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await db.delete(profiles).where(eq(profiles.id, id));

  revalidatePath("/");
  revalidatePath("/perfiles");
}