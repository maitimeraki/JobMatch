import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import { env } from "./config/env.js";
import { rateLimiter } from "./middleware/rateLimit.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get(["/api/health", "/api/v1/health"], (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      message: "JobMatch API is running",
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
app.use("/api/v1", routes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
