import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AuthService } from "../services/authService";
import { UserRole } from "../entities/User";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Tenant } from "../entities/Tenant";
import { Location } from "../entities/Location";

const authService = new AuthService();

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    // Public registration is now disabled
    res.status(403).json({
      message: "Public registration is disabled. Please contact your administrator to create an account."
    });
  }

  async registerSuperAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, role } = req.body;

      if (!email || !password || role !== 'super_admin') {
        res
          .status(400)
          .json({ message: "Email, password, and super_admin role are required" });
        return;
      }

      const result = await authService.register(
        email,
        password,
        UserRole.SUPER_ADMIN,
        undefined,
        undefined
      );

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, tenantId, locationId } = req.body;

      if (!email || !password) {
        res
          .status(400)
          .json({ message: "Email and password are required" });
        return;
      }

      const result = await authService.login(email, password);

      // For super admin, allow setting context during login
      let contextTenantId = result.user.tenantId ?? null;
      let contextLocationId = result.user.locationId ?? null;

      if (result.user.role === 'super_admin' && (tenantId || locationId)) {
        contextTenantId = tenantId || null;
        contextLocationId = locationId || null;
      }

      // Store user in session
      if (req.session) {
        req.session.user = {
          userId: result.user.id,
          email: result.user.email,
          role: result.user.role,
          tenantId: contextTenantId,
          locationId: contextLocationId,
        };
      }

      res.json({ message: "Login successful", user: { ...result.user, tenantId: contextTenantId, locationId: contextLocationId } });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message === "Invalid credentials") {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error", error: error.message });
      }
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            res.status(500).json({ message: "Error logging out" });
            return;
          }
          res.clearCookie("connect.sid");
          res.json({ message: "Logout successful" });
        });
      } else {
        res.json({ message: "Already logged out" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "User not found in session" });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      let tenant = null;
      let location = null;

      // For super admin, fetch tenant and location from session context
      if (req.user.role === "super_admin") {
        if (req.user.tenantId) {
          const tenantRepository = AppDataSource.getRepository(Tenant);
          const foundTenant = await tenantRepository.findOne({ where: { id: req.user.tenantId } });
          if (foundTenant) {
            tenant = { id: foundTenant.id, name: foundTenant.name };
          }
        }
        if (req.user.locationId) {
          const locationRepository = AppDataSource.getRepository(Location);
          const foundLocation = await locationRepository.findOne({ where: { id: req.user.locationId } });
          if (foundLocation) {
            location = { id: foundLocation.id, name: foundLocation.name };
          }
        }
      } else {
        // For other roles, fetch from user's database relations
        console.log('[GET_PROFILE] Fetching user with relations for userId:', req.user.userId);
        const fullUser = await userRepository.findOne({
          where: { id: req.user.userId },
          relations: ["tenant", "location"],
        });
        console.log('[GET_PROFILE] Full user found:', !!fullUser);
        console.log('[GET_PROFILE] User tenant:', fullUser?.tenant?.name);
        console.log('[GET_PROFILE] User location:', fullUser?.location?.name);
        tenant = fullUser?.tenant ? { id: fullUser.tenant.id, name: fullUser.tenant.name } : null;
        location = fullUser?.location ? { id: fullUser.location.id, name: fullUser.location.name } : null;
      }

      console.log('[GET_PROFILE] Returning profile with tenant:', tenant?.name, 'location:', location?.name);

      res.json({
        user: {
          userId: req.user.userId,
          email: req.user.email,
          role: req.user.role,
          tenantId: req.user.tenantId ?? null,
          locationId: req.user.locationId ?? null,
          tenant,
          location,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async switchContext(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tenantId, locationId } = req.body;

      console.log('[SWITCH_CONTEXT] Request received');
      console.log('[SWITCH_CONTEXT] User role:', req.user?.role);
      console.log('[SWITCH_CONTEXT] Requested tenantId:', tenantId);
      console.log('[SWITCH_CONTEXT] Requested locationId:', locationId);

      // Only Super Admin can switch context
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({ message: "Only Super Admin can switch context" });
        return;
      }

      // Update session with new context
      if (req.session && req.session.user) {
        req.session.user.tenantId = tenantId || null;
        req.session.user.locationId = locationId || null;

        // Update req.user as well
        req.user.tenantId = tenantId || null;
        req.user.locationId = locationId || null;

        console.log('[SWITCH_CONTEXT] Session updated');
        console.log('[SWITCH_CONTEXT] New session tenantId:', req.session.user.tenantId);
        console.log('[SWITCH_CONTEXT] New session locationId:', req.session.user.locationId);

        // Explicitly save the session to ensure persistence
        req.session.save((err) => {
          if (err) {
            console.error('[SWITCH_CONTEXT] Session save error:', err);
            res.status(500).json({ message: "Failed to save session" });
            return;
          }

          console.log('[SWITCH_CONTEXT] Session saved successfully');
          res.json({
            message: "Context switched successfully",
            context: { tenantId, locationId }
          });
        });
      } else {
        console.error('[SWITCH_CONTEXT] No session found');
        res.status(500).json({ message: "Session not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
