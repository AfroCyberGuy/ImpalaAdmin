// ── Document Row ───────────────────────────────────────────────────────────────

function DocumentRow({
  label,
  url,
}: {
  label: string;
  url: string | null | undefined;
}) {
  if (!url) return null;

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 px-4 rounded-xl bg-gray-50 hover:bg-emerald-50/60 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        {/* File icon */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex flex-col items-center justify-center shrink-0 shadow-sm">
          <span className="text-[9px] font-bold text-white/80 leading-none">
            DOC
          </span>
          <div className="w-4 h-px bg-white/30 my-0.5" />
          <div className="w-3 h-px bg-white/20" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">
            {label}
          </p>
          <p className="text-xs text-gray-400">Document file</p>
        </div>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#2E8B57] border border-emerald-200 hover:bg-[#2E8B57] hover:text-white hover:border-transparent transition-all duration-150 shrink-0"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Download
      </a>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export interface DocumentEntry {
  label: string;
  url: string | null | undefined;
}

export function DriverDocuments({ documents }: { documents: DocumentEntry[] }) {
  const available = documents.filter((d) => !!d.url);

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[#2E8B57]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gray-800">Documents</h2>
          {available.length > 0 && (
            <span className="ml-auto text-xs font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
              {available.length} file{available.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-2">
        {available.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <svg
              className="w-10 h-10 text-gray-200 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="text-sm text-gray-400">No documents uploaded</p>
          </div>
        ) : (
          available.map((doc) => (
            <DocumentRow key={doc.label} label={doc.label} url={doc.url} />
          ))
        )}
      </div>
    </div>
  );
}
