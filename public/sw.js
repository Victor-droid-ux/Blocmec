self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  // No-op service worker to satisfy legacy registrations.
});
