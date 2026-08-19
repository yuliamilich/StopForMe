export function createPhoneView({ elements, helpers, requestLabels, routeData, state }) {
  const stops = routeData.stops;
  const requestTargets = routeData.requestTargets;

  elements.routeTitle.textContent = "StopForMe";
  elements.pickupStop.textContent = helpers.getStopById(requestTargets.pickup).shortName;
  elements.dropoffStop.textContent = helpers.getStopById(requestTargets.dropoff).shortName;
  elements.routePath.setAttribute("d", routeData.mapPath);
  elements.routeProgress.setAttribute("d", routeData.mapPath);

  const routeLength = elements.routePath.getTotalLength();
  elements.routeProgress.style.strokeDasharray = routeLength;

  function renderStops() {
    elements.stopLayer.innerHTML = stops
      .map((stop, index) => {
        const classes = ["stop-pin"];
        if (state.progress >= stop.progress) classes.push("reached");
        if (stop.id === requestTargets.pickup) classes.push("target-pickup");
        if (stop.id === requestTargets.dropoff) classes.push("target-destination");

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

  function renderTripStatus() {
    elements.nextStop.textContent = helpers.getStopById(state.nextStopId).shortName;
    elements.eta.textContent = state.eta;
    elements.busState.textContent = state.busStatus;
  }

  function render() {
    renderBus();
    renderStops();
    renderTimeline();
    renderTripStatus();
  }

  return { render };
}
