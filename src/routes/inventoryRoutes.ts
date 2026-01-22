import { Router } from "express";
import { InventoryController } from "../controllers/inventoryController";
import { authenticate, authorize } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";
import { UserRole } from "../entities/User";

const router = Router();
const inventoryController = new InventoryController();

// All routes require authentication
router.use(authenticate);

// Stock-in - Store Admin and Branch User only (not Super Admin)
router.post(
  "/stock-in",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => inventoryController.stockIn(req, res)
);

// View inventory - Store Admin and Branch User only
router.get(
  "/branch/:branchId",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => inventoryController.getByBranch(req, res)
);

router.get(
  "/tenant",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => inventoryController.getByTenant(req, res)
);

router.get(
  "/check-stock",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => inventoryController.checkStock(req, res)
);

router.get(
  "/stock-movements",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => inventoryController.getStockMovements(req, res)
);

router.get(
  "/stock-status",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => inventoryController.getStockStatus(req, res)
);

router.get(
  "/branch/:branchId/report",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => inventoryController.getLocalStockReport(req, res)
);

export default router;
