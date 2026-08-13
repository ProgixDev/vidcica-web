/* Vidcica service worker — Web Push only.
 *
 * Deliberately minimal: it does NOT precache or intercept fetches (no offline
 * layer), so it can never serve a stale build or interfere with Next.js. Its
 * only jobs are to display an incoming push and route the click. The send-web-push
 * edge function posts a JSON payload of { title, body, data: { url, ... } }.
 */

self.addEventListener("install", () => {
  // Activate this SW immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of already-open tabs so the first subscribe works without a reload.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Vidcica", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Vidcica";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon.png",
    badge: "/icon.png",
    tag: payload.tag || undefined,
    data: payload.data || {},
    renotify: Boolean(payload.tag),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = typeof data.url === "string" && data.url ? data.url : "/notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        // Focus an existing tab (navigating it to the target) if one is open.
        for (const client of windows) {
          if ("focus" in client) {
            if ("navigate" in client) {
              client.navigate(target).catch(() => {});
            }
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
