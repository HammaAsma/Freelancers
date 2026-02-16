import DashboardCard from "./DashboardCard";

export default function InvoiceOverview({ invoices }) {
  return (
    <DashboardCard
      title="Factures récentes"
      href="/dashboard/factures"
      linkLabel="Voir tout"
    >
      {!invoices || invoices.length === 0 ? (
        <p className="text-sm text-base-content/60 py-2">Aucune facture.</p>
      ) : (
        <ul className="divide-y divide-base-300/40">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex justify-between items-start gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-base-content">
                  {inv.invoice_number || inv.number || `#${inv.id}`}
                </p>
                {(inv.Client?.name || inv.clientName) && (
                  <p className="text-xs text-base-content/50 mt-0.5">
                    {inv.Client?.name || inv.clientName}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-base-content tabular-nums">
                  {inv.totalFormatted ??
                    (inv.total_ttc != null
                      ? `${Number(inv.total_ttc).toFixed(2)} ${inv.currency || "€"}`
                      : "—")}
                </p>
                {inv.status && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-base-200 text-base-content/70 mt-1 inline-block">
                    {inv.status}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
