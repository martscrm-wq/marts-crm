"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const navItems = [
  { key: "dashboard", href: "/admin", icon: "📊" },
  { key: "agents", href: "/agents", icon: "🤖" },
  { key: "inbox", href: "/inbox", icon: "📬" },
  { key: "analytics", href: "/analytics", icon: "📈" },
  { key: "cms", href: "/cms", icon: "🌐" },
  { key: "settings", href: "/settings", icon: "⚙️" },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <div className="text-xl font-bold mb-8 text-black">Marts</div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                active ? "bg-gray-100 text-black font-medium" : "text-black hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
