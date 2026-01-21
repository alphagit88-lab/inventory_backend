import bcrypt from "bcryptjs";
import { validate as isUUID } from "uuid";
import { AppDataSource } from "../config/data-source";
import { User, UserRole } from "../entities/User";
import { Tenant } from "../entities/Tenant";
import { Branch } from "../entities/Branch";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private tenantRepository = AppDataSource.getRepository(Tenant);
  private branchRepository = AppDataSource.getRepository(Branch);

  async register(
    email: string,
    password: string,
    role: UserRole,
    tenantId?: string,
    branchId?: string
  ) {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Validate tenantId if provided
    if (tenantId) {
      if (!isUUID(tenantId)) {
        throw new Error("Invalid tenant ID format (must be UUID)");
      }
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
      });
      if (!tenant) {
        throw new Error("Invalid tenant ID: Tenant not found");
      }
    }

    // Validate branchId if provided
    if (branchId) {
      if (!isUUID(branchId)) {
        throw new Error("Invalid branch ID format (must be UUID)");
      }
      const branch = await this.branchRepository.findOne({
        where: { id: branchId },
        relations: ["tenant"],
      });
      if (!branch) {
        throw new Error("Invalid branch ID: Branch not found");
      }
      // If tenantId is also provided, verify branch belongs to tenant
      if (tenantId && branch.tenant.id !== tenantId) {
        throw new Error("Branch does not belong to the specified tenant");
      }
    }

    // Role-based validation
    if (role === UserRole.STORE_ADMIN && !tenantId) {
      throw new Error("Tenant ID is required for Store Admin role");
    }

    if (role === UserRole.BRANCH_USER) {
      if (!tenantId) {
        throw new Error("Tenant ID is required for Branch User role");
      }
      if (!branchId) {
        throw new Error("Branch ID is required for Branch User role");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password_hash: hashedPassword,
      role,
      tenant: tenantId ? { id: tenantId } : undefined,
      branch: branchId ? { id: branchId } : undefined,
    });

    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["tenant", "branch"],
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant?.id || null,
        branchId: user.branch?.id || null,
      },
    };
  }
}
