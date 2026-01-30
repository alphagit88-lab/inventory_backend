import app from "../src/app";
import { AppDataSource } from "../src/config/data-source";

// Initialize database connection (singleton pattern for serverless)
let dbInitialized = false;

async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      await AppDataSource.initialize();
      console.log("✅ Database connected successfully");
      dbInitialized = true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }
}

// CORS headers helper
function setCorsHeaders(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  // Always set CORS headers first
  setCorsHeaders(res);

  // Handle preflight OPTIONS requests immediately without database
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Initialize database for actual requests
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return res.status(500).json({
      error: "Database connection failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }

  // Handle the request with Express app
  return app(req, res);
}
