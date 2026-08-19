const tickMs = 160;
const acknowledgementDelayMs = 1400;

export function createLocalSimulation({ routeData, state, helpers, render, setServiceMode }) {
  let startedAt = Date.now();
  let timerId;

  function isPickupRequestLightActive() {
    return state.pickup === "received" && helpers.isNextStop(routeData.requestTargets.pickup);
  }

  function updateRequestState(type) {
    const status = state[type];

    if (status === "none" || status === "completed" || status === "passed") {
      return;
    }

    if (helpers.isPastStop(routeData.requestTargets[type])) {
      state[type] = status === "received" ? "completed" : "passed";
      return;
    }

    const requestedAt = state[`${type}RequestedAt`];
    if (status === "pending" && requestedAt && Date.now() - requestedAt >= acknowledgementDelayMs) {
      state[type] = "received";
    }
  }

  function updateDerivedState() {
    const upcomingStop = helpers.getUpcomingStop();
    const previousStop = helpers.getPreviousStop();
    state.previousStopId = previousStop.id;
    state.nextStopId = upcomingStop.id;
    state.eta = state.progress >= 1 ? "Arrived" : helpers.getEtaLabel(upcomingStop);
    state.busStatus = state.progress >= 1 ? "Route complete" : `Between ${previousStop.shortName} and ${upcomingStop.shortName}`;
    state.requestLightActive = isPickupRequestLightActive();

    if (state.requestLightActive) {
      state.deviceMessage = `Pickup request: ${helpers.getStopById(routeData.requestTargets.pickup).shortName}`;
    } else if (state.pickup === "pending") {
      state.deviceMessage = "Receiving pickup request...";
    } else if (state.pickup === "received") {
      state.deviceMessage = "Pickup request queued";
    } else {
      state.deviceMessage = "No pickup request";
    }
  }

  function updateBusPosition() {
    const elapsedMs = Date.now() - startedAt;
    state.progress = helpers.getRouteProgressForElapsedTime(elapsedMs);
    updateRequestState("pickup");
    updateRequestState("dropoff");
    updateDerivedState();
    render();

    if (state.progress >= 1) {
      window.clearInterval(timerId);
    }
  }

  function start() {
    if (timerId) return;

    setServiceMode(routeData.source ? "Local GTFS demo" : "Simulated live");
    state.deviceOnline = true;
    updateDerivedState();
    timerId = window.setInterval(updateBusPosition, tickMs);
    render();
  }

  function reset() {
    window.clearInterval(timerId);
    timerId = null;
    startedAt = Date.now();
    state.progress = 0;
    state.pickup = "none";
    state.dropoff = "none";
    state.pickupRequestedAt = null;
    state.dropoffRequestedAt = null;
    start();
  }

  function requestStop(type) {
    const stopId = routeData.requestTargets[type];

    if (helpers.isPastStop(stopId)) {
      state[type] = "passed";
      render();
      return;
    }

    state[type] = "pending";
    state[`${type}RequestedAt`] = Date.now();
    render();
  }

  return { requestStop, reset, start };
}
