import DashboardCard from "./DashboardCard";

export default function NotesOverview({ notes }) {
  return (
    <DashboardCard
      title="Notes récentes"
      href="/dashboard/notes"
      linkLabel="Voir tout"
    >
      {!notes || notes.length === 0 ? (
        <p className="text-sm text-base-content/60 py-2">Aucune note.</p>
      ) : (
        <ul className="divide-y divide-base-300/40">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex justify-between items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm font-medium text-base-content line-clamp-1">
                {note.title}
              </span>
              {note.projectName && (
                <span className="text-xs text-base-content/50 shrink-0">
                  {note.projectName}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
