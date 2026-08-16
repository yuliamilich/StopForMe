import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const rootDir = resolve(".");
const defaultPort = Number(process.env.PORT || 4173);
const simulationDurationMs = 52000;
const dropoffSegmentTimeShare = 0.5;
const tickMs = 160;
const acknowledgementDelayMs = 1400;
const busId = "demo-bus-117";

const requestLabels = {
  none: "No request",
  pending: "Pending",
  received: "Driver received",
  completed: "Completed",
  passed: "Bus passed",
};

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function loadRouteData() {
  const context = { window: {} };
  const routeScript = readFileSync(join(rootDir, "data", "line-117.js"), "utf8");
  runInNewContext(routeScript, context);
  return context.window.STOP_FOR_ME_ROUTE;
}

const routeData = loadRouteData();
const stops = routeData.stops;
const requestTargets = routeData.requestTargets;

const state = {
  startedAt: Date.now(),
  progress: 0,
  pickup: "none",
  dropoff: "none",
  pickupRequestedAt: null,
  dropoffRequestedAt: null,
};

const eventClients = new Set();
let simulationTimer;

function getStopById(stopId) {
  return stops.find((stop) => stop.id === stopId);
}

function getUpcomingStop() {
  return stops.find((stop) => stop.progress > state.progress) || stops[stops.length - 1];
}

function getPreviousStop() {
  return [...stops].reverse().find((stop) => stop.progress <= state.progress) || stops[0];
}

function getDropoffStopProgress() {
  return getStopById(requestTargets.dropoff)?.progress || 0.5;
}

function getRouteProgressForElapsedTime(elapsedMs) {
  const timeProgress = Math.min(1, elapsedMs / simulationDurationMs);
  const dropoffProgress = getDropoffStopProgress();

  if (timeProgress <= dropoffSegmentTimeShare) {
    return (timeProgress / dropoffSegmentTimeShare) * dropoffProgress;
  }

  const remainingTimeProgress = (timeProgress - dropoffSegmentTimeShare) / (1 - dropoffSegmentTimeShare);
  return dropoffProgress + remainingTimeProgress * (1 - dropoffProgress);
}

function getEtaLabel(stop) {
  const remainingProgress = Math.max(0, stop.progress - state.progress);
  const durationMinutes = routeData.route.durationMinutes || 38;
  const minutes = Math.max(1, Math.ceil(remainingProgress * durationMinutes));
  return `${minutes} min`;
}

function isPastStop(stopId) {
  return state.progress >= getStopById(stopId).progress;
}

function isNextStop(stopId) {
  return getUpcomingStop().id === stopId;
}

function isDriverLightActive(type) {
  return state[type] === "received" && isNextStop(requestTargets[type]);
}

function createRequest(type) {
  if (!["pickup", "dropoff"].includes(type)) {
    return { ok: false, status: 400, error: "Request type must be pickup or dropoff." };
  }

  if (state[type] !== "none") {
    return { ok: true, status: 200, snapshot: getSnapshot() };
  }

  if (isPastStop(requestTargets[type])) {
    state[type] = "passed";
    broadcast();
    return { ok: true, status: 200, snapshot: getSnapshot() };
  }

  state[type] = "pending";
  state[`${type}RequestedAt`] = Date.now();
  broadcast();
  return { ok: true, status: 201, snapshot: getSnapshot() };
}

function updateRequestState(type) {
  const status = state[type];

  if (status === "none" || status === "completed" || status === "passed") {
    return;
  }

  if (isPastStop(requestTargets[type])) {
    state[type] = status === "received" ? "completed" : "passed";
    return;
  }

  const requestedAt = state[`${type}RequestedAt`];
  if (status === "pending" && requestedAt && Date.now() - requestedAt >= acknowledgementDelayMs) {
    state[type] = "received";
  }
}

function updateBusPosition() {
  const elapsedMs = Date.now() - state.startedAt;
  state.progress = getRouteProgressForElapsedTime(elapsedMs);
  updateRequestState("pickup");
  updateRequestState("dropoff");
}

function resetSimulation() {
  state.startedAt = Date.now();
  state.progress = 0;
  state.pickup = "none";
  state.dropoff = "none";
  state.pickupRequestedAt = null;
  state.dropoffRequestedAt = null;
  startSimulationTimer();
  broadcast();
}

function getSnapshot() {
  const nextStop = getUpcomingStop();
  const previousStop = getPreviousStop();
  const pickupLightActive = isDriverLightActive("pickup");
  const dropoffLightActive = isDriverLightActive("dropoff");

  let deviceMessage = "No active stop request";
  if (pickupLightActive) {
    deviceMessage = `Pickup request: ${getStopById(requestTargets.pickup).shortName}`;
  } else if (dropoffLightActive) {
    deviceMessage = `Drop-off request: ${getStopById(requestTargets.dropoff).shortName}`;
  } else if (state.pickup === "pending" || state.dropoff === "pending") {
    deviceMessage = "Receiving rider request...";
  } else if (state.pickup === "received") {
    deviceMessage = "Pickup request queued";
  } else if (state.dropoff === "received") {
    deviceMessage = "Drop-off request queued";
  }

  return {
    bus: {
      id: busId,
      routeId: routeData.route.id,
      progress: state.progress,
      previousStopId: previousStop.id,
      nextStopId: nextStop.id,
      eta: state.progress >= 1 ? "Arrived" : getEtaLabel(nextStop),
      status: state.progress >= 1 ? "Route complete" : `Between ${previousStop.shortName} and ${nextStop.shortName}`,
    },
    requests: {
      pickup: {
        type: "pickup",
        routeId: routeData.route.id,
        busId,
        stopId: requestTargets.pickup,
        status: state.pickup,
        label: requestLabels[state.pickup],
        requestedAt: state.pickupRequestedAt,
      },
      dropoff: {
        type: "dropoff",
        routeId: routeData.route.id,
        busId,
        stopId: requestTargets.dropoff,
        status: state.dropoff,
        label: requestLabels[state.dropoff],
        requestedAt: state.dropoffRequestedAt,
      },
    },
    driverDevice: {
      online: true,
      pickupLightActive,
      dropoffLightActive,
      message: deviceMessage,
    },
    serverTime: new Date().toISOString(),
  };
}

function broadcast() {
  const payload = `event: state\ndata: ${JSON.stringify(getSnapshot())}\n\n`;

  for (const client of eventClients) {
    client.write(payload);
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let rawBody = "";

  for await (const chunk of request) {
    rawBody += chunk;
  }

  return rawBody ? JSON.parse(rawBody) : {};
}

function sendNotFound(response) {
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");
  const pathname = requestUrl.pathname === "/" ? "/index.html" : decodeURIComponent(requestUrl.pathname);
  const filePath = resolve(rootDir, `.${pathname}`);

  if (!filePath.startsWith(rootDir) || !existsSync(filePath)) {
    sendNotFound(response);
    return;
  }

  const contentType = contentTypes[extname(filePath)] || "application/octet-stream";
  const content = await readFile(filePath);
  response.writeHead(200, { "content-type": contentType });
  response.end(content);
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");

  try {
    if (request.method === "GET" && requestUrl.pathname === "/api/state") {
      sendJson(response, 200, getSnapshot());
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/events") {
      response.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      eventClients.add(response);
      response.write(`event: state\ndata: ${JSON.stringify(getSnapshot())}\n\n`);
      request.on("close", () => eventClients.delete(response));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/requests") {
      const body = await readJsonBody(request);
      const result = createRequest(body.type);
      sendJson(response, result.status, result.ok ? result.snapshot : { error: result.error });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/reset") {
      resetSimulation();
      sendJson(response, 200, getSnapshot());
      return;
    }

    if (request.method === "GET") {
      await serveStatic(request, response);
      return;
    }

    sendNotFound(response);
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

export function createAppServer() {
  const server = createServer(handleRequest);
  startSimulationTimer();

  server.on("close", () => {
    stopSimulationTimer();
    eventClients.clear();
  });

  return server;
}

function startSimulationTimer() {
  if (simulationTimer) return;

  simulationTimer = setInterval(() => {
    updateBusPosition();
    broadcast();

    if (state.progress >= 1) {
      stopSimulationTimer();
    }
  }, tickMs);
}

function stopSimulationTimer() {
  clearInterval(simulationTimer);
  simulationTimer = null;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const server = createAppServer();
  server.listen(defaultPort, () => {
    console.log(`StopForMe demo server: http://localhost:${defaultPort}`);
  });
}
