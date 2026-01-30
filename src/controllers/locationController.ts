import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { LocationService } from "../services/locationService";
import { UserRole } from "../entities/User";

const locationService = new LocationService();

export class LocationController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, address, phone, tenantId: bodyTenantId } = req.body;
      // Super Admin can provide tenantId in body, others use from session
      const tenantId = req.user?.role === UserRole.SUPER_ADMIN 
        ? (bodyTenantId || req.user?.tenantId)
        : req.user?.tenantId;

      if (!tenantId) {
        const message = req.user?.role === UserRole.SUPER_ADMIN
          ? "Tenant ID is required. Please switch context or provide tenantId in request body."
          : "Tenant ID is required";
        res.status(400).json({ message });
        return;
      }

      if (!name) {
        res.status(400).json({ message: "Name is required" });
        return;
      }

      const location = await locationService.createLocation(
        tenantId,
        name,
        address,
        phone
      );

      res.status(201).json(location);
    } catch (error: any) {
      console.error("Error in create location:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Super Admin can provide tenantId in query params, others use from session
      const tenantId = req.user?.role === UserRole.SUPER_ADMIN
        ? (req.query.tenantId as string || req.user?.tenantId)
        : req.user?.tenantId;

      // For super admin without context, return all locations
      if (req.user?.role === UserRole.SUPER_ADMIN && !tenantId) {
        const locations = await locationService.getAllLocations();
        res.json(locations);
        return;
      }

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const locations = await locationService.getLocationsByTenant(tenantId);
      res.json(locations);
    } catch (error: any) {
      console.error("Error in getByTenant:", error);
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const location = await locationService.getLocationById(id as string);
      res.json(location);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const location = await locationService.updateLocation(id as string, data);
      res.json(location);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await locationService.deleteLocation(id as string);
      res.json({ message: "Location deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAllByTenantId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const locations = await locationService.getLocationsByTenant(tenantId as string);
      res.json(locations);
    } catch (error: any) {
      console.error("Error in getAllByTenantId:", error);
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }
}
