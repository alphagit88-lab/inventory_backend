import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const ensureTenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // If no request object (shouldn't happen), fail fast
  if (!req) {
    res.status(500).json({ message: "Invalid request" });
    return;
  }

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
    (req.body && (req.body.tenant_id || req.body.tenantId)) ||
    (req.params && (req.params.tenantId || req.params.tenant_id)) ||
    (req.query && (req.query.tenant_id as string | undefined));

  if (tenantIdFromRequest && tenantIdFromRequest !== req.user.tenantId) {
    res
      .status(403)
      .json({ message: "Access denied to this tenant's data" });
    return;
  }

  next();
};
