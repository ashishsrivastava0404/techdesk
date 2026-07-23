# Promote — Progressive Web App (PWA) Guide

## Overview

Promote is built as a Progressive Web App, providing users with an app-like experience directly in the browser. PWA features include offline access, installability, and push notifications.

## Features

### ✅ Implemented
- **Service Worker** - Cache-based offline support
- **Web App Manifest** - Installable app configuration
- **Adaptive Icons** - Theme-aware icons (light/dark mode)
- **App Shortcuts** - Quick access to key features
- **Offline Page** - Graceful degradation when offline
- **Background Sync** - Update cache in background

### 🚧 Future Enhancements
- Push notifications for ticket updates
- Background data sync
- IndexedDB for offline data storage

---

## Service Worker (sw.js)

### Location
`frontend/public/sw.js`

### Caching Strategy

```javascript
// Cache name for versioning
const CACHE_NAME = 'promote-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];
```

### Event Handlers

#### Install Event
Caches static assets when service worker is installed.

```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});
```

#### Activate Event
Cleans up old caches when new service worker activates.

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});
```

#### Fetch Event
Network-first strategy with cache fallback for dynamic content.

```javascript
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests
  if (event.request.url.includes('/api/')) return;
  
  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        event.waitUntil(
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
        );
        return cachedResponse;
      }
      
      // Fallback to network
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
```

---

## Web App Manifest (manifest.json)

### Location
`frontend/public/manifest.json`

### Configuration

```json
{
  "name": "Promote - Earn Production Access",
  "short_name": "Promote",
  "description": "A gamified ticketing platform where developers earn production access through quality work",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "/icon-dark.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "dark"
    },
    {
      "src": "/icon-light.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "light"
    }
  ],
  "categories": ["productivity", "business", "developer tools"],
  "screenshots": [
    {
      "src": "/screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshot-narrow.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Submit Ticket",
      "short_name": "Submit",
      "description": "Submit a new support ticket",
      "url": "/submit",
      "icons": [{ "src": "/icon.svg", "sizes": "any" }]
    },
    {
      "name": "View Tickets",
      "short_name": "Tickets",
      "description": "View your tickets",
      "url": "/mytickets",
      "icons": [{ "src": "/icon.svg", "sizes": "any" }]
    },
    {
      "name": "Leaderboard",
      "short_name": "Leaderboard",
      "description": "View the tech leaderboard",
      "url": "/leaderboard",
      "icons": [{ "src": "/icon.svg", "sizes": "any" }]
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
```

### Display Modes
| Mode | Description |
|------|-------------|
| `standalone` | Full app experience, no browser chrome |
| `minimal-ui` | Minimal browser controls |
| `browser` | Standard browser experience |
| `fullscreen` | Full screen, immersive experience |

---

## Adaptive Icons

### Overview
Promote uses theme-aware adaptive icons that automatically adjust based on the user's system theme preference.

### Icon Files

| File | Purpose | Theme |
|------|---------|-------|
| `icon.svg` | Default icon | Universal |
| `icon-dark.svg` | Optimized for dark mode | Dark |
| `icon-light.svg` | Optimized for light mode | Light |

### Design Elements
- **Shape**: Rounded square with ladder motif
- **Symbol**: Upward arrow representing growth
- **Colors**: 
  - Indigo (#6366f1) → Purple (#8b5cf6) gradient
  - Gold (#f59e0b) accent for promotion badge
- **Background**: Adapts to system theme

### Manifest Icon Configuration

```json
"icons": [
  {
    "src": "/icon.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "any"
  },
  {
    "src": "/icon-dark.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "dark"
  },
  {
    "src": "/icon-light.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "light"
  }
]
```

### Browser Icon Switching

```html
<!-- index.html -->
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="icon" href="/icon-dark.svg" media="(prefers-color-scheme: dark)" />
<link rel="icon" href="/icon-light.svg" media="(prefers-color-scheme: light)" />
```

---

## App Shortcuts

Shortcuts appear when users right-click the app icon on desktop or long-press on mobile.

### Configured Shortcuts

| Shortcut | URL | Description |
|----------|-----|-------------|
| Submit Ticket | `/submit` | Create a new support ticket |
| View Tickets | `/mytickets` | See your existing tickets |
| Leaderboard | `/leaderboard` | View tech rankings |

---

## Service Worker Registration

### Location
`frontend/src/main.jsx` (or `index.jsx`)

### Registration Code

```javascript
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

---

## PWA Meta Tags

### Location
`frontend/index.html`

### Required Meta Tags

```html
<!-- PWA -->
<meta name="theme-color" content="#6366f1" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Promote" />
```

---

## Testing PWA Features

### Chrome DevTools

1. Open DevTools (F12)
2. Navigate to **Application** tab
3. Check **Service Workers** section
4. Verify manifest under **Manifest**
5. Test offline mode in **Network** tab

### Lighthouse PWA Audit

```bash
npx lighthouse https://your-domain.com --preset pwa
```

### PWA Test Checklist

- [ ] Service worker registered
- [ ] Manifest loads correctly
- [ ] Icons display properly
- [ ] App installs on mobile
- [ ] Offline mode works
- [ ] Shortcuts functional

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Web Manifest | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ❌ | ❌ | ✅ |
| Background Sync | ✅ | ✅ | ❌ | ✅ |

---

## Troubleshooting

### Service Worker Not Registering
1. Check browser console for errors
2. Verify sw.js is accessible at root
3. Ensure HTTPS is enabled (required for SW)

### Cache Not Updating
1. Clear browser cache
2. Unregister service worker in DevTools
3. Reload page and re-register

### App Not Installable
1. Verify manifest.json is valid
2. Check all icon URLs return 200
3. Ensure start_url is within scope

---

## Future Enhancements

### Push Notifications
```javascript
// Request notification permission
Notification.requestPermission();

// Subscribe to push
navigator.serviceWorker.ready.then((registration) => {
  registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKey
  });
});
```

### Background Sync
```javascript
// Register for background sync
navigator.serviceWorker.ready.then((registration) => {
  return registration.sync.register('sync-tickets');
});
```

### IndexedDB for Offline Data
```javascript
// Store tickets offline
const db = await openDB('promote', 1, {
  upgrade(db) {
    db.createObjectStore('tickets', { keyPath: 'id' });
  }
});
```
