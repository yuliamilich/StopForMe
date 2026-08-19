export function createHardwareView({ elements, routeData, state }) {
  elements.deviceBusNumber.textContent = routeData.route.shortName;

  function render() {
    elements.requestLight.className = `light ${state.requestLightActive ? "active request" : ""}`;
    elements.requestLightStatus.textContent = state.requestLightActive ? "Pickup" : "Off";
    elements.statusLight.className = `light active ${state.deviceOnline ? "status-online" : "status-offline"}`;
    elements.statusLightStatus.textContent = state.deviceOnline ? "Online" : "Offline";
    elements.deviceRequestLabel.textContent = state.requestLightActive ? "Pickup" : "Standby";
    elements.deviceConnection.textContent = state.deviceOnline ? "Online" : "Offline";
    elements.deviceMessage.textContent = state.deviceMessage;
    elements.hardwareRouteBadge.hidden = !state.requestLightActive;
  }

  return { render };
}
