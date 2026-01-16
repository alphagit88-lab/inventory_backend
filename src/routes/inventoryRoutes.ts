import { Router } from "express";
import { InventoryController } from "../controllers/inventoryController";
import { authenticate } from "../middleware/auth";
import { ensureTenantIsolation } from "../middleware/tenantIsolation";

const router = Router();
const inventoryController = new InventoryController();

// All routes require authentication and tenant isolation
router.use(authenticate, ensureTenantIsolation);

router.post("/stock-in", (req, res) => inventoryController.stockIn(req, res));

router.get("/branch/:branchId", (req, res) =>
  inventoryController.getByBranch(req, res)
);

router.get("/tenant", (req, res) =>
  inventoryController.getByTenant(req, res)
);

router.get("/check-stock", (req, res) =>
  inventoryController.checkStock(req, res)
);

router.get("/stock-movements", (req, res) =>
  inventoryController.getStockMovements(req, res)
);

router.get("/stock-status", (req, res) =>
  inventoryController.getStockStatus(req, res)
);

router.get("/branch/:branchId/report", (req, res) =>
  inventoryController.getLocalStockReport(req, res)
);

export default router;
