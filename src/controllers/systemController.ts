import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { SystemService } from "../services/systemService";
import { UserRole } from "../entities/User";

const systemService = new SystemService();

export class SystemController {
  async getSystemOverview(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Only Super Admin can access system overview
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          message: "Only Super Admin can access system overview",
        });
        return;
      }

      const overview = await systemService.getSystemOverview();
      res.json(overview);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

