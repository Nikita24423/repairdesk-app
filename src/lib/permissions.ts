import type { UserRole } from "@/db/schema";

export function canManageUsers(role: UserRole) {
  return role === "admin";
}

export function canManageEquipment(role: UserRole) {
  return role === "admin" || role === "dispatcher";
}

export function canCreateRequest(role: UserRole) {
  return role === "admin" || role === "dispatcher";
}

export function canEditAnyRequest(role: UserRole) {
  return role === "admin" || role === "dispatcher";
}

export function canAssignRequest(role: UserRole) {
  return role === "admin" || role === "dispatcher";
}

export function canUpdateAssignedRequest(role: UserRole) {
  return role === "admin" || role === "dispatcher" || role === "master";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Администратор";
    case "dispatcher":
      return "Диспетчер";
    case "master":
      return "Мастер";
  }
}
