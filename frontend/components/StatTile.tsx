export default function StatTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="eyebrow">{label}</p>
      <p className={`font-mono text-2xl font-bold ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}
