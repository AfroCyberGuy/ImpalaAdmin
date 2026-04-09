import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  citiesQueryOptions,
  shuttleCitiesQueryOptions,
  addCity,
  updateCity,
  deleteCity,
  addShuttleCity,
  updateShuttleCity,
  deleteShuttleCity,
  type City,
  type ShuttleCity,
} from "#/utils/queries/shuttleCityQueries";
import { carClassificationsQueryOptions } from "#/utils/queries/carClassificationQueries";

export const Route = createFileRoute("/dashboard/pricing/shuttle/")({
  component: ShuttlePricingPage,
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function parsePositive(raw: string): number | null {
  const n = parseFloat(raw);
  return isNaN(n) || n < 0 ? null : n;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── City Row ───────────────────────────────────────────────────────────────────

function CityRow({ item, idx }: { item: City; idx: number }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editName, setEditName] = useState(item.city_name);

  const updateMutation = useMutation({
    mutationFn: () => updateCity(item.id, editName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      setIsEditing(false);
      toast.success("City updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCity(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      queryClient.invalidateQueries({ queryKey: ["shuttle_cities"] });
      toast.success("City deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";

  if (isEditing) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
      >
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
        />
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || !editName.trim()}
          className="whitespace-nowrap rounded-md bg-[#2D5016] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updateMutation.isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setEditName(item.city_name);
          }}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
      >
        <span className="flex-1 text-sm text-gray-700">
          Delete{" "}
          <span className="font-semibold text-gray-900">{item.city_name}</span>?
          This cannot be undone.
        </span>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="whitespace-nowrap rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {deleteMutation.isPending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {item.city_name}
        </p>
        <p className="text-xs text-gray-400">
          Created on: {fmtDate(item.created_at)}
        </p>
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => setConfirmDelete(true)}
        className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}

// ── Shuttle Rate Row ───────────────────────────────────────────────────────────

function ShuttleRateRow({ item, idx }: { item: ShuttleCity; idx: number }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editPrice, setEditPrice] = useState(String(item.price_per_km));

  const updateMutation = useMutation({
    mutationFn: () =>
      updateShuttleCity(item.id, {
        price_per_km: parsePositive(editPrice) ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shuttle_cities"] });
      setIsEditing(false);
      toast.success("Rate updated.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteShuttleCity(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shuttle_cities"] });
      toast.success("Rate deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50";
  const cityName = item.cities?.city_name ?? "Unknown";
  const className = item.car_classifications?.classification ?? "Unknown";
  const modifiedDate = item.updated_at ?? item.created_at;

  if (isEditing) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{cityName}</p>
          <p className="text-xs text-gray-500">{className}</p>
        </div>
        <input
          autoFocus
          type="number"
          min="0"
          step="0.01"
          value={editPrice}
          onChange={(e) => setEditPrice(e.target.value)}
          className="w-32 rounded-lg border border-[#2D5016] px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
        />
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || !parsePositive(editPrice)}
          className="whitespace-nowrap rounded-md bg-[#2D5016] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updateMutation.isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setEditPrice(String(item.price_per_km));
          }}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
      >
        <span className="flex-1 text-sm text-gray-700">
          Delete rate for{" "}
          <span className="font-semibold text-gray-900">
            {cityName} — {className}
          </span>
          ? This cannot be undone.
        </span>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="whitespace-nowrap rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {deleteMutation.isPending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${rowBg} border-b border-gray-100`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{cityName}</p>
        <p className="text-xs text-gray-500">{className}</p>
        <p className="text-xs font-medium text-gray-700 mt-0.5">
          {fmt(item.price_per_km)} per km
        </p>
        <p className="text-xs text-gray-400">
          Modified on: {fmtDate(modifiedDate)}
        </p>
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => setConfirmDelete(true)}
        className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function ShuttlePricingPage() {
  const queryClient = useQueryClient();

  const { data: cities = [], isLoading: citiesLoading } =
    useQuery(citiesQueryOptions);
  const { data: classifications = [], isLoading: classLoading } = useQuery(
    carClassificationsQueryOptions,
  );
  const { data: shuttleRates = [], isLoading: ratesLoading } = useQuery(
    shuttleCitiesQueryOptions,
  );

  // Add city form
  const [newCity, setNewCity] = useState("");

  const addCityMutation = useMutation({
    mutationFn: () => addCity(newCity.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      setNewCity("");
      toast.success("City added.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Add shuttle rate form
  const [classId, setClassId] = useState<number | "">("");
  const [cityId, setCityId] = useState<number | "">("");
  const [pricePerKm, setPricePerKm] = useState("");
  const [filterCityId, setFilterCityId] = useState<number | "">("");

  const isDuplicateRate =
    classId !== "" &&
    cityId !== "" &&
    shuttleRates.some(
      (r) => r.car_classification_id === classId && r.city_id === cityId,
    );

  const canAddRate =
    classId !== "" &&
    cityId !== "" &&
    !!parsePositive(pricePerKm) &&
    !isDuplicateRate;

  const addRateMutation = useMutation({
    mutationFn: () =>
      addShuttleCity({
        car_classification_id: classId as number,
        city_id: cityId as number,
        price_per_km: parsePositive(pricePerKm) ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shuttle_cities"] });
      setClassId("");
      setCityId("");
      setPricePerKm("");
      toast.success("Shuttle rate added.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredRates =
    filterCityId === ""
      ? shuttleRates
      : shuttleRates.filter((r) => r.city_id === filterCityId);

  return (
    <div className="px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        City to City Shuttle Pricing
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Manage cities and set per-km shuttle rates for each car class.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ── Left: Cities ── */}
        <div className="flex flex-col gap-6">
          {/* Add city form */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Add City
            </h2>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-medium text-gray-600">
                City name
              </label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    newCity.trim() &&
                    !addCityMutation.isPending
                  ) {
                    addCityMutation.mutate();
                  }
                }}
                placeholder="Enter city"
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => addCityMutation.mutate()}
                disabled={!newCity.trim() || addCityMutation.isPending}
                className="rounded-lg bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addCityMutation.isPending ? "Adding…" : "Add City"}
              </button>
            </div>
          </div>

          {/* Cities list */}
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {citiesLoading ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                Loading…
              </p>
            ) : cities.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                No cities yet. Add one above.
              </p>
            ) : (
              cities.map((city, idx) => (
                <CityRow key={city.id} item={city} idx={idx} />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Shuttle Rates ── */}
        <div className="flex flex-col gap-6">
          {/* Add rate form */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Add Shuttle Rate
            </h2>
            <div className="flex flex-col gap-4 mb-4">
              {/* Car class */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Car class
                </label>
                <select
                  value={classId}
                  onChange={(e) =>
                    setClassId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
                >
                  <option value="">Select car class</option>
                  {classifications.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.classification}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  City
                </label>
                <select
                  value={cityId}
                  onChange={(e) =>
                    setCityId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.city_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price per km */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Amount (per km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(e.target.value)}
                  placeholder="Enter price per km"
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
                />
              </div>

              {isDuplicateRate && (
                <p className="text-xs text-red-500">
                  A rate for this city and car class already exists. Edit the
                  existing entry instead.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => addRateMutation.mutate()}
                disabled={!canAddRate || addRateMutation.isPending}
                className="rounded-lg bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a6a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addRateMutation.isPending ? "Saving…" : "Add Shuttle Rate"}
              </button>
            </div>
          </div>

          {/* Filter + rates list */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-600">
                Filter by city
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={filterCityId}
                  onChange={(e) =>
                    setFilterCityId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 focus:border-[#2D5016] focus:outline-none focus:ring-1 focus:ring-[#2D5016]"
                >
                  <option value="">All cities</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.city_name}
                    </option>
                  ))}
                </select>
                {filterCityId !== "" && (
                  <button
                    onClick={() => setFilterCityId("")}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {ratesLoading || classLoading ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                Loading…
              </p>
            ) : filteredRates.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">
                No shuttle rates yet. Add one above.
              </p>
            ) : (
              filteredRates.map((rate, idx) => (
                <ShuttleRateRow key={rate.id} item={rate} idx={idx} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
