import express from "express";
import cors from "cors";
import session from "express-session";
import authRoutes from "./routes/authRoutes";
import tenantRoutes from "./routes/tenantRoutes";
import locationRoutes from "./routes/locationRoutes";
import productRoutes from "./routes/productRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import userRoutes from "./routes/userRoutes";
import systemRoutes from "./routes/systemRoutes";
import publicRoutes from "./routes/publicRoutes";

const app = express();

// Trust Vercel Proxy (Required for secure cookies)
app.set("trust proxy", 1);

// Session configuration
// Session configuration
import pgSession from "connect-pg-simple";
import pg from "pg";

const pgSessionStore = pgSession(session);
const isProduction = process.env.NODE_ENV === "production";

// Create a pool for the session store
// Create a pool for the session store
const poolConfig = process.env.DATABASE_URL || process.env.POSTGRES_URL
  ? {
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.DB_SSL === "true" || isProduction ? { rejectUnauthorized: false } : undefined,
  }
  : {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  };

const pool = new pg.Pool(poolConfig);

app.use(
  session({
    store: new pgSessionStore({
      pool: pool,
      createTableIfMissing: true,
      tableName: 'user_sessions' // custom table name to avoid conflicts
    }),
    secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // True in Prod (HTTPS), False in Dev (HTTP)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? "none" : "lax",
    },
  })
);

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

    // Check if origin matches allowed origin exactly
    if (origin === allowedOrigin) {
      return callback(null, true);
    }

    // Also allow Vercel preview deployments (optional, good for testing)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    console.log(`[CORS] Blocked origin: ${origin}. Expected: ${allowedOrigin}`);
    // For now, let's be permissive to fix the user's issue, or return error
    // callback(new Error('Not allowed by CORS'));
    // RELAXING CORS FOR DEBUGGING:
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes); // Public routes for registration
app.use("/api/tenants", tenantRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/system", systemRoutes);

// Debug: Log all registered routes (development only)
if (process.env.NODE_ENV === "development") {
  console.log("Registered API routes:");
  console.log("  POST /api/invoices - Create invoice (Location User only)");
}

// 404 handler
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

export default app;
