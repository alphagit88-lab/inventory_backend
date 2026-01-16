import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { TenantService } from "../services/tenantService";

const tenantService = new TenantService();

export class TenantController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, subscription_status } = req.body;

      if (!name) {
        res.status(400).json({ message: "Name is required" });
        return;
      }

      const tenant = await tenantService.createTenant(
        name,
        subscription_status
      );

      res.status(201).json(tenant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenants = await tenantService.getAllTenants();
      res.json(tenants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenant = await tenantService.getTenantById(id as string);
      res.json(tenant);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const tenant = await tenantService.updateTenant(id as string, data);
      res.json(tenant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await tenantService.deleteTenant(id as string);
      res.json({ message: "Tenant deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
