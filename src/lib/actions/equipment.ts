"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { equipment } from "@/db/schema";
import { auth } from "@/lib/auth";
import { canManageEquipment } from "@/lib/permissions";

const equipmentSchema = z.object({
  name: z.string().min(2),
  inventoryCode: z.string().min(2),
  workshop: z.string().min(1),
  type: z.string().min(1),
});

async function requireEquipmentManager() {
  const session = await auth();
  if (!session?.user || !canManageEquipment(session.user.role)) {
    throw new Error("Недостаточно прав");
  }
  return session;
}

export async function createEquipmentAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  await requireEquipmentManager();

  const parsed = equipmentSchema.safeParse({
    name: formData.get("name"),
    inventoryCode: formData.get("inventoryCode"),
    workshop: formData.get("workshop"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: "Проверьте корректность полей" };
  }

  try {
    await db.insert(equipment).values(parsed.data);
  } catch {
    return { error: "Инвентарный номер уже используется" };
  }

  revalidatePath("/equipment");
  revalidatePath("/requests");
  return { success: "Оборудование добавлено" };
}

export async function updateEquipmentAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  await requireEquipmentManager();

  const id = String(formData.get("id") ?? "");
  const parsed = equipmentSchema.safeParse({
    name: formData.get("name"),
    inventoryCode: formData.get("inventoryCode"),
    workshop: formData.get("workshop"),
    type: formData.get("type"),
  });

  if (!id || !parsed.success) {
    return { error: "Проверьте корректность полей" };
  }

  try {
    await db.update(equipment).set(parsed.data).where(eq(equipment.id, id));
  } catch {
    return { error: "Не удалось обновить запись" };
  }

  revalidatePath("/equipment");
  return { success: "Сохранено" };
}

export async function deleteEquipmentAction(formData: FormData) {
  await requireEquipmentManager();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не указан id");

  await db.delete(equipment).where(eq(equipment.id, id));
  revalidatePath("/equipment");
}
