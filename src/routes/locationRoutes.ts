import { Router } from "express";
import { LocationController } from "../controllers/locationController";
import { authenticate, authorize } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";
import { UserRole } from "../entities/User";

const router = Router();
const locationController = new LocationController();

// All routes require authentication
router.use(authenticate);

// Create and list locations - Store Admin and Super Admin
router.post(
  "/",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => locationController.create(req, res)
);

router.get(
  "/",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => locationController.getByTenant(req, res)
);

// Get, update, delete specific location
router.get("/:id", ensureTenantIsolation, (req, res) =>
  locationController.getById(req, res)
);

router.put(
  "/:id",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => locationController.update(req, res)
);

router.delete(
  "/:id",
  authorize(UserRole.STORE_ADMIN),
  ensureTenantIsolation,
  (req, res) => locationController.delete(req, res)
);

// Super Admin only - get locations by any tenant
router.get(
  "/by-tenant/:tenantId",
  authorize(UserRole.SUPER_ADMIN),
  (req, res) => locationController.getAllByTenantId(req, res)
);

export default router;
