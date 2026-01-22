import { AppDataSource } from "../config/data-source";
import { User, UserRole } from "../entities/User";
import { Branch } from "../entities/Branch";
import bcrypt from "bcryptjs";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private branchRepository = AppDataSource.getRepository(Branch);

  async createBranchUser(
    tenantId: string,
    branchId: string,
    email: string,
    password: string
  ) {
    // Verify branch belongs to tenant
    const branch = await this.branchRepository.findOne({
      where: { id: branchId, tenant: { id: tenantId } },
    });

    if (!branch) {
      throw new Error("Branch not found or does not belong to tenant");
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password_hash: hashedPassword,
      role: UserRole.BRANCH_USER,
      tenant: { id: tenantId },
      branch: { id: branchId },
    });

    return await this.userRepository.save(user);
  }

  async getUsersByTenant(tenantId: string) {
    // Only return branch users, not Store Admins
    return await this.userRepository.find({
      where: { 
        tenant: { id: tenantId },
        role: UserRole.BRANCH_USER
      },
      relations: ["branch", "tenant"],
      order: { email: "ASC" },
    });
  }

  async getAllUsers() {
    return await this.userRepository.find({
      relations: ["branch", "tenant"],
      order: { email: "ASC" },
    });
  }

  async getUsersByBranch(branchId: string) {
    return await this.userRepository.find({
      where: { branch: { id: branchId } },
      relations: ["branch"],
      order: { email: "ASC" },
    });
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["tenant", "branch"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUser(id: string, data: { email?: string; branchId?: string }) {
    const user = await this.getUserById(id);

    if (data.email) {
      // Check if email is already taken by another user
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new Error("Email already in use");
      }

      user.email = data.email;
    }

    if (data.branchId) {
      // Verify branch belongs to same tenant
      const branch = await this.branchRepository.findOne({
        where: { id: data.branchId, tenant: { id: user.tenant.id } },
      });

      if (!branch) {
        throw new Error("Branch not found or does not belong to tenant");
      }

      user.branch = branch;
    }

    return await this.userRepository.save(user);
  }

  async deleteUser(id: string) {
    const user = await this.getUserById(id);
    return await this.userRepository.remove(user);
  }
}

