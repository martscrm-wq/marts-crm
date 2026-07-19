"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", form);
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">{t("registerTitle")}</h1>
        {error && <p className="text-black text-sm text-center">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">{t("fullName")}</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("email")}</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("password")}</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg" required />
        </div>
        <button type="submit" className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800">
          {t("register")}
        </button>
      </form>
    </div>
  );
}
