import { requestLabels } from "../shared/request-labels.js";
import { createRouteHelpers } from "../shared/route-helpers.js";
import { connectBackend, sendServerRequest } from "./api-client.js";
import { createInitialState } from "./app-state.js";
import { getDomElements } from "./dom-elements.js";
import { createHardwareView } from "./hardware-view.js";
import { createLocalSimulation } from "./local-simulation.js";
import { createPhoneView } from "./phone-view.js";
import { getRouteData } from "./route-data.js";
import { applyServerSnapshotToState } from "./server-snapshot.js";
import { createSimulationControlsView } from "./simulation-controls-view.js";

const busId = "demo-bus-117";

export async function startApp() {
  const routeData = getRouteData();
  const state = createInitialState(routeData);
  const helpers = createRouteHelpers({ routeData, state });
  const elements = getDomElements();

  elements.serviceMode.textContent = "Connecting...";

  const phoneView = createPhoneView({ elements, helpers, requestLabels, routeData, state });
  const hardwareView = createHardwareView({ elements, routeData, state });
  const controlsView = createSimulationControlsView({ elements, helpers, routeData, state });

  function render() {
    phoneView.render();
    hardwareView.render();
    controlsView.render();
  }

  function applySnapshot(snapshot) {
    applyServerSnapshotToState({ snapshot, state });
    render();
  }

  const localSimulation = createLocalSimulation({
    routeData,
    state,
    helpers,
    render,
    setServiceMode: (label) => {
      elements.serviceMode.textContent = label;
    },
  });

  const backend = await connectBackend({
    onSnapshot: applySnapshot,
    onStatusChange: ({ serviceMode, deviceConnection }) => {
      elements.serviceMode.textContent = serviceMode;
      elements.deviceConnection.textContent = deviceConnection;
    },
    startLocalSimulation: localSimulation.start,
  });

  async function requestPickup() {
    if (backend.backendMode) {
      const snapshot = await sendServerRequest("/api/requests", {
        type: "pickup",
        routeId: routeData.route.id,
        stopId: routeData.requestTargets.pickup,
        busId,
      });
      applySnapshot(snapshot);
      return;
    }

    localSimulation.requestStop("pickup");
  }

  async function resetSimulation() {
    if (backend.backendMode) {
      applySnapshot(await sendServerRequest("/api/reset"));
      return;
    }

    localSimulation.reset();
  }

  elements.pickupButton.addEventListener("click", requestPickup);
  elements.resetButton.addEventListener("click", resetSimulation);
  window.addEventListener("beforeunload", () => backend.events?.close());

  render();
}
