import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao fazer login");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: (err: Error) => setError(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao registrar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600">ConstructionCompass</h1>
          <p className="text-gray-500 mt-2">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="seu_usuario"
              required
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="seu@email.com"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold"
          >
            {isLoading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar Conta"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          {mode === "login" ? (
            <>
              Não tem conta?{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-orange-600 font-semibold">
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="text-orange-600 font-semibold">
                Entrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}