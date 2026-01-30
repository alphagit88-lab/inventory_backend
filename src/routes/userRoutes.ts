import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";
import { UserRole } from "../entities/User";

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate, ensureTenantIsolation);

// Create Location User - Store Admin and Super Admin
// Support both /users and /users/location-user for backward compatibility
router.post(
  "/",
  authorize(UserRole.STORE_ADMIN),
  (req, res) => userController.createLocationUser(req, res)
);

router.post(
  "/location-user",
  authorize(UserRole.STORE_ADMIN),
  (req, res) => userController.createLocationUser(req, res)
);

// Create Store Admin - Super Admin only
router.post(
  "/store-admin",
  authorize(UserRole.SUPER_ADMIN),
  (req, res) => userController.createStoreAdmin(req, res)
);

// Get users by tenant - Store Admin and Super Admin
router.get(
  "/tenant",
  authorize(UserRole.STORE_ADMIN),
  (req, res) => userController.getByTenant(req, res)
);

// Get users by location
router.get("/location/:locationId", (req, res) =>
  userController.getByLocation(req, res)
);

// Get user by ID
router.get("/:id", (req, res) => userController.getById(req, res));

// Update user - Store Admin and Super Admin
router.put(
  "/:id",
  authorize(UserRole.STORE_ADMIN),
  (req, res) => userController.update(req, res)
);

// Delete user - Store Admin and Super Admin
router.delete(
  "/:id",
  authorize(UserRole.STORE_ADMIN),
  (req, res) => userController.delete(req, res)
);

// Toggle user status (active/inactive) - Store Admin and Super Admin
router.patch(
  "/:id/toggle-status",
  authorize(UserRole.STORE_ADMIN),
  (req, res) => userController.toggleStatus(req, res)
);

export default router;

