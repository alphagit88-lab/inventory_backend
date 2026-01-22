import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { UserService } from "../services/userService";
import { UserRole } from "../entities/User";

const userService = new UserService();

export class UserController {
  async createBranchUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, branchId } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      if (!email || !password || !branchId) {
        res.status(400).json({
          message: "Email, password, and branch ID are required",
        });
        return;
      }

      // Only Store Admin can create Branch Users
      if (req.user?.role !== UserRole.STORE_ADMIN) {
        res.status(403).json({
          message: "Only Store Admin can create Branch Users",
        });
        return;
      }

      const user = await userService.createBranchUser(
        tenantId,
        branchId,
        email,
        password
      );

      // Don't return password hash
      const { password_hash, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      // Store Admin needs tenantId
      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      // Only Store Admin can view users
      if (req.user?.role !== UserRole.STORE_ADMIN) {
        res.status(403).json({
          message: "Insufficient permissions",
        });
        return;
      }

      const users = await userService.getUsersByTenant(tenantId);
      const usersResponse = users.map(({ password_hash, ...user }) => user);
      res.json(usersResponse);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByBranch(req: AuthRequest, res: Response): Promise<void> {
    try {
      const branchId = req.params.branchId || req.user?.branchId;

      if (!branchId) {
        res.status(400).json({ message: "Branch ID is required" });
        return;
      }

      const users = await userService.getUsersByBranch(branchId as string);
      const usersResponse = users.map(({ password_hash, ...user }) => user);
      res.json(usersResponse);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id as string);

      // Don't return password hash
      const { password_hash, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, branchId } = req.body;

      // Only Store Admin can update users
      if (req.user?.role !== UserRole.STORE_ADMIN) {
        res.status(403).json({
          message: "Insufficient permissions",
        });
        return;
      }

      const user = await userService.updateUser(id as string, {
        email,
        branchId,
      });

      const { password_hash, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Only Store Admin can delete users
      if (req.user?.role !== UserRole.STORE_ADMIN) {
        res.status(403).json({
          message: "Insufficient permissions",
        });
        return;
      }

      // Prevent Store Admin from deleting themselves
      if (req.user?.userId === id) {
        res.status(403).json({
          message: "You cannot delete your own account",
        });
        return;
      }

      // Get the user to check their role
      const userToDelete = await userService.getUserById(id as string);
      
      // Prevent deleting Store Admin accounts (only branch users can be deleted)
      if (userToDelete.role !== UserRole.BRANCH_USER) {
        res.status(403).json({
          message: "Only branch users can be deleted",
        });
        return;
      }

      await userService.deleteUser(id as string);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

