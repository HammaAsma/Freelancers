import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  StickyNote,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Projets", href: "/dashboard/projects", icon: FolderKanban },
  { name: "Factures", href: "/dashboard/factures", icon: FileText },
  { name: "Notes", href: "/dashboard/notes", icon: StickyNote },
];

const bottomNavigation = [
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? "w-16" : "w-64";

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // vide le user + token
    navigate("/login", { replace: true }); // redirection vers login
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen bg-base-200 border-r border-base-300
          transition-all duration-300
          ${width}
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-base-300 px-4">
            {!collapsed && (
              <span className="font-display text-xl font-bold text-base-content">
                Free<span className="text-primary">Lance</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Agrandir" : "Réduire"}
              className="h-9 w-9 flex items-center justify-center text-base-content/70 hover:bg-base-300 hover:text-base-content rounded-lg transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Main navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-content"
                      : "text-base-content/70 hover:bg-base-300 hover:text-base-content",
                  ].join(" ")
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom navigation */}
          <div className="border-t border-base-300 px-2 py-4">
            {bottomNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-content"
                      : "text-base-content/70 hover:bg-base-300 hover:text-base-content",
                  ].join(" ")
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/70 transition-all hover:bg-error/10 hover:text-error"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
