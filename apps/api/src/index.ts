/**
 * SiteGrade API - Hono.js on Node.js
 * Architecture: Hono routing, Prisma DB, BullMQ job dispatch, Upstash Redis
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  credentials: true,
}));
app.use("*", prettyJSON());

app.get("/health", (c) => c.json({
  status: "ok",
  service: "sitegarde-api",
  version: "0.1.0",
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV ?? "development",
}));

// Route stubs - implemented in Milestone 3
// app.route("/api/v1/audits", auditRoutes);
// app.route("/api/v1/auth", authRoutes);
// app.route("/api/v1/reports", reportRoutes);

app.get("/api/v1", (c) => c.json({
  message: "SiteGrade API v1",
  docs: "https://docs.sitegarde.com/api",
  endpoints: { audits: "/api/v1/audits", auth: "/api/v1/auth", reports: "/api/v1/reports" },
}));

app.notFound((c) => c.json({ error: "Not found", path: c.req.path }, 404));

app.onError((err, c) => {
  console.error(`[API Error] ${err.message}`);
  return c.json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  }, 500);
});

const PORT = parseInt(process.env.PORT ?? "3001", 10);
serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.info(`SiteGrade API running on http://localhost:${info.port}`);
  console.info(`Environment: ${process.env.NODE_ENV ?? "development"}`);
});

export default app;
