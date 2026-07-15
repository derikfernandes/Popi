import { POPI, UserProfile, UserRole } from "./types";

export function isAdminProfile(profile: UserProfile | null | undefined): boolean {
  return !!profile && profile.active && profile.role === "admin";
}

export function isActiveUser(profile: UserProfile | null | undefined): boolean {
  return !!profile && profile.active;
}

export function canApprovePopi(profile: UserProfile | null | undefined): boolean {
  return isAdminProfile(profile);
}

export function canManageUsers(profile: UserProfile | null | undefined): boolean {
  return isAdminProfile(profile);
}

export function canManageSecretarias(profile: UserProfile | null | undefined): boolean {
  return isAdminProfile(profile);
}

export function canManagePrompts(profile: UserProfile | null | undefined): boolean {
  return isAdminProfile(profile);
}

export function canAccessSecretaria(
  profile: UserProfile | null | undefined,
  secretariaId: string
): boolean {
  if (!profile || !profile.active) return false;
  if (profile.role === "admin") return true;
  return profile.secretaria_ids.includes(secretariaId);
}

export function filterPopisForUser(
  popis: POPI[],
  profile: UserProfile | null | undefined
): POPI[] {
  if (!profile || !profile.active) return [];
  if (profile.role === "admin") return popis;
  const allowed = new Set(profile.secretaria_ids);
  return popis.filter((p) => allowed.has(p.secretaria_id));
}

export function roleLabel(role: UserRole): string {
  return role === "admin" ? "Administrador" : "Usuário";
}
