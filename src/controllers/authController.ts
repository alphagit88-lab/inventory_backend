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

      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json({ user: req.user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
