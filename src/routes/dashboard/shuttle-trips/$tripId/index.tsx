import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  AssignDriverDialog,
  AssignSuccessToast,
} from "#/components/shuttle-trips/AssignDriverDialog";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  shuttleTripDetailQueryOptions,
  type ShuttleTripDetail,
} from "#/utils/queries/shuttleTripQueries";

export const Route = createFileRoute("/dashboard/shuttle-trips/$tripId/")({
  component: ViewShuttleTrip,
});

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#d4edda" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#388e3c" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9e8f0" }],
  },
];

// ── Polyline decoder (Google's algorithm) ─────────────────────────────────────

function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// ── Route Polyline overlay ────────────────────────────────────────────────────

function RoutePolyline({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  const polyRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || points.length === 0) return;

    polyRef.current = new google.maps.Polyline({
      path: points,
      strokeColor: "#2E8B57",
      strokeOpacity: 0.85,
      strokeWeight: 5,
      map,
    });

    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 60);

    return () => {
      polyRef.current?.setMap(null);
    };
  }, [map, points]);

  return null;
}

// ── Trip Map ──────────────────────────────────────────────────────────────────

function TripMap({ trip }: { trip: ShuttleTripDetail }) {
  const routePoints = trip.trip_encoded_points
    ? decodePolyline(trip.trip_encoded_points)
    : [];

  const center = {
    lat: (trip.pick_up_latitude + trip.drop_off_latitude) / 2,
    lng: (trip.pick_up_longitude + trip.drop_off_longitude) / 2,
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <Map
        defaultCenter={center}
        defaultZoom={14}
        mapId="shuttle-trip-route-map"
        styles={MAP_STYLE}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="h-full w-full"
      >
        {routePoints.length > 0 && <RoutePolyline points={routePoints} />}

        {/* Pickup marker */}
        <AdvancedMarker
          position={{ lat: trip.pick_up_latitude, lng: trip.pick_up_longitude }}
          title="Pickup"
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#2E8B57",
              border: "3px solid white",
              boxShadow: "0 3px 10px rgba(46,139,87,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
          </div>
        </AdvancedMarker>

        {/* Drop-off marker */}
        <AdvancedMarker
          position={{
            lat: trip.drop_off_latitude,
            lng: trip.drop_off_longitude,
          }}
          title="Drop-off"
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#dc2626",
              border: "3px solid white",
              boxShadow: "0 3px 10px rgba(220,38,38,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCost(val: number | null, currency?: string | null): string {
  if (val == null) return "—";
  const sym = currency === "ZWG" ? "ZWG " : "$";
  return `${sym}${val.toFixed(2)}`;
}

function StatusBadge({
  status,
  variant,
}: {
  status: string | null;
  variant: "trip" | "payment";
}) {
  if (!status) return <span className="text-gray-400 text-sm">—</span>;
  const s = status.toLowerCase();

  const tripMap: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    cancelled: "bg-red-50 text-red-600 ring-red-200",
    "in progress": "bg-blue-50 text-blue-700 ring-blue-200",
    active: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  const payMap: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    failed: "bg-red-50 text-red-600 ring-red-200",
    refunded: "bg-purple-50 text-purple-700 ring-purple-200",
  };
  const map = variant === "trip" ? tripMap : payMap;
  const cls = map[s] ?? "bg-gray-50 text-gray-600 ring-gray-200";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}

function Avatar({
  src,
  name,
  size = "md",
}: {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dim =
    size === "lg"
      ? "w-16 h-16 text-lg"
      : size === "sm"
        ? "w-8 h-8 text-xs"
        : "w-11 h-11 text-sm";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-linear-to-br from-[#2E8B57] to-emerald-400 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0`}
    >
      <span className="font-semibold text-white">{initials}</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-48 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-80" />
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-48" />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-48" />
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-48" />
        </div>
      </div>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

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
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        <span className="text-[#2E8B57]">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function ViewShuttleTrip() {
  const { tripId } = Route.useParams();
  const [showAssign, setShowAssign] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const {
    data: trip,
    isLoading,
    error,
  } = useQuery(shuttleTripDetailQueryOptions(Number(tripId)));

  const canAssign =
    trip?.trip_status?.toLowerCase() === "pending" || !trip?.driver_name;

  if (isLoading) return <SkeletonDetail />;

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <svg
          className="w-10 h-10 text-red-300"
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
        <p className="text-sm font-semibold text-red-500">
          Failed to load trip
        </p>
        <p className="text-xs text-gray-400">{(error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/shuttle-trips"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Back to shuttle trips"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Shuttle Trip #{trip.id}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {trip.trip_date}
              {trip.trip_time ? ` · ${formatTime(trip.trip_time)}` : ""}
              {trip.shuttle_city ? ` · ${trip.shuttle_city}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={trip.trip_status} variant="trip" />
          <StatusBadge status={trip.payment_status} variant="payment" />
          {canAssign && (
            <button
              onClick={() => setShowAssign(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#2E8B57] hover:bg-emerald-700 active:scale-95 shadow-sm transition-all ml-2"
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
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
              Assign Driver
            </button>
          )}
        </div>
      </div>

      {/* Assign Driver Dialog */}
      {showAssign && (
        <AssignDriverDialog
          tripId={trip.id}
          onClose={() => setShowAssign(false)}
          onAssigned={(driverName) => {
            setShowAssign(false);
            setToastMessage(`${driverName} assigned successfully`);
          }}
        />
      )}

      {toastMessage && (
        <AssignSuccessToast
          message={toastMessage}
          onDone={() => setToastMessage(null)}
        />
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — map + route info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
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
                  d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                />
              </svg>
              <h2 className="text-sm font-semibold text-gray-800">Route Map</h2>
            </div>

            <div className="flex items-center gap-5 px-5 py-2.5 bg-gray-50/60 border-b border-gray-50 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#2E8B57] shrink-0" />
                Pickup
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                Drop-off
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-1 rounded-full bg-[#2E8B57] shrink-0" />
                Route
              </span>
            </div>

            <div className="h-80">
              <TripMap trip={trip} />
            </div>
          </div>

          {/* Route details */}
          <SectionCard
            title="Route Details"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            }
          >
            <div className="py-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#2E8B57] mt-1 shrink-0" />
                  <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                  <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="pb-3 border-b border-gray-50">
                    <p className="text-xs text-gray-400 mb-0.5">Pickup</p>
                    <p className="text-sm font-medium text-gray-800">
                      {trip.pickup_address ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Drop-off</p>
                    <p className="text-sm font-medium text-gray-800">
                      {trip.destination_address ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-50">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Distance</p>
                <p className="text-lg font-bold text-gray-900">
                  {trip.trip_total_distance != null
                    ? `${trip.trip_total_distance.toFixed(2)}`
                    : "—"}
                </p>
                <p className="text-xs text-gray-400">km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Trip Cost</p>
                <p className="text-lg font-bold text-[#2E8B57]">
                  {formatCost(trip.trip_cost, trip.payment_currency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">City</p>
                <p className="text-sm font-semibold text-gray-900">
                  {trip.shuttle_city ?? "—"}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right — side panels */}
        <div className="space-y-6">
          {/* Client */}
          <SectionCard
            title="Client"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            }
          >
            <div className="flex items-center gap-3 py-4 border-b border-gray-50">
              <Avatar
                src={trip.client_avatar}
                name={trip.client_name}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {trip.client_name}
                </p>
                {trip.client_phone && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {trip.client_phone}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Driver */}
          <SectionCard
            title="Driver"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
            }
          >
            {trip.driver_name ? (
              <div className="flex items-center gap-3 py-4">
                <Avatar
                  src={trip.driver_photo}
                  name={trip.driver_name}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {trip.driver_name}
                  </p>
                  {trip.driver_mobile && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {trip.driver_mobile}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="py-4 text-sm text-gray-400 text-center">
                No driver assigned
              </p>
            )}
          </SectionCard>

          {/* Payment */}
          <SectionCard
            title="Payment"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            }
          >
            <InfoRow
              label="Status"
              value={
                <StatusBadge status={trip.payment_status} variant="payment" />
              }
            />
            <InfoRow label="Method" value={trip.payment_method} />
            <InfoRow
              label="Invoiced"
              value={formatCost(trip.amount_invoiced, trip.payment_currency)}
            />
            <InfoRow
              label="Paid"
              value={formatCost(trip.amount_paid, trip.payment_currency)}
            />
            {trip.payment_reference && (
              <InfoRow
                label="Reference"
                value={
                  <span className="font-mono text-xs text-gray-600">
                    {trip.payment_reference}
                  </span>
                }
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
