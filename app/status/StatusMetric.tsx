interface Props { label: string; value: string; unit: string; }
export default function StatusMetric({ label, value, unit }: Props) {
  return <div className="border-t border-terminal-bg-panel-border pt-4"><p className="text-small text-terminal-subdued">{label}</p><p className="text-h2 mt-2 break-words">{value}</p><p className="text-caption font-mono mt-1 text-terminal-subdued">{unit}</p></div>;
}
