import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Car,
  Gauge,
  ImageOff,
  Images,
  MapPin,
  Phone,
  User,
  X,
  ZoomIn,
} from "lucide-react";
import {
  carListingDetailQueryOptions,
  type CarListingImage,
} from "#/utils/queries/carListingQueries";

export const Route = createFileRoute(
  "/dashboard/view_out_sourced_cars/$listingId/",
)({
  component: ViewOutSourcedCar,
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(val: string | null): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMileage(val: number | null): string {
  if (val == null) return "—";
  return `${val.toLocaleString()} km`;
}

function titleCase(val: string | null): string {
  if (!val) return "—";
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
}

// Known image slots, in the order we want them to appear.
const IMAGE_TYPE_ORDER = [
  "front",
  "back",
  "left",
  "left_side",
  "right",
  "right_side",
  "interior",
  "dashboard",
  "odometer",
];

const IMAGE_TYPE_LABELS: Record<string, string> = {
  front: "Front",
  back: "Back",
  left: "Left Side",
  left_side: "Left Side",
  right: "Right Side",
  right_side: "Right Side",
  interior: "Interior",
  dashboard: "Dashboard",
  odometer: "Odometer",
};

function imageLabel(type: string | null): string {
  if (!type) return "Other";
  const key = type.trim().toLowerCase().replace(/\s+/g, "_");
  return IMAGE_TYPE_LABELS[key] ?? titleCase(type);
}

function groupImages(images: CarListingImage[]) {
  const known: { label: string; image: CarListingImage }[] = [];
  const other: CarListingImage[] = [];

  for (const img of images) {
    const key = (img.image_type ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    if (IMAGE_TYPE_ORDER.includes(key)) {
      known.push({ label: imageLabel(img.image_type), image: img });
    } else {
      other.push(img);
    }
  }

  known.sort(
    (a, b) =>
      IMAGE_TYPE_ORDER.indexOf(
        (a.image.image_type ?? "").trim().toLowerCase().replace(/\s+/g, "_"),
      ) -
      IMAGE_TYPE_ORDER.indexOf(
        (b.image.image_type ?? "").trim().toLowerCase().replace(/\s+/g, "_"),
      ),
  );

  return { known, other };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md shrink-0"
      />
    );
  }
  return (
    <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-4 ring-white shadow-md shrink-0">
      <span className="text-xl font-bold text-white">{initials}</span>
    </div>
  );
}

function AvailabilityBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400 text-sm">—</span>;
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    fulltime: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "on request": "bg-amber-50 text-amber-700 ring-amber-200",
  };
  const cls = map[s] ?? "bg-gray-50 text-gray-600 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-right font-medium text-gray-900">
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50 bg-gray-50/40">
        <span className="text-[#2E8B57]">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 bg-gray-100 rounded" />
        <div className="h-4 w-36 bg-gray-100 rounded-lg" />
      </div>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-28" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-56" />
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-56" />
      </div>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-64" />
    </div>
  );
}

// ── Image gallery ──────────────────────────────────────────────────────────────

function GalleryCard({
  label,
  image,
  onOpen,
}: {
  label: string;
  image: CarListingImage;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 aspect-4/3 text-left shadow-sm hover:shadow-md transition-shadow"
    >
      <img
        src={image.image}
        alt={label}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-90" />
      <span className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-semibold text-white">
        {label}
      </span>
      <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ZoomIn className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}

function Lightbox({
  label,
  src,
  onClose,
}: {
  label: string;
  src: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(3px)",
      }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">{label}</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <img
          src={src}
          alt={label}
          className="w-full max-h-[75vh] object-contain rounded-xl bg-black/20"
        />
      </div>
    </div>
  );
}

function ImageGallery({ images }: { images: CarListingImage[] }) {
  const [lightbox, setLightbox] = useState<{
    label: string;
    src: string;
  } | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 rounded-xl border border-dashed border-gray-200 bg-gray-50/60">
        <ImageOff className="w-7 h-7 text-gray-300" />
        <p className="text-sm text-gray-400 italic">No photos uploaded yet.</p>
      </div>
    );
  }

  const { known, other } = groupImages(images);

  return (
    <div className="space-y-5 py-3">
      {known.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {known.map(({ label, image }) => (
            <GalleryCard
              key={image.id}
              label={label}
              image={image}
              onOpen={() => setLightbox({ label, src: image.image })}
            />
          ))}
        </div>
      )}

      {other.length > 0 && (
        <div className="space-y-2">
          {known.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Other Photos
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {other.map((image, i) => (
              <GalleryCard
                key={image.id}
                label={
                  imageLabel(image.image_type) === "Other"
                    ? `Photo ${i + 1}`
                    : imageLabel(image.image_type)
                }
                image={image}
                onOpen={() =>
                  setLightbox({
                    label:
                      imageLabel(image.image_type) === "Other"
                        ? `Photo ${i + 1}`
                        : imageLabel(image.image_type),
                    src: image.image,
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      {lightbox && (
        <Lightbox
          label={lightbox.label}
          src={lightbox.src}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function ViewOutSourcedCar() {
  const { listingId } = Route.useParams();
  const id = Number(listingId);

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery(carListingDetailQueryOptions(id));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonDetail />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-10 h-10 text-red-300" />
        <p className="text-sm font-medium text-red-500">
          Failed to load car listing
        </p>
        <p className="text-xs text-gray-400">
          {error ? (error as Error).message : "Listing not found"}
        </p>
        <Link
          to="/dashboard/out_sourcing_details"
          className="mt-2 text-xs font-medium text-[#2E8B57] hover:underline"
        >
          Back to car out sourcing
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link + heading */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/out_sourcing_details"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Back to car out sourcing"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {listing.vehicle_model}{" "}
            <span className="text-gray-400 font-normal text-lg">
              #{listing.id}
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Submitted {formatDate(listing.created_at)}
          </p>
        </div>
        <div className="ml-auto">
          <AvailabilityBadge status={listing.availability} />
        </div>
      </div>

      {/* Client card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <Avatar src={listing.client_avatar} name={listing.client_name} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#2E8B57] uppercase tracking-wide mb-0.5">
              Submitted By
            </p>
            <p className="text-lg font-bold text-gray-900 truncate">
              {listing.client_name}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                {listing.client_phonenumber ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Vehicle details */}
        <SectionCard title="Vehicle Details" icon={<Car className="w-4 h-4" />}>
          <InfoRow label="Model" value={listing.vehicle_model} />
          <InfoRow label="Year" value={listing.year ?? "—"} />
          <InfoRow
            label="Mileage"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-gray-300" />
                {formatMileage(listing.mileage)}
              </span>
            }
          />
          <InfoRow label="Condition" value={titleCase(listing.condition)} />
          <InfoRow label="Fuel Type" value={titleCase(listing.fuel_type)} />
          <InfoRow
            label="Transmission"
            value={titleCase(listing.transmission)}
          />
          <InfoRow
            label="Availability"
            value={<AvailabilityBadge status={listing.availability} />}
          />
        </SectionCard>

        {/* Owner details */}
        <SectionCard title="Owner Details" icon={<User className="w-4 h-4" />}>
          <InfoRow
            label="Owner Phone"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-300" />
                {listing.owner_phone_number ?? "—"}
              </span>
            }
          />
          <InfoRow
            label="Owner ID Number"
            value={listing.owner_id_number ?? "—"}
          />
          <InfoRow
            label="Owner Address"
            value={
              listing.owner_address ? (
                <span className="inline-flex items-start gap-1.5 text-right">
                  <MapPin className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                  <span>{listing.owner_address}</span>
                </span>
              ) : (
                "—"
              )
            }
          />
        </SectionCard>
      </div>

      {/* Image gallery */}
      <SectionCard title="Vehicle Photos" icon={<Images className="w-4 h-4" />}>
        <ImageGallery images={listing.images} />
      </SectionCard>
    </div>
  );
}
