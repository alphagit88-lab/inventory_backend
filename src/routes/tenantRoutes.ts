import { Router } from "express";
import { TenantController } from "../controllers/tenantController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";

const router = Router();
const tenantController = new TenantController();

// All tenant routes require super admin role
router.use(authenticate, authorize(UserRole.SUPER_ADMIN));

router.post("/", (req, res) => tenantController.create(req, res));
router.get("/", (req, res) => tenantController.getAll(req, res));
router.get("/:id", (req, res) => tenantController.getById(req, res));
router.put("/:id", (req, res) => tenantController.update(req, res));
router.delete("/:id", (req, res) => tenantController.delete(req, res));

export default router;
