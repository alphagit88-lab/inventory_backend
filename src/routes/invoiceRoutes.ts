import { Router, Request, Response, NextFunction } from "express";
import { InvoiceController } from "../controllers/invoiceController";
import { authenticate, authorize } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";
import { UserRole } from "../entities/User";

const router = Router();
const invoiceController = new InvoiceController();

// Debug middleware - log all requests to invoice routes
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[INVOICE ROUTE] ${req.method} ${req.path} - Body:`, JSON.stringify(req.body));
  next();
});

// All routes require authentication
router.use(authenticate);

// Create invoice - Location User, Store Admin, and Super Admin
// This route must be defined before any parameterized routes like /:id
router.post(
  "/",
  authorize(UserRole.LOCATION_USER, UserRole.STORE_ADMIN, UserRole.SUPER_ADMIN),
  ensureTenantIsolation,
  (req, res) => {
    console.log('POST /api/invoices route hit - passed all middleware');
    invoiceController.create(req, res);
  }
);

// Get invoices by location - must come BEFORE /:id
router.get(
  "/location/:locationId",
  authorize(UserRole.STORE_ADMIN, UserRole.LOCATION_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getByLocation(req, res)
);

// Get all tenant invoices - must come BEFORE /:id
router.get(
  "/tenant/all",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => invoiceController.getByTenant(req, res)
);

// Reports routes - must come BEFORE /:id
router.get(
  "/reports/date-range",
  authorize(UserRole.STORE_ADMIN, UserRole.LOCATION_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getByDateRange(req, res)
);

router.get(
  "/reports/profit",
  authorize(UserRole.STORE_ADMIN, UserRole.LOCATION_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.calculateProfit(req, res)
);

router.get(
  "/reports/daily-sales",
  authorize(UserRole.STORE_ADMIN, UserRole.LOCATION_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getDailySales(req, res)
);

// Location-specific daily sales endpoint
router.get(
  "/location/:locationId/daily-sales",
  authorize(UserRole.STORE_ADMIN, UserRole.LOCATION_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getDailySalesByLocation(req, res)
);

// View single invoice by ID - must come AFTER all specific routes
router.get(
  "/:id",
  authorize(UserRole.STORE_ADMIN, UserRole.LOCATION_USER),
  ensureTenantIsolation,
  (req, res) => invoiceController.getById(req, res)
);

export default router;
