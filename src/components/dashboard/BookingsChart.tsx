import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { monthlyBookingsQueryOptions } from "#/utils/queries/dashboardQueries";

const SERIES = [
  { key: "cab", label: "Cab Bookings", color: "#6366f1" },
  { key: "shuttle", label: "Shuttle Bookings", color: "#06b6d4" },
  { key: "carRental", label: "Car Rentals", color: "#f43f5e" },
  { key: "driver", label: "Driver Bookings", color: "#10b981" },
] as const;

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm min-w-[150px]">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }} className="mb-1">
          {item.name} : {item.value}
        </p>
      ))}
    </div>
  );
}

export function BookingsChart() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data } = useSuspenseQuery(monthlyBookingsQueryOptions(year));

  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Booking Activity</h2>
          <p className="text-sm text-gray-400">
            Cab, shuttle, car rental &amp; driver bookings over time
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              {SERIES.map(({ key, color }) => (
                <linearGradient
                  key={key}
                  id={`grad-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
            />
            {SERIES.map(({ key, label, color }) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${key})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
