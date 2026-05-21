interface Props {
  label: string;
  value: string | number;
}

export function KPICard({ label, value }: Props) {
  return (
    <div className="border border-border border-l-4 border-l-accent bg-surface p-4">
      <div className="font-mono text-3xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}
