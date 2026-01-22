import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { InvoiceService } from "../services/invoiceService";
import { AppDataSource } from "../config/data-source";
import { Branch } from "../entities/Branch";

const invoiceService = new InvoiceService();

export class InvoiceController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { items, taxAmount, changeAmount } = req.body;
      let tenantId = req.user?.tenantId;
      const branchId = req.user?.branchId || req.body.branchId;

      // Validate branchId - Branch Users must have a branch assigned
      if (!branchId) {
        res.status(400).json({ 
          message: "Branch ID is required. Please contact your administrator to assign you to a branch." 
        });
        return;
      }

      // If tenantId is not available from user, get it from the branch
      if (!tenantId && branchId) {
        const branchRepository = AppDataSource.getRepository(Branch);
        const branch = await branchRepository.findOne({
          where: { id: branchId },
          relations: ["tenant"],
        });
        
        if (branch && branch.tenant) {
          tenantId = branch.tenant.id;
        } else if (!branch) {
          res.status(400).json({ 
            message: "Invalid branch ID: Branch not found" 
          });
          return;
        }
      }

      // Validate tenantId
      if (!tenantId) {
        res.status(400).json({ 
          message: "Tenant ID is required. Please ensure your account is properly configured." 
        });
        return;
      }

      // Validate items
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: "Items array is required and must not be empty" });
        return;
      }

      // Validate each item in the array
      for (const item of items) {
        if (!item.productVariantId) {
          res.status(400).json({ 
            message: "Each item must have a productVariantId" 
          });
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          res.status(400).json({ 
            message: "Each item must have a valid quantity greater than 0" 
          });
          return;
        }
      }

      // For Branch Users, ensure they can only create invoices for their own branch
      if (req.user?.role === "branch_user" && req.user?.branchId !== branchId) {
        res.status(403).json({ 
          message: "Access denied: You can only create invoices for your assigned branch." 
        });
        return;
      }

      const invoice = await invoiceService.createInvoice(
        tenantId,
        branchId,
        items,
        taxAmount,
        changeAmount
      );

      res.status(201).json(invoice);
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      const statusCode = error.message?.includes('not found') || error.message?.includes('Invalid') ? 404 : 400;
      res.status(statusCode).json({ 
        message: error.message || 'Failed to create invoice. Please check your input and try again.' 
      });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoiceById(id as string);
      res.json(invoice);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async getByBranch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const branchId = req.user?.branchId || req.params.branchId;

      if (!branchId) {
        res.status(400).json({ message: "Branch ID is required" });
        return;
      }

      const invoices = await invoiceService.getInvoicesByBranch(branchId as string);
      res.json(invoices);
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

      const invoices = await invoiceService.getInvoicesByTenant(tenantId);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByDateRange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const branchId = req.user?.branchId || req.query.branchId;

      if (!branchId || !startDate || !endDate) {
        res.status(400).json({
          message: "Branch ID, start date, and end date are required",
        });
        return;
      }

      const invoices = await invoiceService.getInvoicesByDateRange(
        branchId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async calculateProfit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const branchId = req.user?.branchId || req.query.branchId;

      if (!branchId || !startDate || !endDate) {
        res.status(400).json({
          message: "Branch ID, start date, and end date are required",
        });
        return;
      }

      const profit = await invoiceService.calculateProfit(
        branchId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json(profit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getDailySales(req: AuthRequest, res: Response): Promise<void> {
    try {
      const branchId = req.user?.branchId || req.query.branchId;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      if (!branchId) {
        res.status(400).json({ message: "Branch ID is required" });
        return;
      }

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const invoices = await invoiceService.getInvoicesByDateRange(
        branchId as string,
        startDate,
        endDate
      );

      const totalRevenue = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.total_amount),
        0
      );
      const totalInvoices = invoices.length;

      res.json({
        date: date.toISOString().split("T")[0],
        branchId,
        totalRevenue,
        totalInvoices,
        invoices,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getDailySalesByBranch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const branchId = req.params.branchId || req.user?.branchId;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      if (!branchId) {
        res.status(400).json({ message: "Branch ID is required" });
        return;
      }

      // Branch Users can only access their own branch's data
      if (
        req.user?.role === "branch_user" &&
        req.user?.branchId !== branchId
      ) {
        res.status(403).json({
          message: "Access denied: You can only view your own branch's data",
        });
        return;
      }

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const invoices = await invoiceService.getInvoicesByDateRange(
        branchId as string,
        startDate,
        endDate
      );

      const totalRevenue = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.total_amount),
        0
      );
      const totalInvoices = invoices.length;

      res.json({
        date: date.toISOString().split("T")[0],
        branchId,
        totalRevenue,
        totalInvoices,
        invoices,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
