"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  repairRequests,
  users,
  equipment,
  type Priority,
  type RequestStatus,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  canAssignRequest,
  canCreateRequest,
  canEditAnyRequest,
} from "@/lib/permissions";

const requestSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  equipmentId: z.uuid(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  slaHours: z.coerce.number().int().min(1).max(720),
  assigneeId: z.union([z.uuid(), z.literal("")]),
});

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Требуется авторизация");
  return session;
}

function applyAssignment(
  assigneeId: string | undefined | null,
  currentStatus: RequestStatus
) {
  if (assigneeId) {
    return {
      assigneeId,
      assignedAt: new Date(),
      status:
        currentStatus === "new" || currentStatus === "assigned"
          ? ("assigned" as const)
          : currentStatus,
    };
  }
  return {
    assigneeId: null,
    assignedAt: null,
    status: currentStatus === "assigned" ? ("new" as const) : currentStatus,
  };
}

export async function createRequestAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  if (!canCreateRequest(session.user.role)) {
    return { error: "Недостаточно прав" };
  }

  const parsed = requestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    equipmentId: formData.get("equipmentId"),
    priority: formData.get("priority"),
    slaHours: formData.get("slaHours"),
    assigneeId: formData.get("assigneeId") || "",
  });

  if (!parsed.success) {
    return { error: "Проверьте корректность полей" };
  }

  const assigneeId = parsed.data.assigneeId || null;
  const assignment = applyAssignment(assigneeId, "new");

  await db.insert(repairRequests).values({
    title: parsed.data.title,
    description: parsed.data.description,
    equipmentId: parsed.data.equipmentId,
    priority: parsed.data.priority,
    slaHours: parsed.data.slaHours,
    createdById: session.user.id,
    ...assignment,
  });

  revalidatePath("/requests");
  revalidatePath("/");
  revalidatePath("/analytics");
  return { success: "Заявка создана" };
}

export async function updateRequestAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Не указан id" };

  const [existing] = await db
    .select()
    .from(repairRequests)
    .where(eq(repairRequests.id, id))
    .limit(1);

  if (!existing) return { error: "Заявка не найдена" };

  const isOwnerMaster =
    session.user.role === "master" && existing.assigneeId === session.user.id;

  if (!canEditAnyRequest(session.user.role) && !isOwnerMaster) {
    return { error: "Недостаточно прав" };
  }

  if (canEditAnyRequest(session.user.role)) {
    const parsed = requestSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      equipmentId: formData.get("equipmentId"),
      priority: formData.get("priority"),
      slaHours: formData.get("slaHours"),
      assigneeId: formData.get("assigneeId") || "",
    });

    if (!parsed.success) {
      return { error: "Проверьте корректность полей" };
    }

    const assigneeId = parsed.data.assigneeId || null;
    const assignment = canAssignRequest(session.user.role)
      ? applyAssignment(assigneeId, existing.status)
      : {};

    await db
      .update(repairRequests)
      .set({
        title: parsed.data.title,
        description: parsed.data.description,
        equipmentId: parsed.data.equipmentId,
        priority: parsed.data.priority,
        slaHours: parsed.data.slaHours,
        ...assignment,
      })
      .where(eq(repairRequests.id, id));
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  revalidatePath("/");
  revalidatePath("/analytics");
  return { success: "Заявка обновлена" };
}

export async function updateRequestStatusAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as RequestStatus;
  const workComment = String(formData.get("workComment") ?? "");
  const assigneeIdRaw = formData.get("assigneeId");

  const allowed: RequestStatus[] = [
    "new",
    "assigned",
    "in_progress",
    "done",
    "cancelled",
  ];
  if (!id || !allowed.includes(status)) {
    return { error: "Некорректный статус" };
  }

  const [existing] = await db
    .select()
    .from(repairRequests)
    .where(eq(repairRequests.id, id))
    .limit(1);

  if (!existing) return { error: "Заявка не найдена" };

  const isAssignee =
    session.user.role === "master" && existing.assigneeId === session.user.id;

  if (!canEditAnyRequest(session.user.role) && !isAssignee) {
    return { error: "Недостаточно прав" };
  }

  if (
    session.user.role === "master" &&
    !["in_progress", "done", "assigned"].includes(status)
  ) {
    return { error: "Мастер может только вести и закрывать свои заявки" };
  }

  const patch: Partial<typeof repairRequests.$inferInsert> = {
    status,
  };

  if (workComment) {
    patch.workComment = workComment;
  }

  if (
    canAssignRequest(session.user.role) &&
    typeof assigneeIdRaw === "string" &&
    assigneeIdRaw.length > 0
  ) {
    Object.assign(patch, applyAssignment(assigneeIdRaw, status));
    if (status === "new") {
      patch.status = "assigned";
    }
  }

  if (status === "in_progress" && !existing.startedAt) {
    patch.startedAt = new Date();
  }
  if (status === "done") {
    patch.completedAt = new Date();
    if (!existing.startedAt) patch.startedAt = existing.createdAt;
  }
  if (status !== "done") {
    patch.completedAt = null;
  }
  if (status === "new" || status === "cancelled") {
    if (status === "cancelled") {
      // keep assignee history
    }
  }

  await db.update(repairRequests).set(patch).where(eq(repairRequests.id, id));

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  revalidatePath("/");
  revalidatePath("/analytics");
  return { success: "Статус обновлён" };
}

export async function deleteRequestAction(formData: FormData) {
  const session = await requireSession();
  if (!canEditAnyRequest(session.user.role)) {
    throw new Error("Недостаточно прав");
  }

  const id = String(formData.get("id") ?? "");
  await db.delete(repairRequests).where(eq(repairRequests.id, id));
  revalidatePath("/requests");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function getRequests(filters?: {
  status?: RequestStatus | "";
  priority?: Priority | "";
  assigneeId?: string;
  workshop?: string;
  from?: string;
  to?: string;
  forMasterId?: string;
}) {
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(repairRequests.status, filters.status));
  }
  if (filters?.priority) {
    conditions.push(eq(repairRequests.priority, filters.priority));
  }
  if (filters?.assigneeId) {
    conditions.push(eq(repairRequests.assigneeId, filters.assigneeId));
  }
  if (filters?.forMasterId) {
    conditions.push(eq(repairRequests.assigneeId, filters.forMasterId));
  }
  if (filters?.from) {
    conditions.push(gte(repairRequests.createdAt, new Date(filters.from)));
  }
  if (filters?.to) {
    conditions.push(lte(repairRequests.createdAt, new Date(filters.to)));
  }
  if (filters?.workshop) {
    conditions.push(eq(equipment.workshop, filters.workshop));
  }

  const rows = await db
    .select({
      request: repairRequests,
      equipment,
      assignee: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(repairRequests)
    .innerJoin(equipment, eq(repairRequests.equipmentId, equipment.id))
    .leftJoin(users, eq(repairRequests.assigneeId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(repairRequests.createdAt));

  return rows;
}

export async function getRequestById(id: string) {
  const [row] = await db
    .select({
      request: repairRequests,
      equipment,
    })
    .from(repairRequests)
    .innerJoin(equipment, eq(repairRequests.equipmentId, equipment.id))
    .where(eq(repairRequests.id, id))
    .limit(1);

  if (!row) return null;

  const [createdBy] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, row.request.createdById))
    .limit(1);

  let assignee: {
    id: string;
    name: string;
    email: string;
    role: (typeof users.$inferSelect)["role"];
  } | null = null;

  if (row.request.assigneeId) {
    const [a] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, row.request.assigneeId))
      .limit(1);
    assignee = a ?? null;
  }

  return {
    request: row.request,
    equipment: row.equipment,
    createdBy: createdBy!,
    assignee,
  };
}

export async function getMasterUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.role, "master"));
}
