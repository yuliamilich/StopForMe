export function createSimulationControlsView({ elements, helpers, routeData, state }) {
  function render() {
    elements.pickupButton.disabled = state.pickup !== "none" || helpers.isPastStop(routeData.requestTargets.pickup);
  }

  return { render };
}
