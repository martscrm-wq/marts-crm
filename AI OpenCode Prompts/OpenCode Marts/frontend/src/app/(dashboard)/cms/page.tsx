"use client";

import { useTranslations } from "next-intl";

export default function CMSPage() {
  const t = useTranslations("nav");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("cms")}</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500">Website builder and content management interface.</p>
      </div>
    </div>
  );
}
