import { CalendarDays, CircleCheckBig, ListTodo, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router";

const items = [
  { to: "/", label: "Hari Ini", icon: CircleCheckBig, match: (p: string) => p === "/" || p.startsWith("/day") },
  { to: "/calendar", label: "Kalender", icon: CalendarDays, match: (p: string) => p.startsWith("/calendar") },
  { to: "/habits", label: "Kegiatan", icon: ListTodo, match: (p: string) => p.startsWith("/habits") },
  { to: "/settings", label: "Pengaturan", icon: Settings, match: (p: string) => p.startsWith("/settings") },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                  active ? "text-pine" : "text-muted"
                }`}
              >
                <span className={`grid h-7 w-14 place-items-center rounded-full transition ${active ? "bg-pine-soft" : ""}`}>
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
