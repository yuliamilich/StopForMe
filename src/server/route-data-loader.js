import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

export function loadRouteData(rootDir) {
  const context = { window: {} };
  const routeScript = readFileSync(join(rootDir, "data", "line-117.js"), "utf8");
  runInNewContext(routeScript, context);
  return context.window.STOP_FOR_ME_ROUTE;
}
