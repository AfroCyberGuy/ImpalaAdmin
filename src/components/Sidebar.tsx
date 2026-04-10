import { useState } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { supabase } from "#/utils/supabase";
import {
  Home,
  Users,
  DollarSign,
  Car,
  Truck,
  BarChart2,
  Navigation,
  Bus,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  to?: string;
  children?: { label: string; to: string }[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    icon: <Home size={18} />,
    to: "/dashboard",
  },
  {
    label: "Drivers",
    icon: <Users size={18} />,
    children: [
      { label: "Register Driver", to: "/dashboard/drivers/register" },
      { label: "View Drivers", to: "/dashboard/drivers" },
    ],
  },
  {
    label: "Pricing",
    icon: <DollarSign size={18} />,
    children: [
      { label: "Set Price Model", to: "/dashboard/pricing/model" },
      { label: "Car Rentals", to: "/dashboard/pricing/car-rentals" },
      { label: "Cab Rates", to: "/dashboard/pricing/cab-rates" },
      {
        label: "Driver Rental Rates",
        to: "/dashboard/pricing/driver-rental-rates",
      },
      { label: "City to City Shuttle", to: "/dashboard/pricing/shuttle" },
    ],
  },
  {
    label: "View Reports",
    icon: <BarChart2 size={18} />,
    to: "/dashboard/reports",
  },
  {
    label: "Cab Trips",
    icon: <Navigation size={18} />,
    to: "/dashboard/cab-trips",
  },
  {
    label: "Shuttle Trips",
    icon: <Bus size={18} />,
    to: "/dashboard/shuttle-trips",
  },
  {
    label: "Hire Driver Bookings",
    icon: <CalendarCheck size={18} />,
    to: "/dashboard/hire-driver-bookings",
  },
  {
    label: "Car Rental Bookings",
    icon: <Car size={18} />,
    children: [
      { label: "View Bookings", to: "/dashboard/car-rental-bookings" },
      {
        label: "Manage Sales Personnel",
        to: "/dashboard/car-rental-bookings/sales-personnel",
      },
    ],
  },
  {
    label: "Payments",
    icon: <CreditCard size={18} />,
    to: "/dashboard/payments",
  },
  {
    label: "System Users",
    icon: <ShieldCheck size={18} />,
    to: "/dashboard/system-users",
  },
];

export default function Sidebar() {
  const { location } = useRouterState();
  const pathname = location.pathname;
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  }

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const active = item.children.some((c) => pathname.startsWith(c.to));
        if (active) initial[item.label] = true;
      }
    });
    return initial;
  });

  const toggle = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="sidebar flex h-full w-64 flex-col bg-[#1a1f2e] text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
          <Truck size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">Impala</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-white/40">
            Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isOpen = openMenus[item.label] ?? false;
            const hasChildren = !!item.children;

            if (!hasChildren && item.to) {
              const isActive =
                pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span
                      className={
                        isActive ? "text-emerald-400" : "text-white/40"
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            }

            const anyChildActive =
              item.children?.some((c) => pathname.startsWith(c.to)) ?? false;

            return (
              <li key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    anyChildActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={
                      anyChildActive ? "text-emerald-400" : "text-white/40"
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? (
                    <ChevronDown size={14} className="text-white/30" />
                  ) : (
                    <ChevronRight size={14} className="text-white/30" />
                  )}
                </button>

                {isOpen && item.children && (
                  <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-white/10 pl-3">
                    {item.children.map((child) => {
                      const childActive =
                        pathname === child.to ||
                        pathname.startsWith(child.to + "/");
                      return (
                        <li key={child.to}>
                          <Link
                            to={child.to}
                            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                              childActive
                                ? "text-emerald-400 font-medium"
                                : "text-white/50 hover:text-white"
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer user area */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              Admin User
            </p>
            <p className="truncate text-xs text-white/40">admin@impala.co.zw</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
