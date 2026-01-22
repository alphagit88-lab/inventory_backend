import { Router } from "express";
import { InvoiceController } from "../controllers/invoiceController";
import { authenticate, authorize } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";
import { UserRole } from "../entities/User";

const router = Router();
const invoiceController = new InvoiceController();

// All routes require authentication
router.use(authenticate);

// Create invoice - Branch User only
// This route must be defined before any parameterized routes like /:id
router.post(
  "/",
  authorize(UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => {
    console.log('POST /api/invoices route hit');
    invoiceController.create(req, res);
  }
);

// View invoice - Store Admin and Branch User only
router.get(
  "/:id",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getById(req, res)
);

router.get(
  "/branch/:branchId",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getByBranch(req, res)
);

router.get(
  "/tenant/all",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => invoiceController.getByTenant(req, res)
);

router.get(
  "/reports/date-range",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getByDateRange(req, res)
);

router.get(
  "/reports/profit",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.calculateProfit(req, res)
);

router.get(
  "/reports/daily-sales",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getDailySales(req, res)
);

// Branch-specific daily sales endpoint for Branch Users
router.get(
  "/branch/:branchId/daily-sales",
  authorize(UserRole.STORE_ADMIN, UserRole.BRANCH_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getDailySalesByBranch(req, res)
);

export default router;
