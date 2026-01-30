// IMPORTANT: reflect-metadata must be imported first for TypeORM
import "reflect-metadata";

import { AppDataSource } from "../src/config/data-source";
import app from "../src/app";

// Initialize database connection (singleton pattern for serverless)
let dbInitialized = false;

async function initializeDatabase() {
  if (!dbInitialized && !AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log("✅ Database connected successfully");
      dbInitialized = true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  } else if (AppDataSource.isInitialized) {
    dbInitialized = true;
  }
}

// Get the allowed origin (specific URL, not wildcard)
function getAllowedOrigin(origin: string | undefined): string {
  const allowedOrigins = [
    "https://inventory-frontend-tau-six.vercel.app",
    "http://localhost:3000"
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  // For Vercel preview deployments
  if (origin && origin.endsWith('.vercel.app')) {
    return origin;
  }
  // Default to the production frontend
  return "https://inventory-frontend-tau-six.vercel.app";
}

// CORS headers helper - MUST use specific origin, not * when credentials are used
function setCorsHeaders(req: any, res: any) {
  const origin = req.headers.origin || req.headers.Origin;
  res.setHeader("Access-Control-Allow-Origin", getAllowedOrigin(origin));
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    // Always set CORS headers first
    setCorsHeaders(req, res);

    // Handle preflight OPTIONS requests immediately without database
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Initialize database for actual requests
    await initializeDatabase();

    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    setCorsHeaders(req, res);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
