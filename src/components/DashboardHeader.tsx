import { Bell, Search } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 w-72">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search anything..."
          className="flex-1 bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
        />
        <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-400">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          A
        </div>
      </div>
    </header>
  );
}
