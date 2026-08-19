export function createRouteHelpers({
  routeData,
  state,
  simulationDurationMs = 52000,
  destinationSegmentTimeShare = 0.5,
}) {
  const stops = routeData.stops;
  const requestTargets = routeData.requestTargets;

  function getStopById(stopId) {
    return stops.find((stop) => stop.id === stopId);
  }

  function getUpcomingStop() {
    return stops.find((stop) => stop.progress > state.progress) || stops[stops.length - 1];
  }

  function getPreviousStop() {
    return [...stops].reverse().find((stop) => stop.progress <= state.progress) || stops[0];
  }

  function getDestinationStopProgress() {
    return getStopById(requestTargets.dropoff)?.progress || 0.5;
  }

  function getRouteProgressForElapsedTime(elapsedMs) {
    const timeProgress = Math.min(1, elapsedMs / simulationDurationMs);
    const destinationProgress = getDestinationStopProgress();

    if (timeProgress <= destinationSegmentTimeShare) {
      return (timeProgress / destinationSegmentTimeShare) * destinationProgress;
    }

    const remainingTimeProgress = (timeProgress - destinationSegmentTimeShare) / (1 - destinationSegmentTimeShare);
    return destinationProgress + remainingTimeProgress * (1 - destinationProgress);
  }

  function getEtaLabel(stop) {
    const remainingProgress = Math.max(0, stop.progress - state.progress);
    const durationMinutes = routeData.route.durationMinutes || 38;
    const minutes = Math.max(1, Math.ceil(remainingProgress * durationMinutes));
    return `${minutes} min`;
  }

  function isPastStop(stopId) {
    return state.progress >= getStopById(stopId).progress;
  }

  function isNextStop(stopId) {
    return getUpcomingStop().id === stopId;
  }

  return {
    getStopById,
    getUpcomingStop,
    getPreviousStop,
    getRouteProgressForElapsedTime,
    getEtaLabel,
    isPastStop,
    isNextStop,
  };
}
