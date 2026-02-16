import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/client";
import {
  Plus,
  Pencil,
  Trash2,
  BarChart2,
  Filter,
  ArrowLeft,
  Play,
  Square,
  Loader2,
} from "lucide-react";
import { useTimer } from "../contexts/TimerContext";

const STATUS_LABELS = {
  todo: "À faire",
  in_progress: "En cours",
  in_review: "En revue",
  completed: "Terminé",
  on_hold: "En pause",
};

const PRIORITY_LABELS = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};

// helper format HH:MM:SS
function formatSeconds(sec) {
  const s = Number(sec || 0);
  const h = Math.floor(s / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

export default function ProjectTasksPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [errors, setErrors] = useState([]);
  const [taskTimeTotals, setTaskTimeTotals] = useState({}); // taskId -> totalSeconds

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date_estimated_hours: "",
  });

  const { taskId: activeTaskId, totalSeconds, setActiveTimer, clearTimer } = useTimer();
  const [timerLoadingId, setTimerLoadingId] = useState(null);

  const fetchTasks = async (page = 1, status = "") => {
    try {
      setLoading(true);
      const res = await axios.get(`/projects/${projectId}/tasks`, {
        params: {
          page,
          limit: 10,
          status: status || undefined,
        },
      });
      const taskList = res.data.data || [];
      setTasks(taskList);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
      if (taskList.length > 0) {
        const totals = await fetchTaskTimeTotals(taskList.map((t) => t.id));
        setTaskTimeTotals((prev) => ({ ...prev, ...totals }));
      } else {
        setTaskTimeTotals({});
      }
    } catch (e) {
      console.error("error fetch tasks", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskTimeTotals = async (taskIds) => {
    const entries = await Promise.all(
      taskIds.map(async (id) => {
        try {
          const res = await axios.get(`/tasks/${id}/time/total`);
          return [id, res.data?.data?.totalSeconds ?? res.data?.totalSeconds ?? 0];
        } catch {
          return [id, 0];
        }
      })
    );
    return Object.fromEntries(entries);
  };

  const fetchProject = async () => {
    try {
      const res = await axios.get(`/projects/${projectId}`);
      setProject(res.data.data);
    } catch (e) {
      console.error("error fetch project", e);
    }
  };

  const fetchActiveTimer = async () => {
    try {
      const res = await axios.get(`/time-entries/active`, {
        params: { project_id: projectId },
      });
      const active = res.data?.data;
      if (active && active.task_id) {
      setActiveTimer({
        taskId: active.task_id,
        taskTitle: active.Task?.title,
        projectName: active.Task?.Project?.name,
        elapsedSeconds: active.elapsedSeconds ?? 0,
        totalSecondsBefore: active.totalSecondsBefore ?? 0,
      });
      }
    } catch (e) {
      console.error("error fetch active timer", e);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTasks(1, "");
    fetchActiveTimer();
  }, [projectId]);

  const openCreate = () => {
    setEditingTask(null);
    setForm({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date_estimated_hours: "",
    });
    setErrors([]);
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      due_date_estimated_hours: task.due_date_estimated_hours?.toString() || "",
    });
    setErrors([]);
    setFormOpen(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    try {
      await axios.delete(`/tasks/${taskId}`);
      fetchTasks(pagination.page, statusFilter);
    } catch (e) {
      console.error("error delete task", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        due_date_estimated_hours:
          form.due_date_estimated_hours !== ""
            ? Number(form.due_date_estimated_hours)
            : undefined,
      };

      if (editingTask) {
        await axios.put(`/tasks/${editingTask.id}`, payload);
      } else {
        await axios.post(`/projects/${projectId}/tasks`, payload);
      }

      setFormOpen(false);
      fetchTasks(pagination.page, statusFilter);
    } catch (e) {
      if (e.response?.data?.data) {
        setErrors(e.response.data.data);
      }
      console.error("error save task", e);
    }
  };

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((p) => ({ ...p, page: newPage }));
    fetchTasks(newPage, statusFilter);
  };

  const changeStatusFilter = (value) => {
    setStatusFilter(value);
    setPagination((p) => ({ ...p, page: 1 }));
    fetchTasks(1, value);
  };

  const openStats = async (task) => {
    try {
      const res = await axios.get(`/tasks/${task.id}/stats`);
      setTaskStats({ task, stats: res.data.data });
      setStatsOpen(true);
    } catch (e) {
      console.error("error get task stats", e);
    }
  };

  const handleStartTimer = async (task) => {
    try {
      setTimerLoadingId(task.id);
      if (activeTaskId && activeTaskId !== task.id) {
        await axios.post(`/tasks/${activeTaskId}/time/stop`);
        const totals = await fetchTaskTimeTotals([activeTaskId]);
        setTaskTimeTotals((prev) => ({ ...prev, ...totals }));
      }

      const res = await axios.post(`/tasks/${task.id}/time/start`);
      const started = res.data?.data;

      setActiveTimer({
        taskId: task.id,
        taskTitle: task.title,
        projectName: task.Project?.name,
        elapsedSeconds: started?.elapsedSeconds ?? 0,
        totalSecondsBefore: started?.totalSecondsBefore ?? 0,
      });
    } catch (e) {
      console.error("error start timer", e);
    } finally {
      setTimerLoadingId(null);
    }
  };

  const handleStopTimer = async (task) => {
    try {
      setTimerLoadingId(task.id);
      await axios.post(`/tasks/${task.id}/time/stop`);
      clearTimer();
      const totals = await fetchTaskTimeTotals([task.id]);
      setTaskTimeTotals((prev) => ({ ...prev, ...totals }));
    } catch (e) {
      console.error("error stop timer", e);
    } finally {
      setTimerLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/projects")}
            className="inline-flex items-center gap-1 rounded-lg border border-base-300 px-3 py-1.5 text-xs text-base-content/80 hover:bg-base-300/60"
          >
            <ArrowLeft className="h-3 w-3" />
            Projets
          </button>

          <div>
            <h1 className="text-2xl font-semibold">
              Tâches {project ? `· ${project.name}` : ""}
            </h1>
            <p className="text-sm text-base-content/60">
              Gérez les tâches du projet et le temps passé.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Nouvelle tâche
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-base-content/70">
          <Filter className="h-3 w-3" />
          <span>Filtrer par statut :</span>
          <select
            className="rounded-md border border-base-300 bg-base-100 px-2 py-1 text-xs"
            value={statusFilter}
            onChange={(e) => changeStatusFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="in_review">En revue</option>
            <option value="completed">Terminé</option>
            <option value="on_hold">En pause</option>
          </select>
        </div>
      </div>

      {/* Tableau des tâches */}
      <div className="overflow-hidden rounded-2xl bg-base-200/40 border border-base-300/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-base-300/60 text-xs uppercase tracking-wide text-base-content/70">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Titre</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Priorité</th>
                <th className="px-4 py-3 text-left font-medium">
                  Estimation (h)
                </th>
                <th className="px-4 py-3 text-left font-medium">Temps</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-base-content/60"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-base-content/60"
                  >
                    Aucune tâche pour ce projet.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const isActive = activeTaskId === task.id;
                  return (
                    <tr
                      key={task.id}
                      className="border-t border-base-300/40 hover:bg-base-200/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-base-content/60 line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            task.status === "todo"
                              ? "bg-slate-500/15 text-slate-300"
                              : task.status === "in_progress"
                              ? "bg-sky-500/15 text-sky-300"
                              : task.status === "in_review"
                              ? "bg-purple-500/15 text-purple-300"
                              : task.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-yellow-500/15 text-yellow-300"
                          }`}
                        >
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === "low"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : task.priority === "medium"
                              ? "bg-yellow-500/15 text-yellow-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {PRIORITY_LABELS[task.priority] || task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-base-content/80">
                        {task.due_date_estimated_hours ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-base-content/80 font-mono">
                        {isActive
                          ? formatSeconds(totalSeconds)
                          : (taskTimeTotals[task.id] ?? 0) > 0
                            ? formatSeconds(taskTimeTotals[task.id])
                            : "0:00:00"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {/* Timer buttons */}
                        <button
                          onClick={() =>
                            isActive
                              ? handleStopTimer(task)
                              : handleStartTimer(task)
                          }
                          disabled={timerLoadingId === task.id}
                          className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs ${
                            isActive
                              ? "border-red-500/60 text-red-400 hover:bg-red-500/10"
                              : "border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10"
                          } disabled:opacity-40`}
                        >
                          {timerLoadingId === task.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isActive ? (
                            <>
                              <Square className="h-3 w-3 mr-1" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => openStats(task)}
                          className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70"
                        >
                          <BarChart2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => openEdit(task)}
                          className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="inline-flex items-center justify-center rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-base-300/60 text-xs text-base-content/70">
          <span>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => changePage(pagination.page - 1)}
              className="px-3 py-1 rounded-md border border-base-300/70 bg-base-200/60 hover:bg-base-300/70 disabled:opacity-40"
              disabled={pagination.page <= 1}
            >
              Précédent
            </button>
            <button
              onClick={() => changePage(pagination.page + 1)}
              className="px-3 py-1 rounded-md border border-base-300/70 bg-base-200/60 hover:bg-base-300/70 disabled:opacity-40"
              disabled={pagination.page >= pagination.totalPages}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal formulaire tâche */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-base-100 border border-base-300 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
            </h2>

            {errors.length > 0 && (
              <ul className="mb-3 text-xs text-red-400 space-y-1">
                {errors.map((err) => (
                  <li key={err.msg}>• {err.msg}</li>
                ))}
              </ul>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Titre</label>
                <input
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Statut
                  </label>
                  <select
                    className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="in_review">En revue</option>
                    <option value="completed">Terminé</option>
                    <option value="on_hold">En pause</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Priorité
                  </label>
                  <select
                    className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Estimation (heures)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.due_date_estimated_hours}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        due_date_estimated_hours: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-3 py-2 text-xs rounded-lg border border-base-300 hover:bg-base-300/60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-content hover:brightness-110"
                >
                  {editingTask ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal stats tâche */}
      {statsOpen && taskStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-base-100 border border-base-300 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-2">
              Statistiques · {taskStats.task.title}
            </h2>
            <p className="text-xs text-base-content/60 mb-4">
              Temps passé et coût calculé à partir des saisies de temps.
            </p>

            <div className="space-y-2 text-sm">
              <p>
                Temps total (s) :{" "}
                <span className="font-medium">
                  {taskStats.stats.totalTimeSpent}
                </span>
              </p>
              <p>
                Heures totales :{" "}
                <span className="font-medium">
                  {taskStats.stats.totalHours.toFixed(2)}
                </span>
              </p>
              <p>
                Coût total :{" "}
                <span className="font-medium">
                  {taskStats.stats.totalCost.toFixed(2)} €
                </span>
              </p>
              <p>
                Taux horaire :{" "}
                <span className="font-medium">
                  {taskStats.stats.hourlyRate || 0} €
                </span>
              </p>
              <p>
                Heures estimées :{" "}
                <span className="font-medium">
                  {taskStats.stats.estimatedHours ?? "—"}
                </span>
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStatsOpen(false)}
                className="px-3 py-2 text-xs rounded-lg border border-base-300 hover:bg-base-300/60"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
