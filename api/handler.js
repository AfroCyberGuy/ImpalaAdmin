// Vercel serverless function entry — delegates all requests to TanStack Start
import server from "../dist/server/server.js";

export default function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url, `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value != null) {
      headers.set(key, value);
    }
  }

  const request = new Request(url.href, {
    method: req.method,
    headers,
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? new ReadableStream({
            start(controller) {
              req.on("data", (chunk) => controller.enqueue(chunk));
              req.on("end", () => controller.close());
              req.on("error", (err) => controller.error(err));
            },
          })
        : undefined,
    duplex: "half",
  });

  return server.fetch(request).then(async (response) => {
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const body = await response.arrayBuffer();
    res.end(Buffer.from(body));
  });
}
