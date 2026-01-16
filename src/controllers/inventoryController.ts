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
      const branchId = req.user?.branchId || req.body.branchId;

      if (!tenantId || !branchId) {
        res.status(400).json({
          message: "Tenant ID and Branch ID are required",
        });
        return;
      }

      if (!productVariantId || !quantity || !costPrice || !sellingPrice) {
        res.status(400).json({
          message:
            "Product variant, quantity, cost price, and selling price are required",
        });
        return;
      }

      const inventory = await inventoryService.stockIn(
        tenantId,
        branchId,
        productVariantId,
        quantity,
        costPrice,
        sellingPrice,
        supplier
      );

      res.status(201).json(inventory);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getByBranch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const branchId = req.user?.branchId || req.params.branchId;

      if (!branchId) {
        res.status(400).json({ message: "Branch ID is required" });
        return;
      }

      const inventory = await inventoryService.getInventoryByBranch(branchId as string);
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

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
      const { branchId, productVariantId } = req.query;

      if (!branchId || !productVariantId) {
        res.status(400).json({
          message: "Branch ID and Product Variant ID are required",
        });
        return;
      }

      const stock = await inventoryService.checkStock(
        branchId as string,
        productVariantId as string
      );

      res.json(stock);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getStockMovements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const branchId = req.user?.branchId || req.query.branchId;
      const productVariantId = req.query.productVariantId as string | undefined;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      if (!branchId) {
        res.status(400).json({ message: "Branch ID is required" });
        return;
      }

      const movements = await inventoryService.getStockMovements(
        branchId as string,
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
      const { branchId, size, category, brand } = req.query;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const status = await inventoryService.getStockStatus(
        tenantId,
        branchId as string | undefined,
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
      const branchId = req.user?.branchId || req.params.branchId;

      if (!branchId) {
        res.status(400).json({ message: "Branch ID is required" });
        return;
      }

      const report = await inventoryService.getLocalStockReport(
        branchId as string
      );

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
