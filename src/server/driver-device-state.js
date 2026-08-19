export function getDriverDeviceState({ helpers, requestTargets, state }) {
  const requestLightActive = state.pickup === "received" && helpers.isNextStop(requestTargets.pickup);

  let message = "No pickup request";
  if (requestLightActive) {
    message = `Pickup request: ${helpers.getStopById(requestTargets.pickup).shortName}`;
  } else if (state.pickup === "pending") {
    message = "Receiving pickup request...";
  } else if (state.pickup === "received") {
    message = "Pickup request queued";
  }

  return {
    online: true,
    requestLightActive,
    statusLight: "online",
    requestType: requestLightActive ? "pickup" : null,
    requestStopId: requestLightActive ? requestTargets.pickup : null,
    message,
  };
}
