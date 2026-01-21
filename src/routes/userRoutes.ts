import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";
import { UserRole } from "../entities/User";

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate, ensureTenantIsolation);

// Create Branch User - Store Admin and Super Admin only
// Support both /users and /users/branch-user for backward compatibility
router.post(
  "/",
  authorize(UserRole.STORE_ADMIN, UserRole.SUPER_ADMIN),
  (req, res) => userController.createBranchUser(req, res)
);

router.post(
  "/branch-user",
  authorize(UserRole.STORE_ADMIN, UserRole.SUPER_ADMIN),
  (req, res) => userController.createBranchUser(req, res)
);

// Get users by tenant - Store Admin and Super Admin only
router.get(
  "/tenant",
  authorize(UserRole.STORE_ADMIN, UserRole.SUPER_ADMIN),
  (req, res) => userController.getByTenant(req, res)
);

// Get users by branch
router.get("/branch/:branchId", (req, res) =>
  userController.getByBranch(req, res)
);

// Get user by ID
router.get("/:id", (req, res) => userController.getById(req, res));

// Update user - Store Admin and Super Admin only
router.put(
  "/:id",
  authorize(UserRole.STORE_ADMIN, UserRole.SUPER_ADMIN),
  (req, res) => userController.update(req, res)
);

// Delete user - Store Admin and Super Admin only
router.delete(
  "/:id",
  authorize(UserRole.STORE_ADMIN, UserRole.SUPER_ADMIN),
  (req, res) => userController.delete(req, res)
);

export default router;

