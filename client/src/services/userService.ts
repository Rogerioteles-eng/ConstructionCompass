import { supabase } from "../lib/supabaseClient";

export async function getUsers() {
  const { data, error } = await supabase.from("usuarios").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createUser({ nome, role }: { nome: string; role: string }) {
  const { data, error } = await supabase.from("usuarios").insert([{ nome, role }]);
  if (error) throw error;
  return data;
}
