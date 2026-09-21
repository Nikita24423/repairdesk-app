-- Generated schema for RepairDesk (PostgreSQL)
CREATE TYPE "public"."user_role" AS ENUM('admin', 'dispatcher', 'master');
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'critical');
CREATE TYPE "public"."request_status" AS ENUM('new', 'assigned', 'in_progress', 'done', 'cancelled');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" "user_role" DEFAULT 'master' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "equipment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "inventory_code" text NOT NULL UNIQUE,
  "workshop" text NOT NULL,
  "type" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "repair_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "work_comment" text,
  "equipment_id" uuid NOT NULL REFERENCES "equipment"("id"),
  "priority" "priority" DEFAULT 'medium' NOT NULL,
  "status" "request_status" DEFAULT 'new' NOT NULL,
  "created_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "assignee_id" uuid REFERENCES "users"("id"),
  "sla_hours" integer DEFAULT 48 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "assigned_at" timestamp with time zone,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone
);
