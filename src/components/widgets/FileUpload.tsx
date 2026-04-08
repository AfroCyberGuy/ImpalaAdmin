import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, FileText, CheckCircle2 } from "lucide-react";

type FileUploadProps = {
  label: string;
  hint?: string;
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
};

export default function FileUpload({
  label,
  hint = "PNG, JPG, PDF, max file size: 3MB",
  accept = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "application/pdf": [".pdf"],
  },
  maxSizeMB = 3,
  value,
  onChange,
  error: externalError,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const displayError = error ?? externalError ?? null;

  const onDrop = useCallback(
    (accepted: File[], rejected: import("react-dropzone").FileRejection[]) => {
      setError(null);
      if (rejected.length > 0) {
        const code = rejected[0].errors[0]?.code;
        if (code === "file-too-large") {
          setError(`File exceeds ${maxSizeMB}MB limit.`);
        } else if (code === "file-invalid-type") {
          setError("File type not supported.");
        } else {
          setError("Invalid file.");
        }
        return;
      }
      if (accepted[0]) onChange(accepted[0]);
    },
    [maxSizeMB, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  const isImage = value?.type.startsWith("image/");

  return (
    <div className="flex flex-col gap-1">
      <div
        {...getRootProps()}
        className={[
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors",
          isDragActive
            ? "border-[#2E8B57] bg-[#f0faf4]"
            : value
              ? "border-[#2E8B57]/40 bg-[#f7fdf9]"
              : displayError
                ? "border-red-400 bg-red-50"
                : "border-gray-200 bg-gray-50 hover:border-[#2E8B57]/50 hover:bg-[#f7fdf9]",
        ].join(" ")}
      >
        <input {...getInputProps()} />

        {value ? (
          <>
            {isImage ? (
              <img
                src={URL.createObjectURL(value)}
                alt="preview"
                className="h-16 w-16 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-100">
                <FileText className="h-7 w-7 text-[#2E8B57]" />
              </div>
            )}
            <div className="flex flex-col items-center gap-0.5 text-center">
              <div className="flex items-center gap-1.5 text-sm font-medium text-[#2E8B57]">
                <CheckCircle2 className="h-4 w-4" />
                <span className="max-w-[160px] truncate">{value.name}</span>
              </div>
              <p className="text-xs text-gray-400">
                {(value.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setError(null);
              }}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow border border-gray-200 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
              <UploadCloud
                className={`h-6 w-6 transition-colors ${isDragActive ? "text-[#2E8B57]" : "text-gray-400"}`}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-[#2E8B57] underline underline-offset-2">
                  Click to upload
                </span>{" "}
                or drag & drop
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start justify-between px-0.5">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {displayError ? (
          <p className="text-xs text-red-500">{displayError}</p>
        ) : (
          <p className="text-xs text-gray-400">{hint}</p>
        )}
      </div>
    </div>
  );
}
