import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import { supabase } from "../utils/supabase";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

// Persists across navigations so the check only runs once per page load
let sessionVerified = false;

function DashboardLayout() {
  const [checking, setChecking] = useState(!sessionVerified);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || sessionVerified) {
      setChecking(false);
      return;
    }
    ran.current = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
      } else {
        sessionVerified = true;
        setChecking(false);
      }
    });
  }, []);

  if (checking) return null;

  return (
    <div className="dashboard-root flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
