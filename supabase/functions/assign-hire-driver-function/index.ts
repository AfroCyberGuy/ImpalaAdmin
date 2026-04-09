import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AssignHireDriverPayload {
  bookingId: number;
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
  console.log("[assign-hire-driver] OneSignal result:", JSON.stringify(result));
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
  let payload: AssignHireDriverPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { bookingId, driverId } = payload;
  if (!bookingId || !driverId) {
    return jsonResponse({ error: "Missing bookingId or driverId" }, 422);
  }

  console.log(
    `[assign-hire-driver] bookingId=${bookingId} driverId=${driverId}`,
  );

  // ── Supabase service-role client ─────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("_SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("_SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── OneSignal credentials ────────────────────────────────────────────────────
  const oneSignalAppId = Deno.env.get("_ONESIGNAL_APP_ID") ?? "";
  const oneSignalApiKey = Deno.env.get("_ONESIGNAL_API_KEY") ?? "";

  try {
    // 1. Update driver_bookings — assign driver and set status to Assigned (2)
    const { error: updateError, count } = await supabase
      .from("driver_bookings")
      .update({ driver_id: driverId, hire_driver_status_id: 2 })
      .eq("id", bookingId);

    console.log(
      `[assign-hire-driver] update result — error=${JSON.stringify(updateError)} count=${count}`,
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
        .from("driver_bookings")
        .select("clients(one_signal_id)")
        .eq("id", bookingId)
        .single(),
    ]);

    const driverOneSignalId = driverAuthResult.data?.one_signal_id ?? null;
    const clientRow = bookingResult.data?.clients as {
      one_signal_id: string | null;
    } | null;
    const clientOneSignalId = clientRow?.one_signal_id ?? null;

    console.log(
      `[assign-hire-driver] driverOneSignalId=${driverOneSignalId} clientOneSignalId=${clientOneSignalId}`,
    );

    // 3. Send push notifications (non-fatal)
    if (oneSignalAppId && oneSignalApiKey) {
      await Promise.all([
        driverOneSignalId
          ? sendNotification(
              oneSignalAppId,
              oneSignalApiKey,
              [driverOneSignalId],
              "New Hire Booking Assigned",
              "You have been assigned a new driver hire booking. Please check your app for details.",
            )
          : Promise.resolve(),
        clientOneSignalId
          ? sendNotification(
              oneSignalAppId,
              oneSignalApiKey,
              [clientOneSignalId],
              "Driver Assigned",
              "A driver has been assigned to your hire booking. You will be notified when the driver is on the way.",
            )
          : Promise.resolve(),
      ]);
    } else {
      console.warn(
        "[assign-hire-driver] OneSignal credentials not set, skipping push notifications",
      );
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("[assign-hire-driver] unexpected error:", err);
    return jsonResponse(
      {
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      },
      500,
    );
  }
});
