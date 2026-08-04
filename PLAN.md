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

Status: Not started

Work:

- Create a Moovit-like rider screen focused on map, route, stops, bus movement, and request controls.
- Use simulated data for:
  - route shape,
  - stop list,
  - bus position,
  - ETA,
  - pickup request state,
  - drop-off request state.
- Add a driver-device simulation panel with two lights:
  - pickup request,
  - drop-off request.
- Show clear state changes:
  - no request,
  - request pending,
  - driver received,
  - bus arriving,
  - request completed,
  - bus passed.

## Step 3: Add Real Transit Data

Status: Not started

Work:

- Start with public GTFS data for the selected city where available.
- Parse GTFS stops, routes, trips, stop times, and shapes.
- Add GTFS Realtime if the agency provides vehicle positions or trip updates.
- Evaluate Moovit or Google transit APIs if access, pricing, and licensing are practical.
- Keep simulated fallback data so the demo still works without external API access.

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
