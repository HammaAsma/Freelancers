// src/pages/Projects.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/client";
import { Plus, Pencil, Trash2, BarChart2, ListTodo } from "lucide-react";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [form, setForm] = useState({
    name: "",
    client_id: "",
    billing_type: "hourly",
    hourly_rate: "",
    fixed_amount: "",
    status: "active",
    start_date: "",
    end_date_estimated: "",
    description: "",
  });
  const [errors, setErrors] = useState([]);

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get("/projects", {
        params: { page, limit: 10 },
      });
      setProjects(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (e) {
      console.error("error fetch projects", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get("/clients", {
        params: { page: 1, limit: 100 },
      });
      setClients(res.data.data || []);
    } catch (e) {
      console.error("error fetch clients for select", e);
    }
  };

  useEffect(() => {
    fetchProjects(1);
    fetchClients();
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setForm({
      name: "",
      client_id: "",
      billing_type: "hourly",
      hourly_rate: "",
      fixed_amount: "",
      status: "active",
      start_date: "",
      end_date_estimated: "",
      description: "",
    });
    setErrors([]);
    setFormOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name || "",
      client_id: project.client_id?.toString() || "",
      billing_type: project.billing_type || "hourly",
      hourly_rate: project.hourly_rate || "",
      fixed_amount: project.fixed_amount || "",
      status: project.status || "active",
      start_date: project.start_date ? project.start_date.slice(0, 10) : "",
      end_date_estimated: project.end_date_estimated
        ? project.end_date_estimated.slice(0, 10)
        : "",
      description: project.description || "",
    });
    setErrors([]);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce projet ?")) return;
    try {
      await axios.delete(`/projects/${id}`);
      fetchProjects(pagination.page);
    } catch (e) {
      console.error("error delete project", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    try {
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        hourly_rate:
          form.billing_type === "hourly"
            ? Number(form.hourly_rate || 0)
            : undefined,
        fixed_amount:
          form.billing_type === "fixed"
            ? Number(form.fixed_amount || 0)
            : undefined,
      };

      if (editingProject) {
        await axios.put(`/projects/${editingProject.id}`, payload);
      } else {
        await axios.post("/projects", payload);
      }

      setFormOpen(false);
      fetchProjects(pagination.page);
    } catch (e) {
      if (e.response?.data?.data) {
        setErrors(e.response.data.data);
      }
      console.error("error save project", e);
    }
  };

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((p) => ({ ...p, page: newPage }));
    fetchProjects(newPage);
  };

  const openStats = async (project) => {
    try {
      const res = await axios.get(`/projects/${project.id}/stats`);
      setProjectStats({ project, stats: res.data.data });
      setStatsOpen(true);
    } catch (e) {
      console.error("error get stats", e);
    }
  };

  const goToTasks = (projectId) => {
    navigate(`/dashboard/projects/${projectId}/tasks`);
  };

  return (
    <div className="space-y-6">
      {/* Header page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projets</h1>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Nouveau projet
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-base-200/40 border border-base-300/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-base-300/60 text-xs uppercase tracking-wide text-base-content/70">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nom</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Facturation</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Dates</th>
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
              ) : projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-base-content/60"
                  >
                    Aucun projet pour le moment.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-base-300/40 hover:bg-base-200/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-base-content/60 line-clamp-1">
                          {project.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{project.Client?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5">
                        {project.billing_type === "hourly"
                          ? `Horaire · ${project.hourly_rate || 0} € / h`
                          : `Forfait · ${project.fixed_amount || 0} €`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          project.status === "active"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : project.status === "completed"
                            ? "bg-sky-500/15 text-sky-300"
                            : "bg-yellow-500/15 text-yellow-300"
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-base-content/70">
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {project.end_date_estimated
                        ? new Date(
                            project.end_date_estimated
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => goToTasks(project.id)}
                        className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70"
                      >
                        <ListTodo className="h-3 w-3 mr-1" />
                        Tâches
                      </button>
                      <button
                        onClick={() => openStats(project)}
                        className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70"
                      >
                        <BarChart2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => openEdit(project)}
                        className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="inline-flex items-center justify-center rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
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

      {/* Modal formulaire projet (inchangé sauf client select) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-base-100 border border-base-300 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingProject ? "Modifier le projet" : "Nouveau projet"}
            </h2>

            {errors.length > 0 && (
              <ul className="mb-3 text-xs text-red-400 space-y-1">
                {errors.map((err) => (
                  <li key={err.msg}>• {err.msg}</li>
                ))}
              </ul>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">Nom</label>
                  <input
                    className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Client
                  </label>
                  <select
                    className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.client_id}
                    onChange={(e) =>
                      setForm({ ...form, client_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} (#{client.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Type de facturation
                  </label>
                  <select
                    className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.billing_type}
                    onChange={(e) =>
                      setForm({ ...form, billing_type: e.target.value })
                    }
                    required
                  >
                    <option value="hourly">Horaire</option>
                    <option value="fixed">Forfait</option>
                  </select>
                </div>

                {form.billing_type === "hourly" ? (
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Taux horaire (€)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.hourly_rate}
                      onChange={(e) =>
                        setForm({ ...form, hourly_rate: e.target.value })
                      }
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Montant forfait (€)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.fixed_amount}
                      onChange={(e) =>
                        setForm({ ...form, fixed_amount: e.target.value })
                      }
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                    <option value="active">Actif</option>
                    <option value="completed">Terminé</option>
                    <option value="on_hold">En pause</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Début
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.start_date}
                      onChange={(e) =>
                        setForm({ ...form, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Fin estimée
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.end_date_estimated}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          end_date_estimated: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
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
                  {editingProject ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal stats projet (inchangée) */}
      {statsOpen && projectStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-base-100 border border-base-300 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-2">
              Statistiques · {projectStats.project.name}
            </h2>
            <p className="text-xs text-base-content/60 mb-4">
              Vue d’ensemble du temps passé et du coût.
            </p>

            <div className="space-y-2 text-sm">
              <p>
                Heures totales :{" "}
                <span className="font-medium">
                  {projectStats.stats.totalHours}
                </span>
              </p>
              <p>
                Coût total :{" "}
                <span className="font-medium">
                  {projectStats.stats.totalCost} €
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
