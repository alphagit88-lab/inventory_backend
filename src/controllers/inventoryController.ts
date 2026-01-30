import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { InventoryService } from "../services/inventoryService";

const inventoryService = new InventoryService();

export class InventoryController {
  async stockIn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productVariantId, quantity, costPrice, sellingPrice, supplier } =
        req.body;
      const tenantId = req.user?.tenantId;
      const locationId = req.user?.locationId || req.body.locationId;

      // Super Admin can provide tenantId in body if needed
      const finalTenantId = tenantId || req.body.tenantId;

      if (!finalTenantId) {
        res.status(400).json({
          message: "Tenant ID is required",
        });
        return;
      }

      if (!locationId) {
        res.status(400).json({
          message: "Location ID is required",
        });
        return;
      }

      if (!productVariantId) {
        res.status(400).json({
          message: "Product variant is required",
        });
        return;
      }

      if (!quantity || quantity <= 0) {
        res.status(400).json({
          message: "Valid quantity is required",
        });
        return;
      }

      if (!costPrice || costPrice <= 0) {
        res.status(400).json({
          message: "Valid cost price is required",
        });
        return;
      }

      if (!sellingPrice || sellingPrice <= 0) {
        res.status(400).json({
          message: "Valid selling price is required",
        });
        return;
      }

      const inventory = await inventoryService.stockIn(
        finalTenantId,
        locationId,
        productVariantId,
        quantity,
        costPrice,
        sellingPrice,
        supplier
      );

      res.status(201).json(inventory);
    } catch (error: any) {
      console.error("Stock in error:", error);
      res.status(400).json({ 
        message: error.message || "Failed to add stock. Please check your input and try again." 
      });
    }
  }

  async getByLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const locationId = req.user?.locationId || req.params.locationId;

      if (!locationId) {
        res.status(400).json({ message: "Location ID is required" });
        return;
      }

      const inventory = await inventoryService.getInventoryByLocation(locationId as string);
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Super Admin can provide tenantId in query params, others use from session
      const tenantId = req.user?.role === "super_admin"
        ? (req.query.tenantId as string || req.user?.tenantId)
        : req.user?.tenantId;

      // For super admin without context, return all inventory
      if (req.user?.role === "super_admin" && !tenantId) {
        const inventory = await inventoryService.getAllInventory();
        res.json(inventory);
        return;
      }

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const inventory = await inventoryService.getInventoryByTenant(tenantId);
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async checkStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { locationId, productVariantId } = req.query;

      if (!locationId || !productVariantId) {
        res.status(400).json({
          message: "Location ID and Product Variant ID are required",
        });
        return;
      }

      const stock = await inventoryService.checkStock(
        locationId as string,
        productVariantId as string
      );

      res.json(stock);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getStockMovements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const locationId = req.user?.locationId || req.query.locationId;
      const productVariantId = req.query.productVariantId as string | undefined;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      if (!locationId) {
        res.status(400).json({ message: "Location ID is required" });
        return;
      }

      const movements = await inventoryService.getStockMovements(
        locationId as string,
        productVariantId,
        startDate,
        endDate
      );

      res.json(movements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getStockStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { locationId, size, category, brand } = req.query;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const status = await inventoryService.getStockStatus(
        tenantId,
        locationId as string | undefined,
        size as string | undefined,
        category as string | undefined,
        brand as string | undefined
      );

      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getLocalStockReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const locationId = req.user?.locationId || req.params.locationId;

      if (!locationId) {
        res.status(400).json({ message: "Location ID is required" });
        return;
      }

      const report = await inventoryService.getLocalStockReport(
        locationId as string
      );

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
