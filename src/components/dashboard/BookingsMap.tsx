import { useState, useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import {
  bookingPinsQueryOptions,
  type BookingPin,
} from "#/utils/queries/dashboardQueries";
import { MapPin, Navigation, Clock, DollarSign } from "lucide-react";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// Clean, minimal map style — light grey roads, green highlights
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
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
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9e8f0" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];

// SVG car icon rendered as a DOM marker
function CarMarkerIcon({ color, shadow }: { color: string; shadow: string }) {
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: color,
        border: "3px solid white",
        boxShadow: `0 3px 10px ${shadow}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "transform 150ms ease",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.transform = "scale(1.15)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.transform = "scale(1)")
      }
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h6l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z" />
        <circle cx="7.5" cy="17" r="1.5" fill="white" stroke="none" />
        <circle cx="16.5" cy="17" r="1.5" fill="white" stroke="none" />
      </svg>
    </div>
  );
}

function BookingInfoContent({ pin }: { pin: BookingPin }) {
  const isGreen = pin.type === "cab";

  return (
    <div style={{ fontFamily: "Manrope, sans-serif", width: 288 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        {pin.clientAvatar ? (
          <img
            src={pin.clientAvatar}
            alt={pin.clientName}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: isGreen ? "#16a34a" : "#15803d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          >
            {pin.clientName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontWeight: 600,
              color: "#1f2937",
              fontSize: 14,
              margin: 0,
            }}
          >
            {pin.clientName}
          </p>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
            {new Date(pin.tripDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: 999,
            background:
              pin.status === "Completed"
                ? "#dcfce7"
                : pin.status === "Pending"
                  ? "#fef3c7"
                  : "#dbeafe",
            color:
              pin.status === "Completed"
                ? "#15803d"
                : pin.status === "Pending"
                  ? "#b45309"
                  : "#1d4ed8",
          }}
        >
          {pin.status}
        </span>
      </div>

      {/* Details */}
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 12,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <MapPin
            size={14}
            style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }}
          />
          <span style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.4 }}>
            {pin.pickupAddress}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Navigation
            size={14}
            style={{ color: "#15803d", flexShrink: 0, marginTop: 2 }}
          />
          <span style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.4 }}>
            {pin.destinationAddress}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Clock size={14} style={{ color: "#9ca3af", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Pickup: {pin.tripDate}
          </span>
        </div>
        {pin.tripCost != null && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <DollarSign size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              ${pin.tripCost.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isGreen ? "#16a34a" : "#15803d",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {pin.type === "cab" ? "Cab booking" : "Shuttle booking"}
        </span>
      </div>
    </div>
  );
}

function PinMarker({
  pin,
  onSelect,
}: {
  pin: BookingPin;
  onSelect: (pin: BookingPin) => void;
}) {
  const [markerRef] = useAdvancedMarkerRef();
  const isGreen = pin.type === "cab";

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: pin.lat, lng: pin.lng }}
      onClick={() => onSelect(pin)}
      title={pin.clientName}
    >
      <CarMarkerIcon
        color={isGreen ? "#16a34a" : "#15803d"}
        shadow={isGreen ? "rgba(22,163,74,0.45)" : "rgba(21,128,61,0.45)"}
      />
    </AdvancedMarker>
  );
}

export function BookingsMap() {
  const { data: pins } = useSuspenseQuery(bookingPinsQueryOptions);
  const [filter, setFilter] = useState<"all" | "cab" | "shuttle">("all");
  const [selectedPin, setSelectedPin] = useState<BookingPin | null>(null);

  const filtered = pins.filter((p) => filter === "all" || p.type === filter);
  const cabCount = pins.filter((p) => p.type === "cab").length;
  const shuttleCount = pins.filter((p) => p.type === "shuttle").length;

  const handleSelect = useCallback((pin: BookingPin) => {
    setSelectedPin((prev) =>
      prev?.id === pin.id && prev?.type === pin.type ? null : pin,
    );
  }, []);

  const handleClose = useCallback(() => setSelectedPin(null), []);

  // Compute bounds center
  const center =
    filtered.length > 0
      ? {
          lat: filtered.reduce((s, p) => s + p.lat, 0) / filtered.length,
          lng: filtered.reduce((s, p) => s + p.lng, 0) / filtered.length,
        }
      : { lat: -17.8252, lng: 31.0335 };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Bookings Locations
          </h2>
          <p className="text-sm text-gray-400">
            Live pickup locations for cab &amp; shuttle bookings
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 text-sm">
          {(["all", "cab", "shuttle"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setSelectedPin(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all capitalize ${
                filter === f
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all"
                ? `All (${pins.length})`
                : f === "cab"
                  ? `Cab (${cabCount})`
                  : `Shuttle (${shuttleCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
          Cab booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-700 inline-block" />
          Shuttle booking
        </span>
      </div>

      {/* Map */}
      <div className="h-[500px] w-full">
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
          <Map
            defaultCenter={center}
            defaultZoom={13}
            mapId="bookings-map"
            styles={MAP_STYLE}
            disableDefaultUI={false}
            gestureHandling="greedy"
            className="h-full w-full"
            onClick={handleClose}
          >
            {filtered.map((pin) => (
              <PinMarker
                key={`${pin.type}-${pin.id}`}
                pin={pin}
                onSelect={handleSelect}
              />
            ))}

            {selectedPin && (
              <InfoWindow
                position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
                onCloseClick={handleClose}
                pixelOffset={[0, -44]}
              >
                <BookingInfoContent pin={selectedPin} />
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
