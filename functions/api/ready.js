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

function privateAccessConfirmed(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

export function onRequestGet(context) {
  const { env = {} } = context;
  const credentialConfigured = Boolean(String(env.GITHUB_TOKEN || "").trim());
  const accessConfigured = privateAccessConfirmed(env.ACCESS_GATE_CONFIRMED);

  if (!credentialConfigured || !accessConfigured) {
    return json(
      {
        status: "not-ready",
        service: SERVICE,
        version: VERSION,
        lifecycle: "development",
        mode: "read-only",
        scope: "configuration",
        code: "deployment_not_ready",
      },
      503,
    );
  }

  return json({
    status: "ready",
    service: SERVICE,
    version: VERSION,
    lifecycle: "development",
    mode: "read-only",
    scope: "configuration",
  });
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return json({ error: "Method not allowed.", code: "method_not_allowed" }, 405);
}
