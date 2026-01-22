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

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  // Initialize database on first request
  // In production, consider using connection pooling or keeping connection alive
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

