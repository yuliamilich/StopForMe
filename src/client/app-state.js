export function createInitialState(routeData) {
  return {
    progress: 0,
    pickup: "none",
    dropoff: "none",
    pickupRequestedAt: null,
    dropoffRequestedAt: null,
    previousStopId: routeData.stops[0].id,
    nextStopId: routeData.stops[0].id,
    eta: "--",
    busStatus: "Approaching",
    requestLightActive: false,
    deviceOnline: true,
    deviceMessage: "No pickup request",
  };
}
