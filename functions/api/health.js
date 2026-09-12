const SERVICE = "goreecloud-github-dashboard";
const VERSION = "0.3.0-dev";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function onRequestGet() {
  return json({
    status: "ok",
    service: SERVICE,
    version: VERSION,
    lifecycle: "development",
    mode: "read-only",
    scope: "process",
  });
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return json({ error: "Method not allowed.", code: "method_not_allowed" }, 405);
}
