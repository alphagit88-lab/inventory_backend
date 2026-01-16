import { Request, Response, NextFunction } from "express";
import { UserRole } from "../entities/User";
import { Session } from "express-session";

interface SessionData {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
    branchId: string | null;
  };
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
    branchId: string | null;
  };
  session: Session & SessionData;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check if user is in session
  if (req.session && req.session.user) {
    req.user = {
      userId: req.session.user.userId,
      email: req.session.user.email,
      role: req.session.user.role,
      tenantId: req.session.user.tenantId ?? null,
      branchId: req.session.user.branchId ?? null,
    };
    next();
    return;
  }

  res.status(401).json({ message: "Authentication required. Please login." });
  return;
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
};
