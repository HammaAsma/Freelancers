import { useEffect, useState } from "react";
import axios from "../api/client";
import { Plus, Pencil, Trash2, Loader2, StickyNote } from "lucide-react";

export default function NotesPage() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  // Sélection client/projet dans la modale
  const [modalClientId, setModalClientId] = useState("");
  const [modalProjects, setModalProjects] = useState([]);
  const [modalProjectId, setModalProjectId] = useState("");

  // Charger les clients
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const res = await axios.get("/clients", { params: { limit: 100 } });
      setClients(res.data.data || []);
    } catch (e) {
      console.error("error fetch clients for notes", e);
    } finally {
      setLoadingClients(false);
    }
  };

  // Charger les projets d’un client (liste principale)
  const fetchProjectsByClient = async (clientId) => {
    try {
      setLoadingProjects(true);
      const res = await axios.get("/projects", {
        params: { client_id: clientId, limit: 100 },
      });
      setProjects(res.data.data || []);
    } catch (e) {
      console.error("error fetch projects for client", e);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Charger les projets pour la modale
  const fetchModalProjects = async (clientId) => {
    try {
      const res = await axios.get("/projects", {
        params: { client_id: clientId, limit: 100 },
      });
      setModalProjects(res.data.data || []);
    } catch (e) {
      console.error("error fetch projects for modal", e);
    }
  };

  // Charger les notes d’un projet
  const fetchNotes = async (projectId, page = 1) => {
    if (!projectId) return;
    try {
      setLoadingNotes(true);
      const res = await axios.get(`/projects/${projectId}/notes`, {
        params: { page, limit: 10 },
      });
      setNotes(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (e) {
      console.error("error fetch notes", e);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Quand on change de client (nav principale)
  const handleSelectClient = (clientId) => {
    setSelectedClientId(clientId);
    setSelectedProjectId("");
    setSelectedProject(null);
    setProjects([]);
    setNotes([]);
    setPagination({ page: 1, totalPages: 1 });
    if (clientId) {
      fetchProjectsByClient(clientId);
    }
  };

  // Quand on change de projet (nav principale)
  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    const project = projects.find((p) => p.id === Number(projectId)) || null;
    setSelectedProject(project);
    if (projectId) {
      fetchNotes(projectId, 1);
    } else {
      setNotes([]);
      setPagination({ page: 1, totalPages: 1 });
    }
  };

  const changePage = (newPage) => {
    if (
      newPage < 1 ||
      newPage > (pagination.totalPages || 1) ||
      !selectedProjectId
    )
      return;
    setPagination((p) => ({ ...p, page: newPage }));
    fetchNotes(selectedProjectId, newPage);
  };

  const openCreate = () => {
    setEditingNote(null);
    setForm({ title: "", content: "" });
    setErrors([]);

    // Pré-remplir la modale avec les sélections courantes si disponibles
    setModalClientId(selectedClientId || "");
    setModalProjectId(selectedProjectId || "");
    setModalProjects(projects || []);

    // Si aucun client n'est encore choisi, on laisse l’utilisateur choisir
    setFormOpen(true);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setForm({ title: note.title || "", content: note.content || "" });
    setErrors([]);
    // Pour l’édition on ne change pas client/projet (ils sont déjà définis par la note)
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Pour la création, il faut un client et un projet choisis dans la modale
    if (!editingNote) {
      if (!modalClientId || !modalProjectId) {
        setErrors([{ msg: "Choisissez un client et un projet." }]);
        return;
      }
    }

    setFormLoading(true);
    setErrors([]);

    try {
      if (editingNote) {
        await axios.put(`/notes/${editingNote.id}`, form);
      } else {
        await axios.post(
          `/clients/${modalClientId}/projects/${modalProjectId}/notes`,
          form
        );
      }
      setFormOpen(false);

      // Si le projet de la modale est celui actuellement affiché, on rafraîchit
      const projectToRefresh = editingNote ? selectedProjectId : modalProjectId;

      if (projectToRefresh) {
        fetchNotes(projectToRefresh, pagination.page || 1);
      }
    } catch (err) {
      const apiErrors = err.response?.data?.data || err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        setErrors(apiErrors);
      }
      console.error("error save note", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Supprimer cette note ?")) return;
    try {
      setDeleteLoadingId(noteId);
      await axios.delete(`/notes/${noteId}`);
      if (selectedProjectId) {
        fetchNotes(selectedProjectId, pagination.page || 1);
      }
    } catch (e) {
      console.error("error delete note", e);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + nav client/projet */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <StickyNote className="h-6 w-6" />
              Notes
            </h1>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-content hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Nouvelle note
          </button>
        </div>

        {/* Nav client + projet */}
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex flex-col gap-2 md:w-1/3">
            <span className="text-xs font-medium text-base-content/70">
              Client
            </span>
            <select
              className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedClientId}
              onChange={(e) => handleSelectClient(e.target.value)}
            >
              <option value="">
                {loadingClients
                  ? "Chargement des clients..."
                  : "Sélectionner un client"}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (#{c.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 md:w-1/3">
            <span className="text-xs font-medium text-base-content/70">
              Projet
            </span>
            <select
              className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              disabled={!selectedClientId || loadingProjects}
            >
              <option value="">
                {!selectedClientId
                  ? "Choisissez un client d'abord"
                  : loadingProjects
                  ? "Chargement des projets..."
                  : "Sélectionner un projet"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des notes */}
      <div className="overflow-hidden rounded-2xl bg-base-200/40 border border-base-300/60 shadow-sm">
        {selectedProjectId ? (
          <>
            <div className="border-b border-base-300/60 px-4 py-3 text-xs text-base-content/70">
              {selectedProject ? (
                <span>
                  Client #{selectedProject.client_id} · Projet{" "}
                  <span className="font-medium">
                    {selectedProject.name} (#{selectedProject.id})
                  </span>
                </span>
              ) : (
                <span>Projet #{selectedProjectId}</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-base-300/60 text-xs uppercase tracking-wide text-base-content/70">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Titre</th>
                    <th className="px-4 py-3 text-left font-medium">Contenu</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Créée le
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingNotes ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-base-content/60"
                      >
                        Chargement des notes...
                      </td>
                    </tr>
                  ) : notes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-base-content/60"
                      >
                        Aucune note pour ce projet.
                      </td>
                    </tr>
                  ) : (
                    notes.map((note) => (
                      <tr
                        key={note.id}
                        className="border-t border-base-300/40 hover:bg-base-200/60 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{note.title}</td>
                        <td className="px-4 py-3 text-xs text-base-content/70 max-w-md">
                          <div className="line-clamp-2">
                            {note.content || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-base-content/70">
                          {note.createdAt
                            ? new Date(note.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => openEdit(note)}
                            className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={deleteLoadingId === note.id}
                            className="inline-flex items-center justify-center rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                          >
                            {deleteLoadingId === note.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
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
          </>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-base-content/60">
            Sélectionnez un client puis un projet pour voir ou ajouter des
            notes.
          </div>
        )}
      </div>

      {/* Modal create / edit note */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-base-100 border border-base-300 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingNote ? "Modifier la note" : "Nouvelle note"}
            </h2>

            {errors.length > 0 && (
              <ul className="mb-3 text-xs text-red-400 space-y-1">
                {errors.map((err, idx) => (
                  <li key={idx}>• {err.msg || err.message}</li>
                ))}
              </ul>
            )}

            {/* Sélection client / projet dans la modale (création) */}
            {!editingNote && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Client
                  </label>
                  <select
                    className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={modalClientId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setModalClientId(value);
                      setModalProjectId("");
                      setModalProjects([]);
                      if (value) {
                        fetchModalProjects(value);
                      }
                    }}
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (#{c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Projet
                  </label>
                  <select
                    className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={modalProjectId}
                    onChange={(e) => setModalProjectId(e.target.value)}
                    disabled={!modalClientId}
                    required
                  >
                    <option value="">
                      {!modalClientId
                        ? "Choisissez un client d'abord"
                        : "Sélectionner un projet"}
                    </option>
                    {modalProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (#{p.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Titre</label>
                <input
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Contenu
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
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
                  disabled={formLoading}
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-content hover:brightness-110 disabled:opacity-40 inline-flex items-center gap-2"
                >
                  {formLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {editingNote ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
