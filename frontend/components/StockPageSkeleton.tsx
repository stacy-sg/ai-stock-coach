export default function StockPageSkeleton() {
  return (
    <div className="page-container">
      <div className="skeleton h-4 w-20" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-4 w-28" />
        </div>
        <div className="skeleton h-10 w-24 rounded-full" />
      </div>
      <div className="card flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-9 w-24" />
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="card flex flex-col gap-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-3/4" />
      </div>
    </div>
  );
}
