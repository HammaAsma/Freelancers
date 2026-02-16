import DashboardCard from "./DashboardCard";

export default function TasksOverview({ tasks }) {
  return (
    <DashboardCard
      title="Tâches récentes"
      href="/dashboard/projects"
      linkLabel="Voir les projets"
    >
      {!tasks || tasks.length === 0 ? (
        <p className="text-sm text-base-content/60 py-2">Aucune tâche.</p>
      ) : (
        <ul className="divide-y divide-base-300/40">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex justify-between items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm font-medium text-base-content truncate">
                {task.title}
              </span>
              {(task.Project?.name || task.projectName) && (
                <span className="text-xs text-base-content/50 shrink-0">
                  {task.Project?.name || task.projectName}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
