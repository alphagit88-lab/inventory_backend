import { Router } from "express";
import { BranchController } from "../controllers/branchController";
import { authenticate, authorize } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";
import { UserRole } from "../entities/User";

const router = Router();
const branchController = new BranchController();

// All routes require authentication
router.use(authenticate);

// Create and list branches - Store Admin only
router.post(
  "/",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => branchController.create(req, res)
);

router.get(
  "/",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => branchController.getByTenant(req, res)
);

// Get, update, delete specific branch
router.get("/:id", ensureTenantIsolation, (req, res) =>
  branchController.getById(req, res)
);

router.put(
  "/:id",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => branchController.update(req, res)
);

router.delete(
  "/:id",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => branchController.delete(req, res)
);

export default router;
