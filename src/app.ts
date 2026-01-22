import express from "express";
import cors from "cors";
import session from "express-session";
import authRoutes from "./routes/authRoutes";
import tenantRoutes from "./routes/tenantRoutes";
import branchRoutes from "./routes/branchRoutes";
import productRoutes from "./routes/productRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import userRoutes from "./routes/userRoutes";
import systemRoutes from "./routes/systemRoutes";
import publicRoutes from "./routes/publicRoutes";

const app = express();

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, // Allow cookies to be sent
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Backend is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes); // Public routes for registration
app.use("/api/tenants", tenantRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/system", systemRoutes);

// Debug: Log all registered routes (development only)
if (process.env.NODE_ENV === "development") {
  console.log("Registered API routes:");
  console.log("  POST /api/invoices - Create invoice (Branch User only)");
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

export default app;
