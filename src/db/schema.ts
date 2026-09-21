import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "dispatcher",
  "master",
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "new",
  "assigned",
  "in_progress",
  "done",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("master"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const equipment = pgTable("equipment", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  inventoryCode: text("inventory_code").notNull().unique(),
  workshop: text("workshop").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const repairRequests = pgTable("repair_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  workComment: text("work_comment"),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id),
  priority: priorityEnum("priority").notNull().default("medium"),
  status: requestStatusEnum("status").notNull().default("new"),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  slaHours: integer("sla_hours").notNull().default(48),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const usersRelations = relations(users, ({ many }) => ({
  createdRequests: many(repairRequests, { relationName: "createdBy" }),
  assignedRequests: many(repairRequests, { relationName: "assignee" }),
}));

export const equipmentRelations = relations(equipment, ({ many }) => ({
  requests: many(repairRequests),
}));

export const repairRequestsRelations = relations(
  repairRequests,
  ({ one }) => ({
    equipment: one(equipment, {
      fields: [repairRequests.equipmentId],
      references: [equipment.id],
    }),
    createdBy: one(users, {
      fields: [repairRequests.createdById],
      references: [users.id],
      relationName: "createdBy",
    }),
    assignee: one(users, {
      fields: [repairRequests.assigneeId],
      references: [users.id],
      relationName: "assignee",
    }),
  })
);

export type User = typeof users.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type RepairRequest = typeof repairRequests.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type RequestStatus = (typeof requestStatusEnum.enumValues)[number];
