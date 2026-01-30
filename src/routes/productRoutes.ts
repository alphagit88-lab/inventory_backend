import { Router } from "express";
import { ProductController } from "../controllers/productController";
import { authenticate, authorize } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";
import { UserRole } from "../entities/User";

const router = Router();
const productController = new ProductController();

// All routes require authentication
router.use(authenticate, ensureTenantIsolation);

// Product routes - Location User, Store Admin, and Super Admin
router.post(
  "/",
  authorize(UserRole.LOCATION_USER, UserRole.STORE_ADMIN),
  (req, res) => productController.create(req, res)
);

router.get("/", (req, res) => productController.getByTenant(req, res));

// Search routes - more specific routes must come before generic ones
router.get("/search/code", (req, res) => productController.searchByCode(req, res));

router.get("/search", (req, res) => productController.searchVariants(req, res));

router.get("/:id", (req, res) => productController.getById(req, res));

router.put(
  "/:id",
  authorize(UserRole.LOCATION_USER, UserRole.STORE_ADMIN),
  (req, res) => productController.update(req, res)
);

router.delete(
  "/:id",
  authorize(UserRole.LOCATION_USER, UserRole.STORE_ADMIN),
  (req, res) => productController.delete(req, res)
);

// Variant routes
router.post(
  "/:productId/variants",
  authorize(UserRole.LOCATION_USER, UserRole.STORE_ADMIN),
  (req, res) => productController.createVariant(req, res)
);

router.get("/:productId/variants", (req, res) =>
  productController.getVariantsByProduct(req, res)
);

export default router;
