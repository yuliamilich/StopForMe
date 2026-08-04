# Agent Working Agreement

## Default Mode: Planning

- When the user asks for planning, architecture, debugging strategy, or code understanding, do not create, edit, delete, rename, or format files.
- Read and inspect files as needed, then explain findings in clear steps.
- Think with the user by stating assumptions, tradeoffs, risks, and alternative approaches.
- End planning responses with a proposed step-by-step implementation plan.
- Wait for an explicit instruction such as "implement", "edit", "apply this", or "make the change" before modifying files.

## Editing Mode

- Work one task at a time.
- Before editing each task, explain:
  - which file will change,
  - what the code currently does,
  - what change will be made,
  - why that change is needed.
- After each task, summarize the exact change and pause before starting the next task unless the user already approved the full sequence.
- Keep edits small and focused.
- Do not refactor unrelated code.
- Do not create new files unless they are necessary and explained first.

## Teaching Style

- Explain code in beginner-friendly steps without skipping important details.
- Define unfamiliar terms when they first appear.
- Prefer concrete examples from the actual codebase.
- When there are multiple valid approaches, compare them briefly.

# Project Overview

This project is a demo integration concept for the Moovit app. The demo should show how a rider can request that a bus stop for them at a selected station, including both the source stop where the rider boards and the destination stop where the rider exits.

The experience should look and feel similar to Moovit. It should simulate real buses, real stops, and route planning. Route planning may use an API from Moovit, Google, or another transit route-planning provider, depending on availability, cost, licensing, and technical fit.

## Core Demo Goals

- Let a user choose a source stop and destination stop.
- Plan a realistic bus route between those stops.
- Simulate a live bus approaching stops along that route.
- Allow the rider to request that the bus stop at the next relevant station.
- Show the request state clearly in the demo UI.
- Simulate what the bus driver sees through the custom hardware device.

## Driver Hardware Concept

The bus driver will have a custom hardware device that indicates stop requests. The device should include:

- Two lights for different request types.
- GPS support, so the device can understand the bus location or receive location-aware stop requests.
- Wi-Fi or hotspot connectivity, so the device can receive requests from the app or backend service.

The two lights should represent distinct kinds of requests, such as:

- A pickup request from a rider waiting at the next stop.
- A drop-off request from a rider already on the bus who wants to exit at the next stop.

## Expected System Components

- A rider-facing demo UI that resembles Moovit.
- A route-planning layer using Moovit, Google, or another transit API.
- A bus simulation layer that moves buses along realistic routes and stops.
- A request-management layer that tracks pickup and drop-off requests.
- A driver-device simulation that shows how the physical hardware lights would behave.
- Optional backend services for live request state, GPS updates, and hardware communication.

## Important Product Assumptions

- This is a demo, so the first version can simulate buses and hardware behavior instead of connecting to real buses.
- Real route planning should be used where possible, but mocked route data is acceptable if API access is blocked, expensive, or unavailable.
- The UI should prioritize a believable transit experience over a generic prototype.
- Hardware communication can start as a simulated interface before being connected to a real device.

## Design Direction

- The demo should feel like a transit navigation app, not a marketing landing page.
- The main screen should focus on map, route, stops, bus movement, and request controls.
- Visual states should make it clear when:
  - no request has been made,
  - a pickup request is pending,
  - a drop-off request is pending,
  - the driver hardware has received the request,
  - the bus has arrived or passed the stop.

