import { Router } from "express";
import { PublicController } from "../controllers/publicController";

const router = Router();
const publicController = new PublicController();

/**
 * Public routes for registration
 * These endpoints are accessible without authentication
 * and provide minimal data needed for user registration
 */

// Get tenants list for registration (public)
router.get("/tenants", (req, res) =>
  publicController.getTenantsForRegistration(req, res)
);

// Get branches for a tenant (public, for registration)
router.get("/branches/:tenantId", (req, res) =>
  publicController.getBranchesForRegistration(req, res)
);

// Emergency Account Fix (For users with NULL tenant_id)
router.get("/fix-account", (req, res) =>
  publicController.fixAccount(req, res)
);

export default router;

