export default function StockPageSkeleton() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-10 w-28 rounded-full" />
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-10 w-56" />
        <div className="skeleton h-4 w-48" />
      </div>

      <div className="skeleton h-40 w-full rounded-[20px]" />

      <div className="card flex flex-col gap-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-3/4" />
      </div>

      <div className="card flex flex-col items-center gap-3">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-[120px] w-[220px] rounded-full" />
      </div>

      <div className="card flex flex-col gap-4">
        <div className="skeleton h-4 w-20" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-6 w-full" />
        ))}
      </div>
    </div>
  );
}
