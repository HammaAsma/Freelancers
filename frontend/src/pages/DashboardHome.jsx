import {
  FolderKanban,
  CheckSquare,
  StickyNote,
  Clock,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import TasksOverview from "../components/dashboard/TasksOverview";
import ProjectsOverview from "../components/dashboard/ProjectsOverview";
import NotesOverview from "../components/dashboard/NotesOverview";
import TimeOverview from "../components/dashboard/TimeOverview";
import InvoiceOverview from "../components/dashboard/InvoiceOverview";
import StatCard from "../components/dashboard/StatCard";
import { useDashboard } from "../hooks/useDashboard";

function formatWelcomeDate() {
  const d = new Date();
  const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  return d.toLocaleDateString("fr-FR", options);
}

export default function DashboardHome() {
  const { data, loading, error } = useDashboard();

  const stats = data?.stats || {
    tasksInProgress: 0,
    activeProjects: 0,
    notesCount: 0,
    hoursThisMonth: 0,
    invoicesThisMonth: 0,
  };

  return (
    <div className="space-y-8">
      {/* En-tête de page */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-base-content/60">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-sm font-medium">Tableau de bord</span>
        </div>
        <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
          Vue d’ensemble
        </h1>
        <p className="text-sm text-base-content/60 mt-0.5">
          {loading
            ? "Chargement des données..."
            : `${formatWelcomeDate()} — Résumé de votre activité`}
        </p>
        {error && (
          <div className="mt-3 rounded-lg bg-error/10 border border-error/20 px-4 py-2 text-sm text-error">
            {error}
          </div>
        )}
      </header>

      {/* KPIs */}
      <section>
        <h2 className="sr-only">Indicateurs clés</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Tâches en cours"
            value={stats.tasksInProgress}
            icon={CheckSquare}
          />
          <StatCard
            title="Projets actifs"
            value={stats.activeProjects}
            icon={FolderKanban}
          />
          <StatCard title="Notes" value={stats.notesCount} icon={StickyNote} />
          <StatCard
            title="Heures ce mois"
            value={`${stats.hoursThisMonth} h`}
            icon={Clock}
          />
          <StatCard
            title="Factures ce mois"
            value={stats.invoicesThisMonth}
            icon={FileText}
          />
        </div>
      </section>

      {/* Activité récente — grille 2 colonnes sur grand écran */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-4">
          Activité récente
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <TasksOverview tasks={data?.lists?.recentTasks || []} />
            <ProjectsOverview projects={data?.lists?.recentProjects || []} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <NotesOverview notes={data?.lists?.recentNotes || []} />
            <div className="space-y-6 sm:contents">
              <InvoiceOverview invoices={data?.lists?.recentInvoices || []} />
              <TimeOverview
                hoursThisMonth={stats.hoursThisMonth}
                activeTimer={null}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
