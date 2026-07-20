export default function StatTile({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="eyebrow">{label}</p>
      <p className={`font-mono text-2xl font-bold ${valueClassName ?? ""}`}>{value}</p>
      {hint && <p className="text-muted text-xs leading-tight">{hint}</p>}
    </div>
  );
}
