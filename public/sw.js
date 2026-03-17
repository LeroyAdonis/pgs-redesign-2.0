// No-op service worker.
// Chrome auto-probes /sw.js when a <meta name="theme-color"> tag is present.
// This stub returns 200 and immediately activates so the browser stops
// logging 404s — without adding any caching or offline functionality.
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
