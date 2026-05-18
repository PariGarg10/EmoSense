import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  displayName?: string,
): Promise<{ role: UserRole; displayName: string | null }> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      role: existing.role as UserRole,
      displayName: existing.display_name,
    };
  }

  const name =
    displayName?.trim() ||
    (typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null) ||
    user.email?.split("@")[0] ||
    "User";

  await supabase.from("profiles").insert({
    id: user.id,
    display_name: name,
    role: "user",
  });

  return { role: "user", displayName: name };
}
