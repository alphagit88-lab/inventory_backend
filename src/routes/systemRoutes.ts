import { Router } from "express";
import { SystemController } from "../controllers/systemController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";

const router = Router();
const systemController = new SystemController();

// All routes require Super Admin authentication
router.use(authenticate, authorize(UserRole.SUPER_ADMIN));

router.get("/overview", (req, res) =>
  systemController.getSystemOverview(req, res)
);

export default router;

