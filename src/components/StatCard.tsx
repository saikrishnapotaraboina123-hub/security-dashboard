interface Props {
  title: string;
  value: string | number;
  icon: string;
  accent: string; // tailwind gradient classes
}

export default function StatCard({ title, value, icon, accent }: Props) {
  return (
    <div className={`rounded-xl border p-5 bg-gradient-to-br ${accent}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
