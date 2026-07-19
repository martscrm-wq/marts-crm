"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post<{ access_token: string; refresh_token: string }>("/auth/login", { email, password });
      localStorage.setItem("access_token", res.access_token);
      api.setToken(res.access_token);
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">{t("loginTitle")}</h1>
        {error && <p className="text-black text-sm text-center">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">{t("email")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("password")}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg" required />
        </div>
        <button type="submit" className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800">
          {t("login")}
        </button>
      </form>
    </div>
  );
}
