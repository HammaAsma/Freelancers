import { Clock } from "lucide-react";

export default function TimeOverview({ activeTimer, hoursThisMonth }) {
  return (
    <section className="rounded-xl border border-base-300/50 bg-base-100 shadow-sm overflow-hidden">
      <div className="border-b border-base-300/50 bg-base-100/80 px-5 py-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/80">
          Temps & chrono
        </h3>
      </div>
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <span className="text-sm text-base-content/60">
            Heures ce mois
          </span>
          <span className="text-xl font-bold tabular-nums text-base-content">
            {hoursThisMonth ?? 0} h
          </span>
        </div>

        {activeTimer ? (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">
              Chrono en cours
            </p>
            <p className="text-sm font-medium text-base-content mt-1">
              {activeTimer.taskTitle}
            </p>
            <p className="text-xs text-primary mt-0.5 tabular-nums">
              {activeTimer.formatted}
            </p>
          </div>
        ) : (
          <p className="text-sm text-base-content/50">
            Aucun chrono en cours.
          </p>
        )}
      </div>
    </section>
  );
}
