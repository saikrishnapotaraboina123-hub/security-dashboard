interface Props {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color = 'blue',
}: Props) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    orange:
      'bg-orange-500/20 text-orange-400',
    purple:
      'bg-purple-500/20 text-purple-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl mb-4 ${colors[color]}`}
      >
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-white">
        {value}
      </h3>

      <p className="text-sm text-gray-400 mt-1">
        {title}
      </p>
    </div>
  );
}
