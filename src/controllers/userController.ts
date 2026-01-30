import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { UserService } from "../services/userService";
import { UserRole } from "../entities/User";

const userService = new UserService();

export class UserController {
  async createLocationUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, locationId: bodyLocationId, tenantId: bodyTenantId } = req.body;

      console.log('[CREATE_LOCATION_USER] Request received');
      console.log('[CREATE_LOCATION_USER] User role:', req.user?.role);
      console.log('[CREATE_LOCATION_USER] Session tenantId:', req.user?.tenantId);
      console.log('[CREATE_LOCATION_USER] Session locationId:', req.user?.locationId);
      console.log('[CREATE_LOCATION_USER] Body tenantId:', bodyTenantId);
      console.log('[CREATE_LOCATION_USER] Body locationId:', bodyLocationId);

      // Super Admin can provide tenantId in body, others use from session
      const tenantId = req.user?.role === UserRole.SUPER_ADMIN
        ? (bodyTenantId || req.user?.tenantId)
        : req.user?.tenantId;

      // For Super Admin, require location context to be set
      const locationId = req.user?.role === UserRole.SUPER_ADMIN
        ? (bodyLocationId || req.user?.locationId)
        : bodyLocationId;

      console.log('[CREATE_LOCATION_USER] Final tenantId:', tenantId);
      console.log('[CREATE_LOCATION_USER] Final locationId:', locationId);

      if (!tenantId) {
        const message = req.user?.role === UserRole.SUPER_ADMIN
          ? "Tenant ID is required. Please switch context to a shop first."
          : "Tenant ID is required";
        res.status(400).json({ message });
        return;
      }

      if (!locationId) {
        const message = req.user?.role === UserRole.SUPER_ADMIN
          ? "Location ID is required. Please switch context to a specific location first."
          : "Location ID is required";
        res.status(400).json({ message });
        return;
      }

      if (!email || !password) {
        res.status(400).json({
          message: "Email and password are required",
        });
        return;
      }

      const user = await userService.createLocationUser(
        tenantId,
        locationId,
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

  async createStoreAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, tenantId: bodyTenantId, locationId } = req.body;

      // Only Super Admin can create Store Admin
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({ message: "Only Super Admin can create Store Admin users" });
        return;
      }

      // Super Admin must provide tenantId
      const tenantId = bodyTenantId || req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required. Please switch context or provide tenantId in request body." });
        return;
      }

      if (!email || !password) {
        res.status(400).json({
          message: "Email and password are required",
        });
        return;
      }

      const user = await userService.createStoreAdmin(
        tenantId,
        email,
        password,
        locationId
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
      // Super Admin can provide tenantId in query params, others use from session
      const tenantId = req.user?.role === UserRole.SUPER_ADMIN
        ? (req.query.tenantId as string || req.user?.tenantId)
        : req.user?.tenantId;

      // For super admin without context, return all users
      if (req.user?.role === UserRole.SUPER_ADMIN && !tenantId) {
        const users = await userService.getAllUsers();
        const usersResponse = users.map(({ password_hash, ...user }) => user);
        res.json(usersResponse);
        return;
      }

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const users = await userService.getUsersByTenant(tenantId);
      const usersResponse = users.map(({ password_hash, ...user }) => user);
      res.json(usersResponse);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const locationId = req.params.locationId || req.user?.locationId;

      if (!locationId) {
        res.status(400).json({ message: "Location ID is required" });
        return;
      }

      const users = await userService.getUsersByLocation(locationId as string);
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
      const { email, locationId } = req.body;

      // Only Store Admin and Super Admin can update users
      if (req.user?.role !== UserRole.STORE_ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          message: "Insufficient permissions",
        });
        return;
      }

      const user = await userService.updateUser(id as string, {
        email,
        locationId,
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

      // Only Store Admin and Super Admin can delete users
      if (req.user?.role !== UserRole.STORE_ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          message: "Insufficient permissions",
        });
        return;
      }

      // Prevent users from deleting themselves
      if (req.user?.userId === id) {
        res.status(403).json({
          message: "You cannot delete your own account",
        });
        return;
      }

      // Get the user to check their role
      const userToDelete = await userService.getUserById(id as string);

      // Store Admin can only delete location users
      // Super Admin can delete any user
      if (req.user?.role === UserRole.STORE_ADMIN && userToDelete.role !== UserRole.LOCATION_USER) {
        res.status(403).json({
          message: "Store Admins can only delete location users",
        });
        return;
      }

      await userService.deleteUser(id as string);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Only Store Admin and Super Admin can toggle user status
      if (req.user?.role !== UserRole.STORE_ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          message: "Insufficient permissions",
        });
        return;
      }

      const user = await userService.toggleUserStatus(id as string);

      const { password_hash, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

