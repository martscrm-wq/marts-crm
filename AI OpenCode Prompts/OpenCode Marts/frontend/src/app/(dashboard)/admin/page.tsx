"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface Stats {
  total_users: number;
  total_agents: number;
  total_conversations: number;
  total_messages: number;
}

export default function AdminDashboard() {
  const t = useTranslations("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      api.setToken(token);
      api.get<Stats>("/dashboard/stats").then(setStats).catch(console.error);
    }
  }, []);

  const cards = [
    { label: t("totalUsers"), value: stats?.total_users ?? 0 },
    { label: t("totalAgents"), value: stats?.total_agents ?? 0 },
    { label: t("totalConversations"), value: stats?.total_conversations ?? 0 },
    { label: t("totalMessages"), value: stats?.total_messages ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
