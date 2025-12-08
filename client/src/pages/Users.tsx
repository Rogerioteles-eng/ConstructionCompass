// src/pages/Users.tsx
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import UserForm from "../components/UserForm";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("id, email, name, role");
    if (!error && data) setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Usuários</h1>
      <UserForm onUserCreated={fetchUsers} />

      <table className="w-full mt-6 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Nome</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Papel</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="text-center">
              <td className="p-2 border">{user.name}</td>
              <td className="p-2 border">{user.email}</td>
              <td className="p-2 border capitalize">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
