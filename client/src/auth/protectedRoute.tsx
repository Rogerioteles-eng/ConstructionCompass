// src/auth/auth.ts
import { supabase } from "../services/supabaseClient";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  // Aqui buscamos o papel do usuário
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError) return null;
  return { ...data.user, role: profile.role };
}
