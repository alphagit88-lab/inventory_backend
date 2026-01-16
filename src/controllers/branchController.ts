import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { BranchService } from "../services/branchService";

const branchService = new BranchService();

export class BranchController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, address, phone } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      if (!name) {
        res.status(400).json({ message: "Name is required" });
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
      res.status(400).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const branches = await branchService.getBranchesByTenant(tenantId);
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
