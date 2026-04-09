import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AssignShuttleDriverPayload {
  tripId: number;
  driverId: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function sendNotification(
  appId: string,
  apiKey: string,
  playerIds: string[],
  heading: string,
  content: string,
): Promise<void> {
  const filtered = playerIds.filter(Boolean);
  if (filtered.length === 0) return;

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_player_ids: filtered,
      headings: { en: heading },
      contents: { en: content },
    }),
  });

  const result = await res.json();
  console.log(
    "[assign-shuttle-driver] OneSignal result:",
    JSON.stringify(result),
  );
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  let payload: AssignShuttleDriverPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { tripId, driverId } = payload;
  if (!tripId || !driverId) {
    return jsonResponse({ error: "Missing tripId or driverId" }, 422);
  }

  console.log(`[assign-shuttle-driver] tripId=${tripId} driverId=${driverId}`);

  // ── Supabase service-role client ─────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("_SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("_SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── OneSignal credentials ────────────────────────────────────────────────────
  const oneSignalAppId = Deno.env.get("_ONESIGNAL_APP_ID") ?? "";
  const oneSignalApiKey = Deno.env.get("_ONESIGNAL_API_KEY") ?? "";

  try {
    // 1. Update shuttle_bookings row — assign driver and set status to active (2)
    const { error: updateError, count } = await supabase
      .from("shuttle_bookings")
      .update({ driver_id: driverId, trip_status_id: 2 })
      .eq("id", tripId);

    console.log(
      `[assign-shuttle-driver] update result — error=${JSON.stringify(updateError)} count=${count}`,
    );

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    // 2. Fetch driver and client OneSignal IDs in parallel
    const [driverAuthResult, bookingResult] = await Promise.all([
      supabase
        .from("driver_auths")
        .select("one_signal_id")
        .eq("driver_id", driverId)
        .single(),
      supabase
        .from("shuttle_bookings")
        .select("clients(one_signal_id)")
        .eq("id", tripId)
        .single(),
    ]);

    const driverOneSignalId = driverAuthResult.data?.one_signal_id ?? null;
    const clientRow = bookingResult.data?.clients as {
      one_signal_id: string | null;
    } | null;
    const clientOneSignalId = clientRow?.one_signal_id ?? null;

    console.log(
      `[assign-shuttle-driver] driverOneSignalId=${driverOneSignalId} clientOneSignalId=${clientOneSignalId}`,
    );

    // 3. Send push notifications (non-fatal)
    if (oneSignalAppId && oneSignalApiKey) {
      await Promise.all([
        driverOneSignalId
          ? sendNotification(
              oneSignalAppId,
              oneSignalApiKey,
              [driverOneSignalId],
              "New Shuttle Trip Assigned",
              "You have been assigned a new shuttle trip. Please check your app for details.",
            )
          : Promise.resolve(),
        clientOneSignalId
          ? sendNotification(
              oneSignalAppId,
              oneSignalApiKey,
              [clientOneSignalId],
              "Shuttle Trip Assigned",
              "A driver has been assigned to your shuttle trip. You will be notified as the driver comes to pick you up.",
            )
          : Promise.resolve(),
      ]);
    } else {
      console.warn(
        "[assign-shuttle-driver] OneSignal credentials not set, skipping push notifications",
      );
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("[assign-shuttle-driver] unexpected error:", err);
    return jsonResponse(
      {
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      },
      500,
    );
  }
});
