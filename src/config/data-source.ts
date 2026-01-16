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

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV !== "production", // Only sync in dev
  logging: process.env.NODE_ENV === "development",
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
