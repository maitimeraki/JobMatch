// Vercel serverless entry point
// Exports the Express app — Vercel wraps it as a serverless function via @vercel/node
// This file does NOT start an HTTP server; Vercel handles that.

import app from "../src/app.js";

export default app;
