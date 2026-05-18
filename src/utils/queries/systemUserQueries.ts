import { queryOptions } from "@tanstack/react-query";
import { supabase } from "#/utils/supabase";

export interface Role {
  id: number;
  role_name: string;
}

export interface SystemUser {
  id: number;
  email: string;
  created_at: string;
  admin_user_id: number | null;
  role_name: string | null;
  archive_status: number | null;
}

async function fetchSystemUsers(): Promise<SystemUser[]> {
  const { data, error } = await supabase
    .from("admin_users")
    .select(
      "id, email, created_at, admin_user_id, archive_status, roles!admin_user_id(role_name)",
    )
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    email: row.email,
    created_at: row.created_at,
    admin_user_id: row.admin_user_id,
    archive_status: row.archive_status ?? null,
    role_name: row.roles?.role_name ?? null,
  }));
}

export const systemUsersQueryOptions = queryOptions({
  queryKey: ["system_users"],
  queryFn: fetchSystemUsers,
});

async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("id, role_name")
    .order("role_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Role[];
}

export const rolesQueryOptions = queryOptions({
  queryKey: ["roles"],
  queryFn: fetchRoles,
});

export async function updateUserRole(
  userId: number,
  roleId: number | null,
): Promise<void> {
  const { error } = await supabase
    .from("admin_users")
    .update({ admin_user_id: roleId })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function addAdminUser(
  email: string,
  roleId: number,
): Promise<void> {
  const { error } = await supabase
    .from("admin_users")
    .insert({ email, admin_user_id: roleId });

  if (error) throw new Error(error.message);
}

export async function archiveAdminUser(userId: number): Promise<void> {
  const { error } = await supabase
    .from("admin_users")
    .update({ archive_status: 1 })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function unarchiveAdminUser(userId: number): Promise<void> {
  const { error } = await supabase
    .from("admin_users")
    .update({ archive_status: 0 })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
