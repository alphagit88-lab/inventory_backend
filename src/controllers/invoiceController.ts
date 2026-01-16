import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { InvoiceService } from "../services/invoiceService";

const invoiceService = new InvoiceService();

export class InvoiceController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { items, taxAmount, changeAmount } = req.body;
      const tenantId = req.user?.tenantId;
      const branchId = req.user?.branchId || req.body.branchId;

      if (!tenantId || !branchId) {
        res.status(400).json({ message: "Tenant ID and Branch ID are required" });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: "Items array is required and must not be empty" });
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
      res.status(400).json({ message: error.message });
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
}
