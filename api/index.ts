import { AppDataSource } from "../src/config/data-source";

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
  try {
    // Always set CORS headers first
    setCorsHeaders(res);

    // Handle preflight OPTIONS requests immediately without database
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Initialize database for actual requests
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.error("Database init failed:", dbError);
      return res.status(500).json({
        error: "Database connection failed",
        message: dbError instanceof Error ? dbError.message : "Unknown error"
      });
    }

    // Import and use Express app
    const app = (await import("../src/app")).default;

    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
