import { Router } from "express";
import { InvoiceController } from "../controllers/invoiceController";
import { authenticate } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";

const router = Router();
const invoiceController = new InvoiceController();

// All routes require authentication and tenant isolation
router.use(authenticate, ensureTenantIsolation);

router.post("/", (req, res) => invoiceController.create(req, res));

router.get("/:id", (req, res) => invoiceController.getById(req, res));

router.get("/branch/:branchId", (req, res) =>
  invoiceController.getByBranch(req, res)
);

router.get("/tenant/all", (req, res) =>
  invoiceController.getByTenant(req, res)
);

router.get("/reports/date-range", (req, res) =>
  invoiceController.getByDateRange(req, res)
);

router.get("/reports/profit", (req, res) =>
  invoiceController.calculateProfit(req, res)
);

router.get("/reports/daily-sales", (req, res) =>
  invoiceController.getDailySales(req, res)
);

// Branch-specific daily sales endpoint for Branch Users
router.get("/branch/:branchId/daily-sales", (req, res) =>
  invoiceController.getDailySalesByBranch(req, res)
);

export default router;
