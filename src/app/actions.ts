"use server";

import { db } from "../db";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProfile(formData: FormData) {
  const name = formData.get("name") as string;
  const spendingLimit = formData.get("spendingLimit") as string;
  const pin = (formData.get("pin") as string)?.trim() || "1234";

  if (!name.trim()) return;

  await db.insert(profiles).values({
    name: name.trim(),
    spendingLimit: spendingLimit || "2000.00",
    pin: pin,
  });

  revalidatePath("/perfiles");
  redirect("/perfiles");
}

export async function updateProfile(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const spendingLimit = formData.get("spendingLimit") as string;
  const pin = (formData.get("pin") as string)?.trim();

  if (!id || !name.trim()) return;

  const updateData: { name: string; spendingLimit: string; pin?: string } = {
    name: name.trim(),
    spendingLimit: spendingLimit || "2000.00",
  };

  if (pin) {
    updateData.pin = pin;
  }

  await db.update(profiles).set(updateData).where(eq(profiles.id, id));

  revalidatePath("/perfiles");
  redirect("/perfiles");
}

export async function deleteProfile(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await db.delete(profiles).where(eq(profiles.id, id));
  revalidatePath("/perfiles");
  revalidatePath("/");
}


export async function verifyMasterPin(inputPin: string) {
  const masterPin = process.env.MASTER_PIN;
  return inputPin.trim() === masterPin;
}