import { Request, Response } from "express";
import { TenantService } from "../services/tenantService";
import { LocationService } from "../services/locationService";

const tenantService = new TenantService();
const locationService = new LocationService();

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
   * Get locations for a specific tenant (for registration)
   * Returns only id and name (no sensitive data)
   * Works for ALL tenants regardless of subscription_status (trial, active, suspended)
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

      // Get locations for tenant - works for all subscription statuses
      const locations = await locationService.getLocationsByTenant(tenantId);

      // Return only minimal data needed for registration
      // Always return an array, even if empty
      const publicLocations = locations.map((location) => ({
        id: location.id,
        name: location.name,
        address: location.address,
      }));

      // Return empty array if no locations found (this is valid - tenant might not have locations yet)
      res.json(publicLocations);
    } catch (error: any) {
      console.error('Error in getBranchesForRegistration:', error);
      res.status(500).json({ message: error.message || "Failed to fetch locations" });
    }
  }
  /**
   * Temporary fix for users who registered without a tenant
   * Use: GET /api/public/fix-account?email=user@example.com
   */
  async fixAccount(req: Request, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const dataSource = (await import("../config/data-source")).AppDataSource;
      const userRepo = dataSource.getRepository((await import("../entities/User")).User);
      const tenantRepo = dataSource.getRepository((await import("../entities/Tenant")).Tenant);

      // 1. Find User
      const user = await userRepo.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (user.tenant) {
        res.json({ message: "User is already linked to a tenant", tenantId: user.tenant.id });
        return;
      }

      // 2. Find or Create Tenant
      let tenant = await tenantRepo.findOne({ where: { name: "Main Store" } });
      if (!tenant) {
        tenant = tenantRepo.create({
          name: "Main Store",
          subscription_status: "trial" as any, // Cast to any to avoid import issues
        });
        await tenantRepo.save(tenant);
      }

      // 3. Link User
      user.tenant = tenant;
      await userRepo.save(user);

      res.json({
        message: "✅ Account fixed! Your user is now linked to 'Main Store'. Please Logout and Login again.",
        tenantId: tenant.id
      });

    } catch (error: any) {
      console.error("Error fixing account:", error);
      res.status(500).json({ message: error.message });
    }
  }
}

