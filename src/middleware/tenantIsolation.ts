import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const ensureTenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  // Super admin can access all tenants
  if (req.user.role === "super_admin") {
    next();
    return;
  }

  // For other users, ensure tenant isolation
  const tenantIdFromRequest =
    req.body.tenant_id || req.params.tenantId || req.query.tenant_id;

  if (tenantIdFromRequest && tenantIdFromRequest !== req.user.tenantId) {
    res
      .status(403)
      .json({ message: "Access denied to this tenant's data" });
    return;
  }

  next();
};
