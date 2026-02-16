import DashboardCard from "./DashboardCard";

const STATUS_LABEL = {
  active: "Actif",
  completed: "Terminé",
  on_hold: "En pause",
};

export default function ProjectsOverview({ projects }) {
  return (
    <DashboardCard
      title="Projets récents"
      href="/dashboard/projects"
      linkLabel="Voir tout"
    >
      {!projects || projects.length === 0 ? (
        <p className="text-sm text-base-content/60 py-2">Aucun projet.</p>
      ) : (
        <ul className="divide-y divide-base-300/40">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex justify-between items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm font-medium text-base-content truncate">
                {project.name}
              </span>
              {project.status && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-base-200 text-base-content/70 shrink-0">
                  {STATUS_LABEL[project.status] || project.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
