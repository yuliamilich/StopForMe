import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createAppServer } from "./src/server/http-server.js";

const defaultPort = Number(process.env.PORT || 4173);

export { createAppServer };

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const server = createAppServer();
  server.listen(defaultPort, () => {
    console.log(`StopForMe demo server: http://localhost:${defaultPort}`);
  });
}
