import { useEffect, useState } from "react";
import axios from "../api/client";
import { Eye, Trash2, Download, FileText, Loader2, Plus } from "lucide-react";

export default function FacturesPage() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [detailError, setDetailError] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null); // delete
  const [pdfLoadingId, setPdfLoadingId] = useState(null); // download PDF

  // création facture à partir d’un projet terminé
  const [createOpen, setCreateOpen] = useState(false);
  const [projectIdInput, setProjectIdInput] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [completedProjects, setCompletedProjects] = useState([]);

  const fetchInvoices = async (page = 1) => {
    try {
      setLoading(true);
      const res = await axios.get("/invoices", {
        params: { page, limit: 10 },
      });
      setInvoices(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (e) {
      console.error("error fetch invoices", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetail = async (invoiceId) => {
    setDetailError(null);
    try {
      const [invoiceRes, itemsRes] = await Promise.all([
        axios.get(`/invoices/${invoiceId}`),
        axios.get(`/invoices/${invoiceId}/items`),
      ]);
      setSelectedInvoice(invoiceRes.data.data);
      setItems(itemsRes.data.data || []);
      setDetailOpen(true);
    } catch (e) {
      console.error("error fetch invoice detail", e);
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Impossible de charger le détail de la facture.";
      setDetailError(msg);
    }
  };

  const fetchCompletedProjects = async () => {
    try {
      const res = await axios.get("/projects", {
        params: { status: "completed", limit: 100 },
      });
      setCompletedProjects(res.data.data || []);
    } catch (e) {
      console.error("error fetch completed projects", e);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, []);

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((p) => ({ ...p, page: newPage }));
    fetchInvoices(newPage);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    try {
      setActionLoadingId(id);
      await axios.delete(`/invoices/${id}`);
      fetchInvoices(pagination.page);
    } catch (e) {
      console.error("error delete invoice", e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadPdf = async (invoice) => {
    setPdfError(null);
    try {
      setPdfLoadingId(invoice.id);
      const res = await axios.get(`/invoices/${invoice.id}/download`, {
        responseType: "blob",
      });
      if (res.status < 200 || res.status >= 300) {
        const text = await res.data.text();
        let msg = "Téléchargement impossible.";
        try {
          const json = JSON.parse(text);
          msg = json.message || json.error || msg;
        } catch (_) {}
        setPdfError(msg);
        return;
      }
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const baseName =
        invoice.invoice_number || invoice.number || `facture-${invoice.id}`;
      a.href = url;
      a.download = `${baseName}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("error download pdf", e);
      setPdfError(
        e.response?.data?.message ||
          (typeof e.response?.data === "object" && e.response?.data?.message) ||
          "Erreur lors du téléchargement du PDF."
      );
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setCreateError(null);
    if (!projectIdInput) return;

    try {
      setCreateLoading(true);
      await axios.post(`/invoices/project/${projectIdInput}`);
      setCreateOpen(false);
      setProjectIdInput("");
      await fetchInvoices(1);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de la création de la facture.";
      setCreateError(msg);
      console.error("error create project invoice", err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Factures</h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setProjectIdInput("");
            setCreateOpen(true);
            fetchCompletedProjects();
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </button>
      </div>

      {/* Erreurs détail / PDF */}
      {(detailError || pdfError) && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <span>{detailError || pdfError}</span>
          <button
            type="button"
            onClick={() => {
              setDetailError(null);
              setPdfError(null);
            }}
            className="shrink-0 rounded px-2 py-1 hover:bg-red-500/20"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Table factures */}
      <div className="overflow-hidden rounded-2xl bg-base-200/40 border border-base-300/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-base-300/60 text-xs uppercase tracking-wide text-base-content/70">
              <tr>
                <th className="px-4 py-3 text-left font-medium">N°</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Projet</th>
                <th className="px-4 py-3 text-left font-medium">Dates</th>
                <th className="px-4 py-3 text-left font-medium">Montant TTC</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-base-content/60"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-base-content/60"
                  >
                    Aucune facture pour le moment.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-base-300/40 hover:bg-base-200/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {inv.invoice_number || inv.number || `#${inv.id}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">{inv.Client?.name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-base-content/70">
                      {inv.project_id ? `Projet #${inv.project_id}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-base-content/70">
                      {inv.issue_date
                        ? new Date(inv.issue_date).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {inv.total_ttc != null
                        ? `${Number(inv.total_ttc).toFixed(2)} ${
                            inv.currency || "€"
                          }`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          inv.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : inv.status === "sent"
                            ? "bg-sky-500/15 text-sky-300"
                            : inv.status === "overdue"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-slate-500/15 text-slate-300"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => fetchInvoiceDetail(inv.id)}
                        className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(inv)}
                        disabled={pdfLoadingId === inv.id}
                        className="inline-flex items-center justify-center rounded-md border border-base-300 px-2 py-1 text-xs hover:bg-base-300/70 disabled:opacity-40"
                      >
                        {pdfLoadingId === inv.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        disabled={actionLoadingId === inv.id}
                        className="inline-flex items-center justify-center rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                      >
                        {actionLoadingId === inv.id ? (
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
      </div>

      {/* Modal création facture de projet */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-base-100 border border-base-300 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              Créer une facture de projet
            </h2>

            {createError && (
              <p className="mb-3 text-xs text-red-400">{createError}</p>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Projet terminé à facturer
                </label>
                <select
                  className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={projectIdInput}
                  onChange={(e) => setProjectIdInput(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un projet</option>
                  {completedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.id})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-base-content/60">
                  Seuls les projets avec statut &quot;terminé&quot; sont
                  proposés.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-3 py-2 text-xs rounded-lg border border-base-300 hover:bg-base-300/60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-content hover:brightness-110 disabled:opacity-40 inline-flex items-center gap-2"
                >
                  {createLoading && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Créer la facture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal détail facture + lignes */}
      {detailOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-2xl bg-base-100 border border-base-300 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <div>
                  <h2 className="text-lg font-semibold">
                    Facture{" "}
                    {selectedInvoice.invoice_number ||
                      selectedInvoice.number ||
                      `#${selectedInvoice.id}`}
                  </h2>
                  <p className="text-xs text-base-content/60">
                    Client : {selectedInvoice.Client?.name || "—"}
                  </p>
                  <p className="text-xs text-base-content/60">
                    Projet :{" "}
                    {selectedInvoice.project_id
                      ? `#${selectedInvoice.project_id}`
                      : "—"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="px-3 py-1 text-xs rounded-lg border border-base-300 hover:bg-base-300/60"
              >
                Fermer
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <p>
                  Date émission :{" "}
                  <span className="font-medium">
                    {selectedInvoice.issue_date
                      ? new Date(
                          selectedInvoice.issue_date
                        ).toLocaleDateString()
                      : "—"}
                  </span>
                </p>
                <p>
                  Échéance :{" "}
                  <span className="font-medium">
                    {selectedInvoice.due_date
                      ? new Date(selectedInvoice.due_date).toLocaleDateString()
                      : "—"}
                  </span>
                </p>
              </div>
              <div>
                <p>
                  Total HT :{" "}
                  <span className="font-medium">
                    {selectedInvoice.total_ht != null
                      ? Number(selectedInvoice.total_ht).toFixed(2)
                      : "0.00"}{" "}
                    {selectedInvoice.currency || "€"}
                  </span>
                </p>
                <p>
                  TVA :{" "}
                  <span className="font-medium">
                    {selectedInvoice.total_tva != null
                      ? Number(selectedInvoice.total_tva).toFixed(2)
                      : "0.00"}{" "}
                    {selectedInvoice.currency || "€"}
                  </span>
                </p>
                <p>
                  Total TTC :{" "}
                  <span className="font-medium">
                    {selectedInvoice.total_ttc != null
                      ? Number(selectedInvoice.total_ttc).toFixed(2)
                      : "0.00"}{" "}
                    {selectedInvoice.currency || "€"}
                  </span>
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-base-300/60 bg-base-200/40">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-base-300/60 text-[11px] uppercase tracking-wide text-base-content/70">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        Description
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Nb heures
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Prix unitaire
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-base-content/60"
                        >
                          Aucune ligne de facture.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-base-300/40"
                        >
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2 text-right">
                            {item.Nb_heure}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {Number(item.unit_price).toFixed(2)}{" "}
                            {selectedInvoice.currency || "€"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {Number(item.total || item.total_ttc || 0).toFixed(
                              2
                            )}{" "}
                            {selectedInvoice.currency || "€"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
