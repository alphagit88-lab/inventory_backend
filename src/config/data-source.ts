import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Tenant } from "../entities/Tenant";
import { Branch } from "../entities/Branch";
import { User } from "../entities/User";
import { Product } from "../entities/Product";
import { ProductVariant } from "../entities/ProductVariant";
import { Inventory } from "../entities/Inventory";
import { Invoice } from "../entities/Invoice";
import { InvoiceItem } from "../entities/InvoiceItem";
import { StockMovement } from "../entities/StockMovement";

dotenv.config();

// Support both DATABASE_URL (common in cloud platforms) and individual variables
const getDbConfig = () => {
  // If DATABASE_URL is provided (Railway, Render, Vercel Postgres, etc.)
  // Support both DATABASE_URL (generic) and POSTGRES_URL (Vercel specific)
  const connectionUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionUrl) {
    try {
      const url = new URL(connectionUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading /
      };
    } catch (error) {
      console.error("Error parsing DATABASE_URL:", error);
      // Fall back to individual variables
    }
  }

  // Use individual environment variables
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "inventory_db",
  };
};

const dbConfig = getDbConfig();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  synchronize: process.env.DB_SYNC === "true" || process.env.NODE_ENV !== "production", // DB_SYNC=true for initial setup
  logging: process.env.NODE_ENV === "development",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, // Only enable SSL if DB_SSL=true
  entities: [
    Tenant,
    Branch,
    User,
    Product,
    ProductVariant,
    Inventory,
    Invoice,
    InvoiceItem,
    StockMovement,
  ],
});
