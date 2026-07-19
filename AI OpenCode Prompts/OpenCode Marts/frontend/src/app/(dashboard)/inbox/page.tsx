"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface Message {
  id: string;
  channel: string;
  direction: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function InboxPage() {
  const t = useTranslations("nav");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      api.setToken(token);
      api.get<Message[]>("/inbox/messages").then(setMessages).catch(console.error);
    }
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("inbox")}</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {messages.length === 0 && <p className="p-6 text-gray-500">No messages yet.</p>}
        {messages.map((msg) => (
          <div key={msg.id} className={`p-4 border-b border-gray-100 ${!msg.is_read ? "bg-gray-50" : ""}`}>
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">{msg.channel}</span>
              <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
