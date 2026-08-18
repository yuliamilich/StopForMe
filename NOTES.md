## Technology Options And Tradeoffs

### Web App Structure

Recommended for the next web-demo steps: keep the current plain HTML/CSS/JavaScript unless the UI state becomes too hard to manage.

- Plain HTML/CSS/JS:
  - fastest path from the current code,
  - no dependency setup,
  - good for a single demo surface,
  - weaker once the phone flow has many screens and state transitions.
- React with Vite:
  - better component boundaries for phone screen, hardware panel, simulation controls, and state machine,
  - easier to grow into a PWA or shared phone-app logic,
  - costs time now because the existing app would need a frontend migration.

Challenge: do not migrate to React just because it is cleaner. Migrate only if Step 5 or Step 6 makes the current app state hard to reason about.

### Map Layer

Recommended for the first refined web demo: use Leaflet with OpenStreetMap tiles if a real map is needed soon; keep the existing stylized map only if speed matters more than realism.

- Existing stylized map:
  - no API key,
  - works offline,
  - easiest to control visually,
  - less convincing because it does not look like a real transit map.
- Leaflet + OpenStreetMap tiles:
  - simple, mobile-friendly, enough for stops, route line, and bus marker,
  - lower complexity than vector map stacks,
  - tile usage rules still need to be respected for sharing.
- MapLibre GL JS:
  - stronger if we want vector styling, smoother animation, and a more polished real-map look,
  - heavier and needs a tile/style source.
- Google Maps JavaScript API:
  - polished and familiar,
  - API key, billing, and licensing need review before relying on it.

### Backend Updates

Recommended for now: keep Node + Server-Sent Events.

- Server-Sent Events:
  - good fit for one-way live bus/request snapshots from backend to browser,
  - simpler than WebSockets,
  - matches the current backend direction.
- WebSockets:
  - useful later if browser/device/backend all need frequent two-way messages,
  - more complexity than needed for the web demo.
- MQTT:
  - good candidate for real ESP32 hardware later,
  - not needed before the hardware phase.

### Phone App Later

Recommended later path: first make the web demo mobile-responsive and installable as a PWA; only then decide whether a native phone app is needed.

- PWA:
  - one codebase with the web demo,
  - easy to share by URL,
  - good enough for demos and early pilots.
- React Native with Expo:
  - better if real phone sensors, native feel, app-store distribution, or deeper mobile integration become necessary,
  - more project overhead than the current web demo needs.