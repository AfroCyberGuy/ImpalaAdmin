import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  systemUsersQueryOptions,
  rolesQueryOptions,
  updateUserRole,
  addAdminUser,
  archiveAdminUser,
  unarchiveAdminUser,
  type SystemUser,
  type Role,
} from "#/utils/queries/systemUserQueries";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/dashboard/system-users/")({
  component: SystemUsers,
});

// ── Avatar ─────────────────────────────────────────────────────────────────────

function UserAvatar({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
      <span className="text-xs font-semibold text-white">{initials}</span>
    </div>
  );
}

// ── Role Badge ─────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string | null }) {
  if (!role) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 ring-1 ring-gray-200">
        Unassigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
      {role}
    </span>
  );
}

// ── Skeleton Row ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-4 bg-gray-100 rounded-md animate-pulse"
            style={{ width: `${50 + ((i * 20) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Archive Confirm Dialog ─────────────────────────────────────────────────────

function ArchiveConfirmDialog({
  user,
  onClose,
}: {
  user: SystemUser;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isArchived = user.archive_status === 1;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      isArchived ? unarchiveAdminUser(user.id) : archiveAdminUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      handleClose();
    },
  });

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) handleClose();
  }

  const accent = isArchived
    ? {
        bg: "bg-emerald-50",
        ring: "ring-emerald-100",
        icon: "text-emerald-500",
        btn: "bg-emerald-600 hover:bg-emerald-700",
      }
    : {
        bg: "bg-amber-50",
        ring: "ring-amber-100",
        icon: "text-amber-500",
        btn: "bg-amber-500 hover:bg-amber-600",
      };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200"
      style={{
        backgroundColor: visible ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
      }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(12px) scale(0.97)",
        }}
      >
        {/* Icon + title */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center gap-3">
          <div
            className={`w-12 h-12 rounded-full ${accent.bg} flex items-center justify-center ring-1 ${accent.ring}`}
          >
            {isArchived ? (
              <svg
                className={`w-6 h-6 ${accent.icon}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M15 12H9m6 0l-3-3m3 3l-3 3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            ) : (
              <svg
                className={`w-6 h-6 ${accent.icon}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25v4.5m4-4.5v4.5M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isArchived ? "Unarchive user?" : "Archive user?"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isArchived ? (
                <>
                  This will restore{" "}
                  <span className="font-medium text-gray-700">
                    {user.email}
                  </span>{" "}
                  and give them access again.
                </>
              ) : (
                <>
                  This will archive{" "}
                  <span className="font-medium text-gray-700">
                    {user.email}
                  </span>
                  . They will no longer have access.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          {mutation.isError && (
            <p className="text-xs text-red-500 text-center">
              {(mutation.error as Error).message}
            </p>
          )}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white ${accent.btn} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                {isArchived ? "Restoring…" : "Archiving…"}
              </span>
            ) : isArchived ? (
              "Yes, unarchive"
            ) : (
              "Yes, archive"
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={mutation.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Admin User Dialog ──────────────────────────────────────────────────────

function AddAdminUserDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: roles = [], isLoading: rolesLoading } =
    useQuery(rolesQueryOptions);

  const [email, setEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const isValid = email.trim().length > 0 && selectedRoleId !== "";

  const mutation = useMutation({
    mutationFn: () => addAdminUser(email.trim(), selectedRoleId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      handleClose();
    },
  });

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) handleClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200"
      style={{
        backgroundColor: visible ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(12px) scale(0.97)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Add Admin User
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Enter an email and assign a role to create a new admin user.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Email address
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            />
          </div>

          {/* Role dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Role
            </label>
            {rolesLoading ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedRoleId}
                onChange={(e) =>
                  setSelectedRoleId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition appearance-none"
                style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
              >
                <option value="">Select a role…</option>
                {roles.map((role: Role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          {mutation.isError ? (
            <p className="text-xs text-red-500 truncate">
              {(mutation.error as Error).message}
            </p>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClose}
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!isValid || mutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90 active:opacity-80"
              style={{ backgroundColor: "#2E8B57" }}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Saving…
                </span>
              ) : (
                "Add User"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Manage Role Modal ──────────────────────────────────────────────────────────

function ManageRoleModal({
  user,
  onClose,
}: {
  user: SystemUser;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: roles = [], isLoading: rolesLoading } =
    useQuery(rolesQueryOptions);

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
    user.admin_user_id,
  );
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const isDirty = selectedRoleId !== user.admin_user_id;

  const mutation = useMutation({
    mutationFn: () => updateUserRole(user.id, selectedRoleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      handleClose();
    },
  });

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) handleClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200"
      style={{
        backgroundColor: visible ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(12px) scale(0.97)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar email={user.email} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Current role:{" "}
                  <span className="font-medium text-gray-600">
                    {user.role_name ?? "Unassigned"}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mt-4">
            <h2 className="text-base font-bold text-gray-900">Manage Role</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select a role to assign to this user.
            </p>
          </div>
        </div>

        {/* Role list */}
        <div className="px-4 py-3 flex-1 overflow-y-auto max-h-72">
          {rolesLoading ? (
            <div className="space-y-2 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
              <svg
                className="w-8 h-8 text-gray-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 6h.008v.008H6V6z"
                />
              </svg>
              <p className="text-sm font-medium">No roles available</p>
            </div>
          ) : (
            <ul className="space-y-1.5 py-1">
              {roles.map((role: Role) => {
                const isSelected = selectedRoleId === role.id;
                return (
                  <li key={role.id}>
                    <button
                      onClick={() =>
                        setSelectedRoleId(isSelected ? null : role.id)
                      }
                      className={[
                        "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                        isSelected
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                          : "text-gray-700 hover:bg-gray-50 ring-1 ring-transparent hover:ring-gray-100",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={[
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                            isSelected ? "bg-emerald-100" : "bg-gray-100",
                          ].join(" ")}
                        >
                          <svg
                            className={[
                              "w-3.5 h-3.5",
                              isSelected ? "text-emerald-600" : "text-gray-400",
                            ].join(" ")}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                            />
                          </svg>
                        </div>
                        {role.role_name}
                      </div>

                      {/* Tick */}
                      <div
                        className={[
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-150",
                          isSelected
                            ? "bg-emerald-500 scale-100"
                            : "border-2 border-gray-200 scale-90 opacity-0",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          {mutation.isError && (
            <p className="text-xs text-red-500 truncate">
              {(mutation.error as Error).message}
            </p>
          )}
          {!mutation.isError && <div />}

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClose}
              disabled={mutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!isDirty || mutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90 active:opacity-80"
              style={{ backgroundColor: "#2E8B57" }}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Saving…
                </span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function SystemUsers() {
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery(systemUsersQueryOptions);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [archiveFilter, setArchiveFilter] = useState<
    "all" | "active" | "archived"
  >("all");
  const [managingUser, setManagingUser] = useState<SystemUser | null>(null);
  const [archivingUser, setArchivingUser] = useState<SystemUser | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  const filtered = useMemo(() => {
    let list = users;
    if (archiveFilter === "active")
      list = list.filter((u) => u.archive_status !== 1);
    if (archiveFilter === "archived")
      list = list.filter((u) => u.archive_status === 1);
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.role_name ?? "").toLowerCase().includes(q),
    );
  }, [users, search, archiveFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Users</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isLoading
              ? "Loading…"
              : `${users.length} system user${users.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setAddingUser(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 active:opacity-80 transition-opacity shrink-0"
          style={{ backgroundColor: "#2E8B57" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add User
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48 sm:max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by email or role…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": "#2E8B57" } as React.CSSProperties}
            />
          </div>

          {/* Archive filter */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg shrink-0">
            {(
              [
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  setArchiveFilter(value);
                  setPage(1);
                }}
                className={[
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                  archiveFilter === value
                    ? "bg-white text-gray-800 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!isLoading && error && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8 text-red-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-red-500">
                        Failed to load users
                      </p>
                      <p className="text-xs text-gray-400">
                        {(error as Error).message}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-8 h-8 text-gray-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-400">
                        No users found
                      </p>
                      {search && (
                        <p className="text-xs text-gray-400">
                          Try adjusting your search
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                paged.map((user: SystemUser) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar email={user.email} />
                        <span className="font-medium text-gray-800 truncate">
                          {user.email}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <RoleBadge role={user.role_name} />
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setArchivingUser(user)}
                          className={[
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ring-1 transition-colors",
                            user.archive_status === 1
                              ? "text-emerald-700 bg-emerald-50 ring-emerald-200 hover:bg-emerald-100"
                              : "text-amber-600 bg-amber-50 ring-amber-200 hover:bg-amber-100",
                          ].join(" ")}
                        >
                          {user.archive_status === 1 ? "Unarchive" : "Archive"}
                        </button>
                        <button
                          onClick={() => setManagingUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                          style={{ backgroundColor: "#2E8B57" }}
                        >
                          Manage Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400 order-2 sm:order-1">
              Showing{" "}
              <span className="font-medium text-gray-600">
                {(safePage - 1) * PAGE_SIZE + 1}
              </span>
              {" – "}
              <span className="font-medium text-gray-600">
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-600">
                {filtered.length}
              </span>{" "}
              users
            </p>

            <div className="flex items-center gap-1 order-1 sm:order-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - safePage) <= 1) return true;
                  return false;
                })
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (
                    idx > 0 &&
                    typeof arr[idx - 1] === "number" &&
                    (p as number) - (arr[idx - 1] as number) > 1
                  ) {
                    acc.push("…");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-xs text-gray-400 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={[
                        "min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors",
                        item === safePage
                          ? "text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100",
                      ].join(" ")}
                      style={
                        item === safePage
                          ? { backgroundColor: "#2E8B57" }
                          : undefined
                      }
                      aria-current={item === safePage ? "page" : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Archive Confirm Dialog */}
      {archivingUser && (
        <ArchiveConfirmDialog
          user={archivingUser}
          onClose={() => setArchivingUser(null)}
        />
      )}

      {/* Add Admin User Dialog */}
      {addingUser && (
        <AddAdminUserDialog onClose={() => setAddingUser(false)} />
      )}

      {/* Manage Role Modal */}
      {managingUser && (
        <ManageRoleModal
          user={managingUser}
          onClose={() => setManagingUser(null)}
        />
      )}
    </div>
  );
}
