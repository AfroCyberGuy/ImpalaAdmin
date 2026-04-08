interface AnalyticsCardProps {
  label: string;
  value: string;
  change: number;
  loading?: boolean;
}

export function AnalyticsCard({
  label,
  value,
  change,
  loading,
}: AnalyticsCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
        ) : (
          <span className="text-2xl font-bold text-gray-800">{value}</span>
        )}
        <span
          className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            isPositive ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
          }`}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
        <span className="text-xs text-gray-400">Vs last month</span>
      </div>
    </div>
  );
}
