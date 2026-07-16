import { AlertCircle, Info } from "lucide-react";

const VARIANT = {
  error: { icon: AlertCircle, iconClass: "text-error" },
  info: { icon: Info, iconClass: "text-muted" },
} as const;

export default function StatusMessage({
  variant = "error",
  title,
  description,
}: {
  variant?: keyof typeof VARIANT;
  title: string;
  description?: string;
}) {
  const { icon: Icon, iconClass } = VARIANT[variant];

  return (
    <div className="card mx-auto flex max-w-md flex-col items-center gap-2 py-12 text-center">
      <Icon className={`size-6 ${iconClass}`} />
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted text-sm">{description}</p>}
    </div>
  );
}
