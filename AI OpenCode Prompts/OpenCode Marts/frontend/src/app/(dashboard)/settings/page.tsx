"use client";

import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("nav");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("settings")}</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500">User profile and platform settings.</p>
      </div>
    </div>
  );
}
