import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Carte de section du dashboard avec titre optionnel et lien "Voir tout"
 */
export default function DashboardCard({
  title,
  href,
  linkLabel = "Voir tout",
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-xl border border-base-300/50 bg-base-100 shadow-sm overflow-hidden ${className}`}
    >
      <div className="border-b border-base-300/50 bg-base-100/80 px-5 py-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
          {title}
        </h3>
        {href && (
          <Link
            to={href}
            className="text-xs font-medium text-primary hover:text-primary/80 inline-flex items-center gap-0.5"
          >
            {linkLabel}
            <ChevronRight className="h-3.5 w-3" />
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
