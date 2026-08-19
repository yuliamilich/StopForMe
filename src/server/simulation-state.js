import { requestLabels } from "../shared/request-labels.js";
import { createRouteHelpers } from "../shared/route-helpers.js";
import { getDriverDeviceState } from "./driver-device-state.js";

const acknowledgementDelayMs = 1400;
const busId = "demo-bus-117";

export function createSimulationState(routeData) {
  const requestTargets = routeData.requestTargets;
  const state = {
    startedAt: Date.now(),
    progress: 0,
    pickup: "none",
    dropoff: "none",
    pickupRequestedAt: null,
    dropoffRequestedAt: null,
  };
  const helpers = createRouteHelpers({ routeData, state });

  function createRequest(type) {
    if (!["pickup", "dropoff"].includes(type)) {
      return { ok: false, status: 400, error: "Request type must be pickup or dropoff." };
    }

    if (state[type] !== "none") {
      return { ok: true, status: 200, snapshot: getSnapshot() };
    }

    if (helpers.isPastStop(requestTargets[type])) {
      state[type] = "passed";
      return { ok: true, status: 200, snapshot: getSnapshot() };
    }

    state[type] = "pending";
    state[`${type}RequestedAt`] = Date.now();
    return { ok: true, status: 201, snapshot: getSnapshot() };
  }

  function updateRequestState(type) {
    const status = state[type];

    if (status === "none" || status === "completed" || status === "passed") {
      return;
    }

    if (helpers.isPastStop(requestTargets[type])) {
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
    state.progress = helpers.getRouteProgressForElapsedTime(elapsedMs);
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
  }

  function getSnapshot() {
    const nextStop = helpers.getUpcomingStop();
    const previousStop = helpers.getPreviousStop();

    return {
      bus: {
        id: busId,
        routeId: routeData.route.id,
        progress: state.progress,
        previousStopId: previousStop.id,
        nextStopId: nextStop.id,
        eta: state.progress >= 1 ? "Arrived" : helpers.getEtaLabel(nextStop),
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
      driverDevice: getDriverDeviceState({ helpers, requestTargets, state }),
      serverTime: new Date().toISOString(),
    };
  }

  return {
    createRequest,
    getSnapshot,
    resetSimulation,
    state,
    updateBusPosition,
  };
}
