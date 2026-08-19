export function applyServerSnapshotToState({ snapshot, state }) {
  const driverDevice = snapshot.driverDevice || {};

  state.progress = snapshot.bus.progress;
  state.pickup = snapshot.requests.pickup.status;
  state.dropoff = snapshot.requests.dropoff.status;
  state.pickupRequestedAt = snapshot.requests.pickup.requestedAt;
  state.dropoffRequestedAt = snapshot.requests.dropoff.requestedAt;
  state.previousStopId = snapshot.bus.previousStopId;
  state.nextStopId = snapshot.bus.nextStopId;
  state.eta = snapshot.bus.eta;
  state.busStatus = snapshot.bus.status;
  state.requestLightActive = Boolean(driverDevice.requestLightActive ?? driverDevice.pickupLightActive);
  state.deviceOnline = driverDevice.online !== false;
  state.deviceMessage = driverDevice.message || "No pickup request";
}
