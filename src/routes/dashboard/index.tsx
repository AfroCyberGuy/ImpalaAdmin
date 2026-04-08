import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ShoppingCart, CreditCard, Monitor, User } from "lucide-react";
import {
  bookingCountsQueryOptions,
  monthlyBookingsQueryOptions,
  bookingPinsQueryOptions,
} from "#/utils/queries/dashboardQueries";
import { StatsCard } from "#/components/dashboard/StatsCard";
import { BookingsChart } from "#/components/dashboard/BookingsChart";
import { BookingsMap } from "#/components/dashboard/BookingsMap";

export const Route = createFileRoute("/dashboard/")({
  loader: ({ context: { queryClient } }) => {
    const year = new Date().getFullYear();
    return Promise.all([
      queryClient.ensureQueryData(bookingCountsQueryOptions),
      queryClient.ensureQueryData(monthlyBookingsQueryOptions(year)),
      queryClient.ensureQueryData(bookingPinsQueryOptions),
    ]);
  },
  component: DashboardHome,
});

function DashboardHome() {
  const { data: counts } = useSuspenseQuery(bookingCountsQueryOptions);

  const bookingStats = [
    {
      icon: <ShoppingCart className="w-5 h-5 text-teal-700" />,
      value: counts.cab,
      label: "Cab bookings",
      change: 33,
    },
    {
      icon: <CreditCard className="w-5 h-5 text-amber-500" />,
      value: counts.shuttle,
      label: "Shuttle bookings",
      change: -2,
    },
    {
      icon: <Monitor className="w-5 h-5 text-amber-500" />,
      value: counts.carRental,
      label: "Car rental requests",
      change: 12,
    },
    {
      icon: <User className="w-5 h-5 text-teal-500" />,
      value: counts.driver,
      label: "Driver bookings",
      change: 22,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back. Here's what's happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bookingStats.map((stat) => (
          <StatsCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            change={stat.change}
          />
        ))}
      </div>

      <BookingsChart />
      <BookingsMap />
    </div>
  );
}
