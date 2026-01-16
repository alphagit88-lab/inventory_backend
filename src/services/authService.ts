import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { User, UserRole } from "../entities/User";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

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
