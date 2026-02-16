import { Bell, Search, Moon, Sun, User2, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/useAuth";

export default function Header({ onToggleSidebar }) {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const { user } = useAuth();

  useEffect(() => {
    const html = document.documentElement;

    if (darkMode) {
      html.classList.add("dark");
      html.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      html.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (user) {
      console.log(user.name);
    }
  }, [user]);

  return (
    <header
      className="sticky top-0 z-30 h-16
                 flex items-center justify-between
                 border-b border-base-300
                 bg-base-100/80
                 px-4 md:px-6 backdrop-blur-lg
                 transition-all duration-300"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Menu"
          className="md:hidden shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100 hover:bg-base-200 transition-colors"
        >
          <Menu className="h-5 w-5 text-base-content" />
        </button>
        <div className="hidden sm:block relative flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50 pointer-events-none" />
          <input
            type="search"
            placeholder="Rechercher..."
            className="w-full h-10 rounded-xl border border-base-300 bg-base-200/50 pl-10 pr-4 text-sm placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Mode clair" : "Mode sombre"}
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-base-200 transition-colors text-base-content/80"
        >
          {darkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="relative h-10 w-10 flex items-center justify-center rounded-xl hover:bg-base-200 transition-colors text-base-content/80"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute right-1 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-base-100"
            aria-hidden
          />
        </button>

        <div className="flex items-center gap-3 border-l border-base-300 pl-4 ml-1">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User2 className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-base-content">
              {user
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                  "Utilisateur"
                : "Utilisateur"}
            </p>
            <p className="text-xs text-base-content/60 truncate max-w-[140px]">
              {user ? user.email : ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
