import { createServer } from "node:http";
import { resolve } from "node:path";
import { createSimulationState } from "./simulation-state.js";
import { loadRouteData } from "./route-data-loader.js";
import { sendJson, sendNotFound, serveStatic } from "./static-file-server.js";

const tickMs = 160;

async function readJsonBody(request) {
  let rawBody = "";

  for await (const chunk of request) {
    rawBody += chunk;
  }

  return rawBody ? JSON.parse(rawBody) : {};
}

export function createAppServer({ rootDir = resolve(".") } = {}) {
  const routeData = loadRouteData(rootDir);
  const simulation = createSimulationState(routeData);
  const eventClients = new Set();
  let simulationTimer;

  function broadcast() {
    const payload = `event: state\ndata: ${JSON.stringify(simulation.getSnapshot())}\n\n`;

    for (const client of eventClients) {
      client.write(payload);
    }
  }

  function startSimulationTimer() {
    if (simulationTimer) return;

    simulationTimer = setInterval(() => {
      simulation.updateBusPosition();
      broadcast();

      if (simulation.state.progress >= 1) {
        stopSimulationTimer();
      }
    }, tickMs);
  }

  function stopSimulationTimer() {
    clearInterval(simulationTimer);
    simulationTimer = null;
  }

  async function handleRequest(request, response) {
    const requestUrl = new URL(request.url, "http://localhost");

    try {
      if (request.method === "GET" && requestUrl.pathname === "/api/state") {
        sendJson(response, 200, simulation.getSnapshot());
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/api/events") {
        response.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-store",
          connection: "keep-alive",
        });
        eventClients.add(response);
        response.write(`event: state\ndata: ${JSON.stringify(simulation.getSnapshot())}\n\n`);
        request.on("close", () => eventClients.delete(response));
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === "/api/requests") {
        const body = await readJsonBody(request);
        const result = simulation.createRequest(body.type);
        if (result.ok) broadcast();
        sendJson(response, result.status, result.ok ? result.snapshot : { error: result.error });
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === "/api/reset") {
        simulation.resetSimulation();
        startSimulationTimer();
        broadcast();
        sendJson(response, 200, simulation.getSnapshot());
        return;
      }

      if (request.method === "GET") {
        await serveStatic({ request, response, rootDir });
        return;
      }

      sendNotFound(response);
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  }

  const server = createServer(handleRequest);
  startSimulationTimer();

  server.on("close", () => {
    stopSimulationTimer();
    eventClients.clear();
  });

  return server;
}
