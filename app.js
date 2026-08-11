const stops = [
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
];

const requestTargets = {
  pickup: "city-hall",
  dropoff: "maccabim-reut",
};

const requestLabels = {
  none: "No request",
  pending: "Pending",
  received: "Driver received",
  completed: "Completed",
  passed: "Bus passed",
};

const simulationDurationMs = 52000;
const tickMs = 160;
const acknowledgementDelayMs = 1400;
let startedAt = Date.now();
let timerId;

const state = {
  progress: 0,
  pickup: "none",
  dropoff: "none",
  pickupRequestedAt: null,
  dropoffRequestedAt: null,
};

const elements = {
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
  deviceMessage: document.querySelector("#deviceMessage"),
};

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

function getEtaLabel(stop) {
  const remainingProgress = Math.max(0, stop.progress - state.progress);
  const remainingMs = remainingProgress * simulationDurationMs;
  const minutes = Math.max(1, Math.ceil(remainingMs / 1000 / 8));
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

function requestStop(type) {
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
  const elapsedMs = Date.now() - startedAt;
  state.progress = Math.min(1, elapsedMs / simulationDurationMs);

  updateRequestState("pickup");
  updateRequestState("dropoff");
  render();

  if (state.progress >= 1) {
    window.clearInterval(timerId);
  }
}

function resetSimulation() {
  window.clearInterval(timerId);
  startedAt = Date.now();
  state.progress = 0;
  state.pickup = "none";
  state.dropoff = "none";
  state.pickupRequestedAt = null;
  state.dropoffRequestedAt = null;
  timerId = window.setInterval(updateBusPosition, tickMs);
  render();
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
  const upcomingStop = getUpcomingStop();

  elements.stopTimeline.innerHTML = stops
    .map((stop, index) => {
      const classes = [];
      if (state.progress >= stop.progress) classes.push("done");
      if (stop.id === upcomingStop.id) classes.push("current");

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
  const pickupLightActive = isDriverLightActive("pickup");
  const dropoffLightActive = isDriverLightActive("dropoff");

  elements.pickupLight.className = `light ${pickupLightActive ? "active pickup" : ""}`;
  elements.dropoffLight.className = `light ${dropoffLightActive ? "active dropoff" : ""}`;
  elements.pickupStatus.textContent = requestLabels[state.pickup];
  elements.dropoffStatus.textContent = requestLabels[state.dropoff];

  if (pickupLightActive) {
    elements.deviceMessage.textContent = "Pickup request: City Hall";
  } else if (dropoffLightActive) {
    elements.deviceMessage.textContent = "Drop-off request: Maccabim Reut Junction";
  } else if (state.pickup === "pending" || state.dropoff === "pending") {
    elements.deviceMessage.textContent = "Receiving rider request...";
  } else if (state.pickup === "received") {
    elements.deviceMessage.textContent = "Pickup request queued";
  } else if (state.dropoff === "received") {
    elements.deviceMessage.textContent = "Drop-off request queued";
  } else {
    elements.deviceMessage.textContent = "No active stop request";
  }
}

function renderControls() {
  elements.pickupButton.disabled = state.pickup !== "none" || isPastStop(requestTargets.pickup);
  elements.dropoffButton.disabled = state.dropoff !== "none" || isPastStop(requestTargets.dropoff);
}

function renderTripStatus() {
  const upcomingStop = getUpcomingStop();
  const previousStop = getPreviousStop();
  elements.nextStop.textContent = upcomingStop.shortName;
  elements.eta.textContent = state.progress >= 1 ? "Arrived" : getEtaLabel(upcomingStop);
  elements.busState.textContent =
    state.progress >= 1 ? "Route complete" : `Between ${previousStop.shortName} and ${upcomingStop.shortName}`;
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

timerId = window.setInterval(updateBusPosition, tickMs);
render();
