export async function sendServerRequest(path, body = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Server request failed: ${response.status}`);
  }

  return response.json();
}

export async function connectBackend({ onSnapshot, onStatusChange, startLocalSimulation }) {
  if (window.location.protocol === "file:") {
    startLocalSimulation();
    return { backendMode: false, events: null };
  }

  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error(`State request failed: ${response.status}`);

    onSnapshot(await response.json());
    onStatusChange({ serviceMode: "Backend live", deviceConnection: "Online" });

    const events = new EventSource("/api/events");
    events.addEventListener("state", (event) => {
      onSnapshot(JSON.parse(event.data));
    });
    events.addEventListener("error", () => {
      onStatusChange({ serviceMode: "Server reconnecting", deviceConnection: "Reconnecting" });
    });

    return { backendMode: true, events };
  } catch {
    startLocalSimulation();
    return { backendMode: false, events: null };
  }
}
