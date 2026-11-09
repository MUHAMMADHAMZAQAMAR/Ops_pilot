import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { requestsRouter } from "./routes/requests.js";
import { approvalsRouter } from "./routes/approvals.js";
import { agentRouter } from "./routes/agent.js";
import { auditRouter } from "./routes/audit.js";
import { toolsRouter } from "./routes/tools.js";

const app = express();

// Security headers
app.use(helmet());

// CORS configuration (no hardcoded origin)
app.use(
  cors({
    origin: env.CORS_ORIGIN.includes(",")
      ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "zero-trust-ai-backend",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes (v1)
app.use("/api/v1/requests", requestsRouter);
app.use("/api/v1/approvals", approvalsRouter);
app.use("/api/v1/agent", agentRouter);
app.use("/api/v1/audit", auditRouter);
app.use("/api/v1/tools", toolsRouter);

// Centralized error handling
app.use(errorHandler);

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`🛡️  Zero-Trust AI Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`🔒 Allowed CORS Origin: ${env.CORS_ORIGIN}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    process.exit(0);
  });
});

export default app;

