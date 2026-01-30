import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();
const authController = new AuthController();

router.post("/register", (req, res) => authController.register(req, res));
router.post("/register-super-admin", (req, res) => authController.registerSuperAdmin(req, res));
router.post("/login", (req, res) => authController.login(req, res));
router.post("/logout", authenticate, (req, res) => authController.logout(req, res));
router.get("/profile", authenticate, (req, res) =>
  authController.getProfile(req, res)
);
router.post("/switch-context", authenticate, (req, res) => 
  authController.switchContext(req, res)
);

export default router;
