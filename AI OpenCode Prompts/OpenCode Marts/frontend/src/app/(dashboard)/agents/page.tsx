"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  domain: string;
  locale: string;
  is_active: boolean;
}

export default function AgentsPage() {
  const t = useTranslations("agents");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      api.setToken(token);
      api.get<Agent[]>("/agents/").then(setAgents).catch(console.error);
    }
  }, []);

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) return;
    api.setToken(token);
    const agent = await api.post<Agent>("/agents/", { name });
    setAgents([...agents, agent]);
    setName("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
          {t("createAgent")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAgent} className="bg-white p-6 rounded-xl shadow-sm mb-6 max-w-md">
          <label className="block text-sm font-medium mb-2">{t("name")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-4" required />
          <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg">
            Create
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <p className="text-sm text-gray-500">{agent.domain} · {agent.locale}</p>
            <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded border ${agent.is_active ? "border-black text-black" : "border-gray-300 text-gray-500"}`}>
              {agent.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
