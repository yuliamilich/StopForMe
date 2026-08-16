const fallbackRouteData = {
  route: {
    shortName: "117",
    directionName: "Line 117 to Jerusalem",
    durationMinutes: 38,
  },
  mapPath: "M120 380 C210 286 284 262 354 300 C432 342 480 286 515 228 C553 165 620 151 690 183 C755 213 800 174 824 110",
  requestTargets: {
    pickup: "city-hall",
    dropoff: "maccabim-reut",
  },
  stops: [
    {
      id: "central",
      name: "Modi'in-Maccabim-Reut Central Station",
      shortName: "Central Station",
      x: 120,
      y: 380,
      progress: 0,
    },
    {
      id: "city-hall",
      name: "City Hall",
      shortName: "City Hall",
      x: 260,
      y: 282,
      progress: 0.24,
    },
    {
      id: "dam-hamaccabim",
      name: "Dam HaMaccabim/Hashmonaim Boulevard",
      shortName: "Dam HaMaccabim",
      x: 420,
      y: 330,
      progress: 0.45,
    },
    {
      id: "modiin-east",
      name: "Modi'in East Junction",
      shortName: "Modi'in East",
      x: 560,
      y: 170,
      progress: 0.68,
    },
    {
      id: "maccabim-reut",
      name: "Maccabim Reut Junction",
      shortName: "Maccabim Reut",
      x: 824,
      y: 110,
      progress: 1,
    },
  ],
};

const routeData = window.STOP_FOR_ME_ROUTE || fallbackRouteData;
const stops = routeData.stops;
const requestTargets = routeData.requestTargets;

const requestLabels = {
  none: "No request",
  pending: "Pending",
  received: "Driver received",
  completed: "Completed",
  passed: "Bus passed",
};

const simulationDurationMs = 52000;
const dropoffSegmentTimeShare = 0.5;
const tickMs = 160;
const acknowledgementDelayMs = 1400;
const busId = "demo-bus-117";
let startedAt = Date.now();
let localTimerId;
let backendEvents;
let backendMode = false;

const state = {
  progress: 0,
  pickup: "none",
  dropoff: "none",
  pickupRequestedAt: null,
  dropoffRequestedAt: null,
  previousStopId: stops[0].id,
  nextStopId: stops[0].id,
  eta: "--",
  busStatus: "Approaching",
  pickupLightActive: false,
  dropoffLightActive: false,
  deviceMessage: "No active stop request",
};

const elements = {
  routeTitle: document.querySelector("#routeTitle"),
  serviceMode: document.querySelector("#serviceMode"),
  pickupStop: document.querySelector("#pickupStop"),
  dropoffStop: document.querySelector("#dropoffStop"),
  busMarker: document.querySelector("#busMarker"),
  routePath: document.querySelector("#routePath"),
  routeProgress: document.querySelector("#routeProgress"),
  stopLayer: document.querySelector("#stopLayer"),
  stopTimeline: document.querySelector("#stopTimeline"),
  nextStop: document.querySelector("#nextStop"),
  eta: document.querySelector("#eta"),
  busState: document.querySelector("#busState"),
  pickupButton: document.querySelector("#pickupButton"),
  dropoffButton: document.querySelector("#dropoffButton"),
  resetButton: document.querySelector("#resetButton"),
  pickupLight: document.querySelector("#pickupLight"),
  dropoffLight: document.querySelector("#dropoffLight"),
  pickupStatus: document.querySelector("#pickupStatus"),
  dropoffStatus: document.querySelector("#dropoffStatus"),
  deviceConnection: document.querySelector("#deviceConnection"),
  deviceMessage: document.querySelector("#deviceMessage"),
};

elements.routeTitle.textContent = `Line ${routeData.route.shortName} to ${routeData.route.destinationName || "Jerusalem"}`;
elements.serviceMode.textContent = "Connecting...";
elements.pickupStop.textContent = getStopById(requestTargets.pickup).shortName;
elements.dropoffStop.textContent = getStopById(requestTargets.dropoff).shortName;
elements.routePath.setAttribute("d", routeData.mapPath);
elements.routeProgress.setAttribute("d", routeData.mapPath);

const routeLength = elements.routePath.getTotalLength();
elements.routeProgress.style.strokeDasharray = routeLength;

function getUpcomingStop() {
  return stops.find((stop) => stop.progress > state.progress) || stops[stops.length - 1];
}

function getPreviousStop() {
  return [...stops].reverse().find((stop) => stop.progress <= state.progress) || stops[0];
}

function getStopById(stopId) {
  return stops.find((stop) => stop.id === stopId);
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

function applyServerSnapshot(snapshot) {
  state.progress = snapshot.bus.progress;
  state.pickup = snapshot.requests.pickup.status;
  state.dropoff = snapshot.requests.dropoff.status;
  state.pickupRequestedAt = snapshot.requests.pickup.requestedAt;
  state.dropoffRequestedAt = snapshot.requests.dropoff.requestedAt;
  state.previousStopId = snapshot.bus.previousStopId;
  state.nextStopId = snapshot.bus.nextStopId;
  state.eta = snapshot.bus.eta;
  state.busStatus = snapshot.bus.status;
  state.pickupLightActive = snapshot.driverDevice.pickupLightActive;
  state.dropoffLightActive = snapshot.driverDevice.dropoffLightActive;
  state.deviceMessage = snapshot.driverDevice.message;
  render();
}

async function sendServerRequest(path, body = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Server request failed: ${response.status}`);
  }

  applyServerSnapshot(await response.json());
}

async function connectBackend() {
  if (window.location.protocol === "file:") {
    startLocalSimulation();
    return;
  }

  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error(`State request failed: ${response.status}`);

    backendMode = true;
    window.clearInterval(localTimerId);
    applyServerSnapshot(await response.json());
    elements.serviceMode.textContent = "Backend live";
    elements.deviceConnection.textContent = "Online";

    backendEvents = new EventSource("/api/events");
    backendEvents.addEventListener("state", (event) => {
      applyServerSnapshot(JSON.parse(event.data));
    });
    backendEvents.addEventListener("error", () => {
      elements.serviceMode.textContent = "Server reconnecting";
      elements.deviceConnection.textContent = "Reconnecting";
    });
  } catch {
    backendMode = false;
    startLocalSimulation();
  }
}

async function requestStop(type) {
  if (backendMode) {
    await sendServerRequest("/api/requests", {
      type,
      routeId: routeData.route.id,
      stopId: requestTargets[type],
      busId,
    });
    return;
  }

  const stopId = requestTargets[type];

  if (isPastStop(stopId)) {
    state[type] = "passed";
    render();
    return;
  }

  state[type] = "pending";
  state[`${type}RequestedAt`] = Date.now();
  render();
}

function updateLocalRequestState(type) {
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

function updateLocalDerivedState() {
  const upcomingStop = getUpcomingStop();
  const previousStop = getPreviousStop();
  state.previousStopId = previousStop.id;
  state.nextStopId = upcomingStop.id;
  state.eta = state.progress >= 1 ? "Arrived" : getEtaLabel(upcomingStop);
  state.busStatus = state.progress >= 1 ? "Route complete" : `Between ${previousStop.shortName} and ${upcomingStop.shortName}`;
  state.pickupLightActive = isDriverLightActive("pickup");
  state.dropoffLightActive = isDriverLightActive("dropoff");

  if (state.pickupLightActive) {
    state.deviceMessage = `Pickup request: ${getStopById(requestTargets.pickup).shortName}`;
  } else if (state.dropoffLightActive) {
    state.deviceMessage = `Drop-off request: ${getStopById(requestTargets.dropoff).shortName}`;
  } else if (state.pickup === "pending" || state.dropoff === "pending") {
    state.deviceMessage = "Receiving rider request...";
  } else if (state.pickup === "received") {
    state.deviceMessage = "Pickup request queued";
  } else if (state.dropoff === "received") {
    state.deviceMessage = "Drop-off request queued";
  } else {
    state.deviceMessage = "No active stop request";
  }
}

function updateLocalBusPosition() {
  const elapsedMs = Date.now() - startedAt;
  state.progress = getRouteProgressForElapsedTime(elapsedMs);
  updateLocalRequestState("pickup");
  updateLocalRequestState("dropoff");
  updateLocalDerivedState();
  render();

  if (state.progress >= 1) {
    window.clearInterval(localTimerId);
  }
}

function startLocalSimulation() {
  if (localTimerId) return;

  elements.serviceMode.textContent = routeData.source ? "Local GTFS demo" : "Simulated live";
  elements.deviceConnection.textContent = "Local";
  updateLocalDerivedState();
  localTimerId = window.setInterval(updateLocalBusPosition, tickMs);
  render();
}

async function resetSimulation() {
  if (backendMode) {
    await sendServerRequest("/api/reset");
    return;
  }

  window.clearInterval(localTimerId);
  localTimerId = null;
  startedAt = Date.now();
  state.progress = 0;
  state.pickup = "none";
  state.dropoff = "none";
  state.pickupRequestedAt = null;
  state.dropoffRequestedAt = null;
  startLocalSimulation();
}

function renderStops() {
  elements.stopLayer.innerHTML = stops
    .map((stop, index) => {
      const classes = ["stop-pin"];
      if (state.progress >= stop.progress) classes.push("reached");
      if (stop.id === requestTargets.pickup) classes.push("target-pickup");
      if (stop.id === requestTargets.dropoff) classes.push("target-dropoff");

      const labelY = index === stops.length - 1 ? stop.y + 36 : stop.y - 28;

      return `
        <g class="${classes.join(" ")}" transform="translate(${stop.x} ${stop.y})">
          <circle r="12"></circle>
          <text x="0" y="${labelY - stop.y}" text-anchor="middle">${stop.shortName}</text>
        </g>
      `;
    })
    .join("");
}

function renderTimeline() {
  elements.stopTimeline.innerHTML = stops
    .map((stop, index) => {
      const classes = [];
      if (state.progress >= stop.progress) classes.push("done");
      if (stop.id === state.nextStopId) classes.push("current");

      let chip = "";
      if (stop.id === requestTargets.pickup) {
        chip = `<span class="request-chip pickup">${requestLabels[state.pickup]}</span>`;
      }
      if (stop.id === requestTargets.dropoff) {
        chip = `<span class="request-chip dropoff">${requestLabels[state.dropoff]}</span>`;
      }

      return `
        <li class="${classes.join(" ")}">
          <span class="index">${index + 1}</span>
          <div>
            <strong>${stop.shortName}</strong>
            <span>${stop.name}</span>
          </div>
          ${chip}
        </li>
      `;
    })
    .join("");
}

function renderBus() {
  const point = elements.routePath.getPointAtLength(routeLength * state.progress);
  elements.busMarker.setAttribute("transform", `translate(${point.x} ${point.y})`);
  elements.routeProgress.style.strokeDashoffset = routeLength * (1 - state.progress);
}

function renderDevice() {
  elements.pickupLight.className = `light ${state.pickupLightActive ? "active pickup" : ""}`;
  elements.dropoffLight.className = `light ${state.dropoffLightActive ? "active dropoff" : ""}`;
  elements.pickupStatus.textContent = requestLabels[state.pickup];
  elements.dropoffStatus.textContent = requestLabels[state.dropoff];
  elements.deviceMessage.textContent = state.deviceMessage;
}

function renderControls() {
  elements.pickupButton.disabled = state.pickup !== "none" || isPastStop(requestTargets.pickup);
  elements.dropoffButton.disabled = state.dropoff !== "none" || isPastStop(requestTargets.dropoff);
}

function renderTripStatus() {
  elements.nextStop.textContent = getStopById(state.nextStopId).shortName;
  elements.eta.textContent = state.eta;
  elements.busState.textContent = state.busStatus;
}

function render() {
  renderBus();
  renderStops();
  renderTimeline();
  renderDevice();
  renderControls();
  renderTripStatus();
}

elements.pickupButton.addEventListener("click", () => requestStop("pickup"));
elements.dropoffButton.addEventListener("click", () => requestStop("dropoff"));
elements.resetButton.addEventListener("click", resetSimulation);
window.addEventListener("beforeunload", () => backendEvents?.close());

connectBackend();
