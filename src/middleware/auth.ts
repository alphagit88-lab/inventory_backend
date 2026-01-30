import { Request, Response, NextFunction } from "express";
import { UserRole } from "../entities/User";
import { Session } from "express-session";

interface SessionData {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
    locationId: string | null;
  };
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
    locationId: string | null;
  };
  session: Session & SessionData;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  console.log(`[AUTH] Checking session for ${req.method} ${req.path}`);
  console.log(`[AUTH] Session exists:`, !!req.session);
  console.log(`[AUTH] Session user:`, req.session?.user ? 'exists' : 'missing');

  // Check if user is in session
  if (req.session && req.session.user) {
    req.user = {
      userId: req.session.user.userId,
      email: req.session.user.email,
      role: req.session.user.role,
      tenantId: req.session.user.tenantId ?? null,
      locationId: req.session.user.locationId ?? null,
    };
    console.log(`[AUTH] User authenticated: ${req.user.email} (${req.user.role})`);
    console.log(`[AUTH] Session tenantId: ${req.user.tenantId}`);
    console.log(`[AUTH] Session locationId: ${req.user.locationId}`);
    next();
    return;
  }

  console.log(`[AUTH] Authentication failed - no session user`);
  res.status(401).json({ message: "Authentication required. Please login." });
  return;
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Role hierarchy: Super Admin > Store Admin > Location User
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.SUPER_ADMIN]: 3,
      [UserRole.STORE_ADMIN]: 2,
      [UserRole.LOCATION_USER]: 1,
    };

    // Super Admin can access all routes
    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    // Get the minimum required role level from the allowed roles
    const minRequiredLevel = Math.min(...roles.map(role => roleHierarchy[role]));
    const userLevel = roleHierarchy[req.user.role];

    // User can access if their level is >= minimum required level
    if (userLevel >= minRequiredLevel) {
      next();
      return;
    }

    // User doesn't have sufficient permissions
    res.status(403).json({ message: "Insufficient permissions" });
    return;
  };
};
