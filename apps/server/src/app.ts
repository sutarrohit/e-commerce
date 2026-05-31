import createApp from "./lib/create-app.js";
import { configureOpenAPI } from "./lib/configure-open-api.js";

import type { Context } from "hono";
import type { AppBinding } from "./lib/types.js";

const app = createApp();
configureOpenAPI(app);

app.get("/health", (c: Context<AppBinding>) => {
  return c.json({
    status: "ok"
  });
});

export type AppType = typeof app;
export default app;
