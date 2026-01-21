import { Request, Response } from "express";
import { TenantService } from "../services/tenantService";
import { BranchService } from "../services/branchService";

const tenantService = new TenantService();
const branchService = new BranchService();

/**
 * Public controller for registration-related endpoints
 * These endpoints are accessible without authentication
 * and return minimal data needed for registration
 */
export class PublicController {
  /**
   * Get list of tenants for registration
   * Returns only id and name (no sensitive data)
   */
  async getTenantsForRegistration(req: Request, res: Response): Promise<void> {
    try {
      const tenants = await tenantService.getAllTenants();
      // Return only minimal data needed for registration
      const publicTenants = tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        subscription_status: tenant.subscription_status,
      }));
      res.json(publicTenants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get branches for a specific tenant (for registration)
   * Returns only id and name (no sensitive data)
   */
  async getBranchesForRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      // Fix for TypeScript type error: tenantId could be string or string[]
      // Only allow string type (API expects /:tenantId, not array)
      if (Array.isArray(tenantId)) {
        res.status(400).json({ message: "Invalid Tenant ID" });
        return;
      }

      const branches = await branchService.getBranchesByTenant(tenantId);
      // Return only minimal data needed for registration
      const publicBranches = branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        address: branch.address,
      }));
      res.json(publicBranches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

