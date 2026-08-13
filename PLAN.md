# StopForMe Project Plan

## Working Rule

After every completed project step, update this file before moving to the next step.

## Summary

StopForMe is a demo integration concept for a Moovit-like transit experience. The goal is to let a rider choose a pickup stop and destination stop, request that the bus stop for them, and show both the rider-facing state and the driver-facing hardware signal.

Default project path:

- Build a simulated web demo first.
- Add real transit data and APIs after the demo works.
- Prototype the driver hardware with an ESP32 device.
- Use the working demo and hardware prototype to pitch a local city or transit agency first, then approach Moovit with evidence.

## Step 1: Define The Pilot Story

Status: Completed on 2026-08-04

Decisions:

- First target: Modi'in-Maccabim-Reut, working through the local municipality, Israel Ministry of Transport, and Kavim where needed.
- First product format: web app demo.
- First hardware format: ESP32 prototype.
- First demo route: Kavim line 117, direction Modi'in-Maccabim-Reut to Jerusalem.
- First demo segment: Modi'in-Maccabim-Reut Central Station -> City Hall -> Dam HaMaccabim/Hashmonaim Boulevard -> Modi'in East Junction -> Maccabim Reut Junction.
- First rider story: rider requests pickup at City Hall and drop-off at Maccabim Reut Junction.

Work:

- Choose one target city or transit agency. Done: Modi'in-Maccabim-Reut.
- Choose one simple bus route. Done: Kavim line 117.
- Choose source and destination stops for the demo. Done: pickup at City Hall, drop-off at Maccabim Reut Junction.
- Define the main pilot promise. Done: a rider can request pickup before the bus reaches City Hall, then request or confirm drop-off before the bus reaches Maccabim Reut Junction; the driver sees the correct pickup or drop-off light before arrival.
- Define success metrics. Done:
  - request delivery time,
  - driver visibility,
  - rider clarity,
  - missed-stop reduction,
  - operator feedback.

Pilot notes:

- The municipality states that Modi'in-Maccabim-Reut public transport is operated with the Ministry of Transport and Kavim, and that the Ministry of Transport has authority over public transport.
- The municipality says city and intercity bus lines depart from the central transport complex near Modi'in Center railway station.
- Moovit lists Kavim line 117 as Modi'in-Maccabim-Reut to Jerusalem, with 10 stops, including Modi'in-Maccabim-Reut Central Station, City Hall, Dam HaMaccabim/Hashmonaim Boulevard, Modi'in East Junction, and Maccabim Reut Junction.
- Moovit lists the total line 117 trip duration as approximately 39 minutes, which makes a short in-city segment practical for a focused demo.

References:

- Municipality public transport page: https://www.modiin.muni.il/modiinwebsite/ChannelArticle.aspx?PageID=1200_3038
- Moovit Kavim line 117 page: https://moovitapp.com/index/en/public_transit-line-117-Israel-1-13-668447-0?d=2781000

## Step 2: Build The Simulated Web Demo

Status: Completed on 2026-08-04

Branch:

- Base branch: main
- Step branch: step-02-simulated-web-demo

Work:

- Create a Moovit-like rider screen focused on map, route, stops, bus movement, and request controls. Done.
- Use simulated data for:
  - route shape,
  - stop list,
  - bus position,
  - ETA,
  - pickup request state,
  - drop-off request state.
- Add a driver-device simulation panel with two lights. Done:
  - pickup request,
  - drop-off request.
- Show clear state changes. Done:
  - no request,
  - request pending,
  - driver received,
  - bus arriving,
  - request completed,
  - bus passed.

Implementation notes:

- Added a static web demo that opens directly from `index.html`.
- Added a simulated line 117 route segment from Central Station to Maccabim Reut Junction.
- Added a moving bus marker, route progress, ETA, next-stop state, stop timeline, pickup request, drop-off request, reset control, and driver-device light simulation.
- Corrected driver-device behavior so pickup and drop-off lights turn on only when the bus's next stop is the requested stop; earlier received requests stay queued without lighting the driver signal.
- The demo uses local simulated data only and does not require internet, API keys, package installation, or a backend.

Validation:

- `node --check app.js` passed.
- After correcting the driver-light logic, `node --check app.js` passed again.
- `git status --short --branch` showed the active branch as `step-02-simulated-web-demo` with only the intended Step 2 files changed.
- `git diff --stat` showed only the tracked `PLAN.md` update; the new app files are untracked until staged.

## Step 3: Add Real Transit Data

Status: Completed on 2026-08-11

Branch:

- Base branch: main
- Step branch: step-03-real-transit-data

Work:

- Start with public GTFS data for the selected city where available. Done: used Israel Ministry of Transport GTFS from https://gtfs.mot.gov.il/gtfsfiles/.
- Parse GTFS stops, routes, trips, stop times, and shapes. Done: generated `data/line-117.js` from the extracted MOT feed.
- Add GTFS Realtime if the agency provides vehicle positions or trip updates. Deferred to a later step; Step 3 stays static-data focused.
- Evaluate Moovit or Google transit APIs if access, pricing, and licensing are practical. Deferred to later evaluation; Step 3 uses public static GTFS-backed data first.
- Keep simulated fallback data so the demo still works without external API access. Done in code.

Implementation notes:

- Added `data/line-117.js` as the browser-loaded route data source for Kavim line 117 from Modi'in-Maccabim-Reut to Jerusalem.
- Added `scripts/import-gtfs.mjs`, a no-dependency Node.js importer that can read extracted GTFS files and regenerate `data/line-117.js`.
- Added `package.json` commands for syntax checks and GTFS import.
- Updated `index.html` to load route data before `app.js`.
- Updated `app.js` so route metadata, stops, map path, request targets, and ETA duration come from route data when available, with the previous simulated data kept as fallback.
- Added `.gitignore` entries for raw/generated GTFS data and dependencies.
- Selected the correct duplicate route number by preferring route names, headsigns, origins, and destinations that match Modi'in and Jerusalem.
- Generated route data contains 10 stops, agency Kavim, duration 39 minutes, pickup target City Hall, and drop-off target Maccabim Reut Junction.
- Fixed stop/map synchronization by calculating each stop's simulation progress from its nearest position along the GTFS route shape instead of evenly spacing stops by sequence.
- Slowed demo pacing before the requested drop-off stop by mapping the first half of simulation time to the route segment ending at that stop.
- The current background is still a stylized SVG map placeholder; a real street map layer is intentionally deferred to a future frontend/map step.

Validation:

- `npm run check` passed; npm also printed a non-fatal cache-log permission warning.
- `node --check data/line-117.js` passed.
- A route-data shape check passed: route 117, agency Kavim, 10 stops, pickup target City Hall, and drop-off target Maccabim Reut Junction.
- The importer was tested against a temporary GTFS fixture and wrote a valid route file.
- The importer was run against the downloaded/extracted Israel Ministry of Transport GTFS feed and generated `data/line-117.js`.
- A shape-aligned progress check passed: all stop progress values increase monotonically along the route shape.
- A pacing check passed: simulation start maps to progress 0, the midpoint maps to the requested drop-off stop, and the end maps to route progress 1.
- Current project state: Step 3 app remains static and works without a backend; realtime data is still not connected.
- Next unfinished step: Step 4, add request management backend.

## Step 4: Add Request Management Backend

Status: Not started

Work:

- Add backend state for pickup and drop-off requests.
- Match each request to:
  - route,
  - stop,
  - bus,
  - direction,
  - request type.
- Broadcast updates to the rider UI and driver device simulation.
- Track request lifecycle:
  - created,
  - acknowledged,
  - active,
  - completed,
  - expired.

## Step 5: Create ESP32 Hardware Prototype

Status: Not started

Work:

- Build a prototype using:
  - ESP32 board,
  - two LEDs or light modules,
  - GPS module,
  - Wi-Fi or hotspot connectivity,
  - basic enclosure.
- Connect the device to the backend.
- Light the pickup or drop-off indicator based on incoming requests.
- Send basic device status back to the backend:
  - online/offline,
  - GPS position,
  - request acknowledged.

## Step 6: Run Controlled Field Tests

Status: Not started

Work:

- Test the full workflow with simulated bus movement.
- Test the ESP32 device on a desk with backend events.
- Test movement using a car or walking route near selected stops.
- If permission is available, test in a depot or real bus environment.
- Record:
  - request latency,
  - missed requests,
  - false positives,
  - driver understanding,
  - rider confusion points.

## Step 7: Prepare The City And Moovit Pitch

Status: Not started

Work:

- Create a short pitch deck.
- Create a live demo script.
- Lead with city/operator value:
  - accessibility,
  - fewer missed pickups,
  - better low-frequency route service,
  - safer late-night rider experience,
  - low-cost pilot hardware.
- Ask a local city or transit agency for a limited pilot.
- Approach Moovit after the demo, hardware prototype, and local validation exist.

## Planned Interfaces

Simulated route data:

- Stop: id, name, latitude, longitude, sequence.
- Route: id, name, color, shape, stops.
- Bus state: route id, current position, next stop, speed, progress.
- Request state: type, stop id, bus id, status, created time, acknowledged time.

Backend API:

- `POST /requests`: create pickup or drop-off request.
- `GET /routes/:id`: return route and stops.
- `GET /bus/:id/state`: return simulated or live bus state.
- WebSocket or MQTT channel: broadcast request and bus updates.

Hardware protocol:

- Device subscribes to assigned bus id.
- Backend sends pickup and drop-off request events.
- Device reports online status, GPS position, and acknowledgement.

## Test Plan

- Simulated demo works without internet or API keys.
- User can select source and destination stops.
- Bus moves along route and updates next stop.
- Pickup request lights the pickup indicator.
- Drop-off request lights the drop-off indicator.
- Requests complete when the bus arrives.
- Requests expire when the bus passes the stop.
- Real GTFS import maps stops and route shape correctly.
- ESP32 receives backend request events within acceptable latency.
- Pilot script can be run start-to-finish in under five minutes.

## Assumptions

- First serious target is a local city or transit agency, not Moovit directly.
- First deliverable is a shareable web app, not a native mobile app.
- First physical device is an ESP32 prototype, not production hardware.
- Simulated data is acceptable for version 1.
- GTFS and GTFS Realtime are preferred before paid or restricted APIs.
- Moovit should be approached after there is a convincing working demo and early local validation.
