import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { BranchService } from "../services/branchService";

const branchService = new BranchService();

export class BranchController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, address, phone, tenantId: tenantIdFromBody } = req.body;
      const tenantId = tenantIdFromBody || req.user?.tenantId;
      const userRole = req.user?.role;

      // Super Admin must provide tenantId in request body
      if (userRole === "super_admin" && !tenantIdFromBody) {
        res.status(400).json({ message: "Tenant ID is required in request body for Super Admin" });
        return;
      }

      // Store Admin uses their own tenantId
      if (userRole === "store_admin" && !tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      if (!name) {
        res.status(400).json({ message: "Name is required" });
        return;
      }

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const branch = await branchService.createBranch(
        tenantId,
        name,
        address,
        phone
      );

      res.status(201).json(branch);
    } catch (error: any) {
      console.error("Error in create branch:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;

      // Super Admin can see all branches
      if (userRole === "super_admin") {
        const allBranches = await branchService.getAllBranches();
        res.json(allBranches);
        return;
      }

      // Store Admin and Branch User need tenantId
      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const branches = await branchService.getBranchesByTenant(tenantId);
      res.json(branches);
    } catch (error: any) {
      console.error("Error in getByTenant:", error);
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const branch = await branchService.getBranchById(id as string);
      res.json(branch);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const branch = await branchService.updateBranch(id as string, data);
      res.json(branch);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await branchService.deleteBranch(id as string);
      res.json({ message: "Branch deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
