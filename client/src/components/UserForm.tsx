// src/components/UserForm.tsx
import { useState } from "react";
import { supabase } from "../services/supabaseClient";

interface Props {
  onUserCreated: () => void;
}

export default function UserForm({ onUserCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("comprador");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      setMessage("Erro ao criar usuário: " + error?.message);
      return;
    }

    await supabase.from("users").insert({
      id: data.user.id,
      email,
      name,
      role,
    });

    setName("");
    setEmail("");
    setPassword("");
    setRole("comprador");
    setMessage("Usuário criado com sucesso!");
    onUserCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded shadow">
      <div className="mb-3">
        <input
          type="text"
          placeholder="Nome"
          className="p-2 border w-full rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <input
          type="email"
          placeholder="Email"
          className="p-2 border w-full rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <input
          type="password"
          placeholder="Senha"
          className="p-2 border w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <select
          className="p-2 border w-full rounded"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="comprador">Comprador</option>
          <option value="mestre">Mestre de Obras</option>
          <option value="trabalhador">Trabalhador</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Cadastrar Usuário
      </button>
      {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
    </form>
  );
}
