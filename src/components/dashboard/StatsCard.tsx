import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  change: number;
  loading?: boolean;
}

export function StatsCard({
  icon,
  value,
  label,
  change,
  loading,
}: StatsCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl bg-gray-50">{icon}</div>
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPositive ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(change)}%
        </span>
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        )}
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
