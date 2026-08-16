# StopForMe Project Plan

## Working Rule

Keep this file as the short durable project plan. After each completed project step, update status, validation, current state, and the next unfinished step.

## Project Summary

StopForMe is a Moovit-like demo showing how a rider can request that a bus stop at a selected pickup stop and destination stop. The demo should show rider request state, realistic route/stops, simulated bus movement, and a driver-facing hardware signal.

Default path:

- Build the simulated web demo first.
- Add real transit data before paid or restricted APIs.
- Move request/bus state into a backend.
- Prototype the driver device with ESP32 hardware.
- Use the working demo and prototype to pitch a local city or transit agency before approaching Moovit.

## Current State

- Active branch: `step-04-request-backend`
- Step 4 backend work is implemented.
- In server mode, `server.mjs` owns bus movement, request lifecycle, and driver-light state.
- In local file mode, the frontend simulation still works as a fallback.
- Next unfinished step: Step 5, create ESP32 hardware prototype.

## Key Decisions

- First target: Modi'in-Maccabim-Reut.
- Transit stakeholders: local municipality, Israel Ministry of Transport, and Kavim where needed.
- First route: Kavim line 117, direction Modi'in-Maccabim-Reut to Jerusalem.
- Demo segment: Central Station -> City Hall -> Dam HaMaccabim/Hashmonaim Boulevard -> Modi'in East Junction -> Maccabim Reut Junction.
- Rider story: pickup request at City Hall and drop-off request at Maccabim Reut Junction.
- First product format: web app demo.
- First hardware format: ESP32 prototype with two request lights, GPS, and Wi-Fi/hotspot connectivity.
- Public static GTFS data is preferred first; GTFS Realtime, Moovit, or Google APIs can be evaluated later if practical.

## Completed Steps

### Step 1: Define The Pilot Story

Status: Completed on 2026-08-04

Outcome:

- Chose Modi'in-Maccabim-Reut as the first pilot location.
- Chose Kavim line 117 and the short in-city demo segment.
- Defined the pilot promise: the rider requests pickup before City Hall, then requests or confirms drop-off before Maccabim Reut Junction; the driver sees the correct light before arrival.
- Defined success metrics: request delivery time, driver visibility, rider clarity, missed-stop reduction, and operator feedback.

References:

- Municipality public transport page: https://www.modiin.muni.il/modiinwebsite/ChannelArticle.aspx?PageID=1200_3038
- Moovit Kavim line 117 page: https://moovitapp.com/index/en/public_transit-line-117-Israel-1-13-668447-0?d=2781000

### Step 2: Build The Simulated Web Demo

Status: Completed on 2026-08-04

Branch:

- Base branch: `main`
- Step branch: `step-02-simulated-web-demo`

Outcome:

- Added a static Moovit-like rider demo that opens from `index.html`.
- Added route/stops, moving bus marker, ETA, next-stop state, stop timeline, request controls, reset control, and driver-device light simulation.
- Added clear states for no request, pending, driver received, arriving, completed, and passed.
- Corrected the driver-light behavior so the light turns on only when the next stop is the requested stop.

Validation:

- `node --check app.js` passed.

### Step 3: Add Real Transit Data

Status: Completed on 2026-08-11

Branch:

- Base branch: `main`
- Step branch: `step-03-real-transit-data`

Outcome:

- Used Israel Ministry of Transport static GTFS data from https://gtfs.mot.gov.il/gtfsfiles/.
- Added `scripts/import-gtfs.mjs` to generate `data/line-117.js`.
- Updated the app to load GTFS-backed route metadata, stops, shape, request targets, and duration, with simulated fallback data still available.
- Generated route data for Kavim line 117 with 10 stops, 39-minute duration, pickup target City Hall, and drop-off target Maccabim Reut Junction.
- Aligned stop progress to the route shape instead of evenly spacing stops.
- Kept the stylized SVG map placeholder; a real street map layer is deferred.

Validation:

- `npm run check` passed.
- `node --check data/line-117.js` passed.
- GTFS importer fixture and real-feed generation checks passed.
- Route-shape monotonicity and demo pacing checks passed.

### Step 4: Add Request Management Backend

Status: Completed on 2026-08-13

Branch:

- Base branch: `main`
- Step branch: `step-04-request-backend`

Outcome:

- Added `server.mjs`, a no-dependency Node.js HTTP server.
- Added backend-owned bus progress, current position, previous/next stops, ETA/status text, request lifecycle, and driver-light state.
- Added API endpoints:
  - `GET /api/state`
  - `GET /api/events`
  - `POST /api/requests`
  - `POST /api/reset`
- Updated `app.js` so server mode renders backend snapshots and sends request/reset actions to the backend.
- Preserved direct `index.html` local simulation fallback.
- Updated `package.json` with `npm start` and backend syntax checking.

Validation:

- `npm run check` passed.
- Backend API check passed for startup, state fetch, request creation, delayed pickup acknowledgement, and reset.
- Reset movement check passed: progress returns to 0 and then increases again after reset.

## Remaining Steps

### Step 5: Create ESP32 Hardware Prototype

Status: Not started

Goal:

- Build a desk prototype that receives backend request state and lights separate pickup/drop-off indicators.

Work:

- Use an ESP32 board, two LEDs or light modules, GPS module, Wi-Fi or hotspot connectivity, and a basic enclosure.
- Connect the device to the backend.
- Light the pickup or drop-off indicator based on incoming requests.
- Send online/offline status, GPS position, and acknowledgement back to the backend.

Completion criteria:

- Device can connect to the backend.
- Pickup and drop-off lights respond to the correct simulated request state.
- Device status is visible or logged by the backend.

### Step 6: Run Controlled Field Tests

Status: Not started

Goal:

- Validate the workflow outside the browser-only demo.

Work:

- Test simulated bus movement end to end.
- Test the ESP32 device on a desk with backend events.
- Test movement using a car or walking route near selected stops.
- If permission is available, test in a depot or real bus environment.
- Record request latency, missed requests, false positives, driver understanding, and rider confusion points.

### Step 7: Prepare The City And Moovit Pitch

Status: Not started

Goal:

- Package the demo, hardware prototype, and validation evidence into a short pilot pitch.

Work:

- Create a short pitch deck and live demo script.
- Lead with city/operator value: accessibility, fewer missed pickups, better low-frequency route service, safer late-night rider experience, and low-cost pilot hardware.
- Ask a local city or transit agency for a limited pilot.
- Approach Moovit after local validation exists.

## Planned Interfaces

Route data:

- Stop: id, name, latitude, longitude, sequence.
- Route: id, name, color, shape, stops.
- Bus state: route id, current position, next stop, speed, progress.
- Request state: type, stop id, bus id, status, created time, acknowledged time.

Backend API:

- Current implemented API: `/api/state`, `/api/events`, `/api/requests`, `/api/reset`.
- Future API may add route-specific, bus-specific, WebSocket, or MQTT interfaces for real hardware/live updates.

Hardware protocol:

- Device subscribes to an assigned bus id.
- Backend sends pickup and drop-off request events.
- Device reports online status, GPS position, and acknowledgement.

## Overall Test Plan

- Demo works without internet or API keys.
- User can choose source and destination stops.
- Bus moves along the route and updates the next stop.
- Pickup request lights the pickup indicator at the right time.
- Drop-off request lights the drop-off indicator at the right time.
- Requests complete when the bus arrives and expire when the bus passes the stop.
- GTFS import maps stops and route shape correctly.
- ESP32 receives backend request events within acceptable latency.
- Pilot script can be run start-to-finish in under five minutes.

## Assumptions

- First serious target is a local city or transit agency, not Moovit directly.
- First deliverable is a shareable web app, not a native mobile app.
- First physical device is an ESP32 prototype, not production hardware.
- Simulated data is acceptable for version 1.
- Moovit should be approached after there is a convincing working demo and early local validation.
