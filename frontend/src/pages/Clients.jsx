import { useEffect, useState } from "react";
import axios from "../api/client";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    contact_email: "",
    contact_phone: "",
  });
  const [errors, setErrors] = useState([]);

  const fetchClients = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get("/clients", {
        params: { page, limit: 10 },
      });
      console.log("clients response", res.data);

      setClients(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (e) {
      console.error("error fetch clients", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(pagination.page);
  }, []);

  const openCreate = () => {
    setEditingClient(null);
    setForm({ name: "", type: "", contact_email: "", contact_phone: "" });
    setErrors([]);
    setFormOpen(true);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      type: client.type,
      contact_email: client.contact_email,
      contact_phone: client.contact_phone,
    });
    setErrors([]);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce client ?")) return;
    try {
      await axios.delete(`/clients/${id}`);
      fetchClients(pagination.page);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    try {
      if (editingClient) {
        await axios.put(`/clients/${editingClient.id}`, form);
      } else {
        await axios.post("/clients", form);
      }
      setFormOpen(false);
      fetchClients(pagination.page);
    } catch (e) {
      const errData = e.response?.data?.data || e.response?.data?.errors;
      if (Array.isArray(errData)) {
        setErrors(errData.map((err) => (typeof err === "string" ? { msg: err } : err)));
      }
      console.error(e);
    }
  };

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((p) => ({ ...p, page: newPage }));
    fetchClients(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between ">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Nouveau client
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-base-200/40 border border-base-300/60 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-base-300/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nom</th>
              <th className="px-4 py-3 text-left font-medium">type</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Téléphone</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-base-content/60"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-base-content/60"
                  >
                    Aucun client pour le moment.
                  </td>
                </tr>
              ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-t border-base-300/60 hover:bg-base-200/60"
                >
                  <td className="px-4 py-3">{client.name}</td>
                  <td className="px-4 py-3">{client.type}</td>
                  <td className="px-4 py-3">{client.contact_email}</td>
                  <td className="px-4 py-3">{client.contact_phone}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(client)}
                      className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-base-300/60 text-xs">
          <span>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => changePage(pagination.page - 1)}
              className="px-3 py-1 rounded-md border border-base-300/70 hover:bg-base-300/60"
              disabled={pagination.page <= 1}
            >
              Précédent
            </button>
            <button
              onClick={() => changePage(pagination.page + 1)}
              className="px-3 py-1 rounded-md border border-base-300/70 hover:bg-base-300/60"
              disabled={pagination.page >= pagination.totalPages}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal formulaire */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-base-100 border border-base-300 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingClient ? "Modifier le client" : "Nouveau client"}
            </h2>

            {errors.length > 0 && (
              <ul className="mb-3 text-xs text-red-400 space-y-1">
                {errors.map((err, idx) => (
                  <li key={idx}>• {err.msg || err.message || err}</li>
                ))}
              </ul>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="text-xs font-medium mb-1 block">Type</label>
                <select
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.type || "individual"}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.contact_email}
                  onChange={(e) =>
                    setForm({ ...form, contact_email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">
                  Téléphone
                </label>
                <input
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm({ ...form, contact_phone: e.target.value })
                  }
                  required
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
                  {editingClient ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
