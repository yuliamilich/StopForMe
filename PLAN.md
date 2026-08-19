# StopForMe Project Plan

## Working Rule

Keep this file as the durable project plan. During planning, update this file only. During implementation, complete one approved step at a time, validate it, then update this file before moving on.

## Project Summary

StopForMe is a Moovit-like demo showing how a rider can request that a bus stop at their pickup station. The demo should make the concept believable before any real hardware exists by showing three things together:

- Phone screen: what the rider sees.
- Bus hardware simulation: what a device on the bus would show.
- Simulation controls: demo-only controls that simulate rider location and bus/request events.

The current product direction is:

- Web demo first.
- Real phone app later.
- Physical hardware last, as a bonus step after the app behavior is already proven.

The product target is broader than the first seeded demo route: the app should eventually support all available bus lines in all supported cities from imported transit data. Kavim line 117 in Modi'in is the first test route, not a hardcoded product limit.

## Current State

- Active branch: `codex/step-05-demo-shell`
- Completed foundation:
  - static Moovit-like web demo,
  - GTFS-backed Kavim line 117 route data,
  - Node backend with server-owned bus/request state,
  - modular frontend/backend code loaded through `npm start`.
- Next unfinished step: build the data-driven bus catalog and Pick Bus setup flow.

## Key Product Decisions

- Product target: all supported cities and bus lines from available transit feeds.
- First seeded route for development: Kavim line 117, direction Modi'in-Maccabim-Reut to Jerusalem.
- First seeded demo segment: Central Station -> City Hall -> Dam HaMaccabim/Hashmonaim Boulevard -> Modi'in East Junction -> Maccabim Reut Junction.
- Early pilot target can still be Modi'in-Maccabim-Reut, with the local municipality, Israel Ministry of Transport, and Kavim involved where needed.
- First detailed demo path: `Pick Bus`, not `Plan Trip`.
- `Plan Trip` stays visible as a first-screen option but is deferred.
- `Pick Bus` must be implemented as a general bus-line search flow. Line 117 can be the first indexed route, but the UI and state model should not assume only one city, agency, route, or direction.
- The hardware no longer receives a rider's in-bus drop-off request.
- The in-bus destination behavior becomes rider guidance only: if a destination was selected, the phone tells the rider how many stations remain and then says: "Get off at next station, press the stop button."
- The hardware request light means only one thing: pickup request for the next station.
- Hardware status has a separate online/offline light.

## Planning Notes

- Build reusable data and flow boundaries before polishing individual screens. Bus search, selected route, source stop, destination stop, simulated user state, bus progress, and request state should be explicit shared concepts.
- Do not split every component into its own step. The map, bus marker, route line, stops, and progress indicator belong together in one route-view step because they form one user screen and should be validated together.
- Do separate the route/catalog data model from the route-view UI. If route 117 remains hardcoded inside the UI, later support for all cities and lines will be expensive.
- Real bus location should be treated as a later data-source upgrade. For the web demo, show a realistic simulated bus moving on real route data; keep the state shape compatible with live vehicle positions later.

## Completed Steps

### Step 1: Define The Pilot Story

Status: Completed on 2026-08-04

Outcome:

- Chose Modi'in-Maccabim-Reut as the first pilot location.
- Chose Kavim line 117 and the short in-city demo segment.
- Defined the original pilot promise and success metrics.

References:

- Municipality public transport page: https://www.modiin.muni.il/modiinwebsite/ChannelArticle.aspx?PageID=1200_3038
- Moovit Kavim line 117 page: https://moovitapp.com/index/en/public_transit-line-117-Israel-1-13-668447-0?d=2781000

### Step 2: Build The Simulated Web Demo

Status: Completed on 2026-08-04

Outcome:

- Added a static Moovit-like rider demo that opens from `index.html`.
- Added route/stops, moving bus marker, ETA, next-stop state, stop timeline, request controls, reset control, and driver-device light simulation.
- Added clear states for no request, pending, driver received, arriving, completed, and passed.

Validation:

- `node --check app.js` passed.

### Step 3: Add Real Transit Data

Status: Completed on 2026-08-11

Outcome:

- Used Israel Ministry of Transport static GTFS data.
- Added `scripts/import-gtfs.mjs` to generate `data/line-117.js`.
- Updated the app to load GTFS-backed route metadata, stops, shape, request targets, and duration, with simulated fallback data still available.
- Generated route data for Kavim line 117 with 10 stops and 39-minute duration.

Validation:

- `npm run check` passed.
- `node --check data/line-117.js` passed.
- GTFS importer, route-shape monotonicity, and demo pacing checks passed.

### Step 4: Add Request Management Backend

Status: Completed on 2026-08-13

Outcome:

- Added `server.mjs`, a no-dependency Node.js HTTP server.
- Added backend-owned bus progress, current position, previous/next stops, ETA/status text, request lifecycle, and driver-light state.
- Added API endpoints: `/api/state`, `/api/events`, `/api/requests`, and `/api/reset`.
- Updated `app.js` so server mode renders backend snapshots and sends request/reset actions to the backend.
- Preserved direct `index.html` local simulation fallback.

Validation:

- `npm run check` passed.
- Backend API and reset movement checks passed.

## Web Demo Implementation Plan

### Step 5: Redesign The Demo Shell

Status: Completed on 2026-08-18

Branch:

- Base branch: `main`
- Step branch: `codex/step-05-demo-shell`

Goal:

- Reframe the web demo around the new sketch: phone screen, bus hardware simulation, and simulation controls visible together.

Work:

- Replace the current rider-focused layout with a three-area demo layout:
  - phone screen,
  - bus hardware simulation,
  - simulation control panel.
- Add the first phone screen with two options:
  - `Plan Trip`,
  - `Pick Bus`.
- Keep `Plan Trip` visible but disabled or marked as later.
- Make `Pick Bus` the active path for the next steps.
- Update the hardware simulation:
  - bus number shown above the hardware only when relevant,
  - request light: blue means pickup request for the next station, off means no request,
  - status light: green means online, red means offline.
- Remove UI/state language that implies a hardware drop-off request.

Completion criteria:

- The web demo clearly looks like a phone app plus separate bus hardware plus separate simulation controls.
- The hardware panel has only request and status lights.
- No user-facing flow suggests that the bus hardware receives a drop-off request.

Outcome:

- Replaced the old rider-app-plus-driver-panel layout with three visible areas:
  - rider phone simulation,
  - driver hardware simulation,
  - demo simulation controls.
- Added the first phone screen with `Plan Trip` visible as a deferred option and `Pick Bus` marked as the active path.
- Moved the current pickup request action into the simulation controls.
- Updated the driver hardware model to show only:
  - a blue pickup request light,
  - a green/red online status light,
  - the bus number only when the pickup request light is active.
- Removed user-facing drop-off request controls and driver-device drop-off light language.
- Cleaned the backend driver-device snapshot so it exposes one pickup request light plus device online status instead of separate pickup/drop-off hardware lights.
- Split the frontend code into focused modules:
  - `src/client/api-client.js` for backend connection and Server-Sent Events,
  - `src/client/local-simulation.js` for direct browser simulation fallback logic,
  - `src/client/phone-view.js` for phone/map/timeline rendering,
  - `src/client/hardware-view.js` for driver hardware rendering,
  - `src/client/simulation-controls-view.js` for demo control rendering,
  - `src/client/app-controller.js` for wiring state, views, events, and API calls.
- Split shared and backend code into focused modules:
  - `src/shared/request-labels.js` and `src/shared/route-helpers.js` for reused constants and route math,
  - `src/server/route-data-loader.js` for GTFS-backed route loading,
  - `src/server/simulation-state.js` for bus/request state,
  - `src/server/driver-device-state.js` for hardware-facing state,
  - `src/server/static-file-server.js` for static assets and JSON responses,
  - `src/server/http-server.js` for HTTP routes, SSE clients, and the simulation timer.
- Reduced root `app.js` and `server.mjs` to entry points.
- Added `scripts/check-syntax.mjs` and updated `npm run check` so validation covers all project JavaScript modules.
- Recorded implementation constraint: after the module split, the supported demo path is `npm start`; opening `index.html` directly is no longer treated as a supported runtime because browser ES modules need to be served with JavaScript MIME types.

Validation:

- `npm run check` passed on 2026-08-18.
- `GET /` returned `200` from `npm start`.
- `GET /app.js` and `GET /src/client/app-controller.js` returned `text/javascript`.
- `GET /api/state` returned pickup-only driver-device state.
- Reset plus pickup request smoke test turned `driverDevice.requestLightActive` on with `requestType: "pickup"`.

### Step 6: Build Data-Driven Bus Catalog And Pick Bus Setup

Status: Not started

Goal:

- Let the user search available bus lines and configure the source station before starting the live route view, without hardcoding the UI to line 117.

Work:

- Define or import a route catalog that can contain multiple cities, agencies, lines, directions, route shapes, and stop lists.
- Seed the catalog with line 117 first, but keep the data shape ready for more routes/cities.
- Add bus-number search over the route catalog.
- Show matching bus options with enough context to distinguish city, agency, route, and direction.
- After a bus is picked, ask the user to select a source station from that route's stop list.
- Let the user optionally select a destination station.
- Require the user to press `Start` before the request flow begins.
- If the source station is picked, keep the request waiting until the simulated user arrives at the station.

Completion criteria:

- The user can search the route catalog and pick bus 117 as the first seeded route.
- The user can choose a source station and optional destination.
- The route view starts only after pressing `Start`.
- No pickup request is sent during setup.
- Adding another route should require adding/importing data, not rewriting the phone-flow UI.

### Step 7: Build Live Route View

Status: Not started

Goal:

- Show the selected route as a real transit experience: map, route shape, stops, bus marker, and bus progress.

Work:

- Show the route map for the selected bus/direction.
- Draw the selected route shape and stops.
- Show a simulated live bus marker moving along the selected route.
- Show route progress, next stop, and ETA using backend state.
- Show the phone message: "Request will be sent when close to the station."
- Keep the hardware request light off until the request rules in the next step activate it.

Completion criteria:

- After pressing `Start`, the phone shows the selected route, stops, bus marker, and progress.
- The map/route view reads from the selected route data, not route-117-specific UI logic.
- The backend state and phone route view stay synchronized.

### Step 8: Build Pickup Request Simulation

Status: Not started

Goal:

- Simulate the real pickup behavior: the request is sent only after the user is close to the selected station, and the bus hardware lights only when that station is the bus's next station.

Work:

- Add simulation control: `Arrived at station`.
- When `Arrived at station` is pressed:
  - send the pickup request,
  - update the phone message to show that the request was sent,
  - keep the hardware request light off until the requested station is the bus's next station.
- When the requested station becomes the next station:
  - turn the hardware request light blue,
  - show the relevant bus number above the hardware.
- Complete the request when the bus reaches the station.

Completion criteria:

- Request timing matches the intended product behavior.
- The hardware light does not turn on early.
- The phone message and hardware state agree with the backend state.

### Step 9: Add User Location And Ride Guidance States

Status: Not started

Goal:

- Let the demo simulate common user movement states without using real phone GPS.

Work:

- Add simulation controls:
  - `Left the station`,
  - `Started ride`.
- `Left the station` cancels the active pickup request and updates the phone message.
- `Started ride` means the user's simulated location now approximately matches the bus location.
- After `Started ride`, if a destination station exists:
  - show `N stations away`,
  - then show "Get off at next station, press the stop button" when the destination is next.
- Do not send a hardware request for destination/drop-off.
- Retire or replace the remaining backend drop-off request lifecycle once destination guidance state exists, so drop-off is no longer represented as a backend hardware-style request.

Completion criteria:

- Leaving the station cancels or expires the pickup request cleanly.
- Starting the ride changes the phone into in-bus guidance mode.
- Destination guidance works without using the hardware request light.

### Step 10: Polish The Web Demo For Pitch Use

Status: Not started

Goal:

- Make the web demo feel polished enough to show to a city/operator or Moovit contact.

Work:

- Tighten the Moovit-like visual style without copying protected branding exactly.
- Improve mobile-screen realism and spacing.
- Add clear empty, loading, offline, active, cancelled, completed, and passed states.
- Add a demo reset flow that returns phone, hardware, simulation controls, and backend state to a known starting point.
- Add focused tests for the request state machine.
- Run browser checks at desktop and mobile widths.

Completion criteria:

- A five-minute demo script can be run start-to-finish without confusing state.
- The app works through `npm start`.
- The direct-file fallback either still works or is intentionally removed with a recorded reason.

## Later Product Plan

### Step 11: Add Plan Trip Flow

Status: Later

Goal:

- Let normal riders start from origin/destination instead of already knowing the bus number.

Notes:

- This likely needs route search, stop search, departure time, candidate route ranking, and clearer handling of multiple nearby buses.
- It should come after `Pick Bus` is polished because it expands the route-planning problem.

### Step 12: Create Phone App Or PWA

Status: Later

Goal:

- Turn the proven web demo behavior into a phone-ready product surface.

Notes:

- Start by making the web demo responsive and PWA-capable.
- Consider React Native with Expo only if native app behavior becomes necessary.

### Step 13: Add Physical Hardware Prototype

Status: Bonus / last

Goal:

- Build real bus-side hardware after the app/backend behavior is already proven.

Notes:

- Hardware should subscribe to the same backend state already proven in the web demo.
- First prototype can use ESP32, Wi-Fi/hotspot, optional GPS, and two indicators:
  - blue request light,
  - green/red online status light.
- MQTT may become useful here, but it should not drive the earlier web-demo architecture.

### Step 14: Run Controlled Field Tests And Pitch

Status: Later

Goal:

- Validate the full workflow and package evidence for city/operator discussions.

Notes:

- Test request latency, missed requests, false positives, user confusion, and driver understanding.
- Create a short pitch deck and live demo script.
- Approach a local city or transit agency before approaching Moovit.

## Planned Interfaces

Route data:

- City/area: id, name, country, supported agencies.
- Agency: id, name, city/area, source feed.
- Line: id, public number, agency, city/area, available directions.
- Direction: id, headsign, route shape, ordered stops, estimated duration.
- Stop: id, name, latitude, longitude, sequence, served lines.
- Bus state: route id, current position, next stop, speed, progress.
- Request state: type, stop id, bus id, status, created time, acknowledged time.

Backend API:

- Current implemented API: `/api/state`, `/api/events`, `/api/requests`, `/api/reset`.
- Future API should add catalog/route lookup endpoints before broader city/line support:
  - list supported cities/areas,
  - search lines by number/city/agency,
  - return line directions,
  - return stops and route shape for a selected direction.
- Future API may add bus-specific, WebSocket, or MQTT interfaces for real hardware/live updates.

Hardware protocol:

- Device subscribes to an assigned bus id.
- Backend sends pickup request events for the next station.
- Device reports online status, GPS position if available, and acknowledgement.

## Overall Test Plan

- Demo works without internet or API keys where possible.
- User can choose `Pick Bus` from the first screen.
- User can search the route catalog and pick a seeded bus line.
- The first seeded route can be line 117, but the flow should be ready for additional cities, agencies, lines, and directions.
- User can choose source station and optional destination station.
- The route view shows the selected route shape, stops, simulated bus location, and progress.
- Pickup request is not sent until the user is simulated as close to the source station.
- Hardware request light turns blue only when the requested station is the bus's next station.
- Hardware status light shows online/offline state separately from request state.
- Leaving the station cancels the request and updates the phone message.
- Starting the ride changes the phone to destination guidance if a destination was selected.
- Destination guidance never sends a hardware stop request.
- Requests complete when the bus arrives and expire when the bus passes the stop.
- Pilot script can be run start-to-finish in under five minutes.

## Assumptions

- First serious target is a local city or transit agency, not Moovit directly.
- First deliverable is a shareable web demo, not a native mobile app.
- First physical device is optional and comes after the app works convincingly.
- Simulated user location is acceptable for the web demo.
- Static GTFS data is enough for the first web demo; realtime vehicle data can come later.
- "All cities and lines" means all cities/lines available in supported imported feeds, not every transit system in the world on day one.
- Moovit should be approached after there is a convincing working demo and early local validation.
