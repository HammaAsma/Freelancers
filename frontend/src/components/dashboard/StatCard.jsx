export default function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="relative rounded-xl border border-base-300/50 bg-base-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-200">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-80 group-hover:opacity-100 transition-opacity" />
      <div className="p-5 pl-6 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-base-content">
            {value}
          </p>
        </div>
        <div className="shrink-0 w-11 h-11 rounded-lg bg-base-200 flex items-center justify-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
