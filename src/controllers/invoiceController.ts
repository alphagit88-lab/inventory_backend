import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { InvoiceService } from "../services/invoiceService";
import { AppDataSource } from "../config/data-source";
import { Location } from "../entities/Location";

const invoiceService = new InvoiceService();

export class InvoiceController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { items, taxAmount, changeAmount, customerName, tenantId: bodyTenantId } = req.body;
      // Super Admin can provide tenantId in body, others use from session
      let tenantId = req.user?.role === "super_admin"
        ? (bodyTenantId || req.user?.tenantId)
        : req.user?.tenantId;
      const locationId = req.user?.locationId || req.body.locationId;

      // Validate locationId - Location Users must have a location assigned
      if (!locationId) {
        res.status(400).json({ 
          message: "Location ID is required. Please contact your administrator to assign you to a location." 
        });
        return;
      }

      // If tenantId is not available from user, get it from the location
      if (!tenantId && locationId) {
        const locationRepository = AppDataSource.getRepository(Location);
        const location = await locationRepository.findOne({
          where: { id: locationId },
          relations: ["tenant"],
        });
        
        if (location && location.tenant) {
          tenantId = location.tenant.id;
        } else if (!location) {
          res.status(400).json({ 
            message: "Invalid location ID: Location not found" 
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

      // For Location Users, ensure they can only create invoices for their own location
      if (req.user?.role === "location_user" && req.user?.locationId !== locationId) {
        res.status(403).json({ 
          message: "Access denied: You can only create invoices for your assigned location." 
        });
        return;
      }

      const invoice = await invoiceService.createInvoice(
        tenantId,
        locationId,
        items,
        taxAmount,
        changeAmount,
        customerName
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

  async getByLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const locationId = req.user?.locationId || req.params.locationId;

      if (!locationId) {
        res.status(400).json({ message: "Location ID is required" });
        return;
      }

      const invoices = await invoiceService.getInvoicesByLocation(locationId as string);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.role === "super_admin"
        ? (req.query.tenantId as string || req.user?.tenantId)
        : req.user?.tenantId;

      // For super admin without context, return all invoices
      if (req.user?.role === "super_admin" && !tenantId) {
        const invoices = await invoiceService.getAllInvoices();
        res.json(invoices);
        return;
      }

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
      const locationId = req.user?.locationId || req.query.locationId;

      if (!locationId || !startDate || !endDate) {
        res.status(400).json({
          message: "Location ID, start date, and end date are required",
        });
        return;
      }

      const invoices = await invoiceService.getInvoicesByDateRange(
        locationId as string,
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
      const locationId = req.user?.locationId || req.query.locationId;

      if (!locationId || !startDate || !endDate) {
        res.status(400).json({
          message: "Location ID, start date, and end date are required",
        });
        return;
      }

      const profit = await invoiceService.calculateProfit(
        locationId as string,
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
      const locationId = req.user?.locationId || req.query.locationId;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      if (!locationId) {
        res.status(400).json({ message: "Location ID is required" });
        return;
      }

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const invoices = await invoiceService.getInvoicesByDateRange(
        locationId as string,
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
        locationId,
        totalRevenue,
        totalInvoices,
        invoices,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getDailySalesByLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const locationId = req.params.locationId || req.user?.locationId;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      if (!locationId) {
        res.status(400).json({ message: "Location ID is required" });
        return;
      }

      // Location Users can only access their own location's data
      if (
        req.user?.role === "location_user" &&
        req.user?.locationId !== locationId
      ) {
        res.status(403).json({
          message: "Access denied: You can only view your own location's data",
        });
        return;
      }

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const invoices = await invoiceService.getInvoicesByDateRange(
        locationId as string,
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
        locationId,
        totalRevenue,
        totalInvoices,
        invoices,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
