import { fallbackRouteData } from "./fallback-route-data.js";

export function getRouteData() {
  return window.STOP_FOR_ME_ROUTE || fallbackRouteData;
}
