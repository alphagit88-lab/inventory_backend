import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AuthService } from "../services/authService";
import { UserRole } from "../entities/User";

const authService = new AuthService();

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, role, tenantId, branchId } = req.body;

      if (!email || !password || !role) {
        res
          .status(400)
          .json({ message: "Email, password, and role are required" });
        return;
      }

      const result = await authService.register(
        email,
        password,
        role as UserRole,
        tenantId,
        branchId
      );

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res
          .status(400)
          .json({ message: "Email and password are required" });
        return;
      }

      const result = await authService.login(email, password);

      // Store user in session
      if (req.session) {
        req.session.user = {
          userId: result.user.id,
          email: result.user.email,
          role: result.user.role,
          tenantId: result.user.tenantId ?? null,
          branchId: result.user.branchId ?? null,
        };
      }

      res.json({ message: "Login successful", user: result.user });
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

      // Ensure tenantId and branchId are always included, even if null
      res.json({
        user: {
          userId: req.user.userId,
          email: req.user.email,
          role: req.user.role,
          tenantId: req.user.tenantId ?? null,
          branchId: req.user.branchId ?? null,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
