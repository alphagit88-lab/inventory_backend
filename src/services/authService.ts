import bcrypt from "bcryptjs";
import { validate as isUUID } from "uuid";
import { AppDataSource } from "../config/data-source";
import { User, UserRole } from "../entities/User";
import { Tenant } from "../entities/Tenant";
import { Location } from "../entities/Location";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private tenantRepository = AppDataSource.getRepository(Tenant);
  private locationRepository = AppDataSource.getRepository(Location);

  async register(
    email: string,
    password: string,
    role: UserRole,
    tenantId?: string,
    locationId?: string
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

    // Validate locationId if provided
    if (locationId) {
      if (!isUUID(locationId)) {
        throw new Error("Invalid location ID format (must be UUID)");
      }
      const location = await this.locationRepository.findOne({
        where: { id: locationId },
        relations: ["tenant"],
      });
      if (!location) {
        throw new Error("Invalid location ID: Location not found");
      }
      // If tenantId is also provided, verify location belongs to tenant
      if (tenantId && location.tenant.id !== tenantId) {
        throw new Error("Location does not belong to the specified tenant");
      }
    }

    // Role-based validation
    if (role === UserRole.STORE_ADMIN && !tenantId) {
      throw new Error("Tenant ID is required for Store Admin role");
    }

    if (role === UserRole.LOCATION_USER) {
      if (!tenantId) {
        throw new Error("Tenant ID is required for Location User role");
      }
      if (!locationId) {
        throw new Error("Location ID is required for Location User role");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password_hash: hashedPassword,
      role,
      tenant: tenantId ? { id: tenantId } : undefined,
      location: locationId ? { id: locationId } : undefined,
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
      relations: ["tenant", "location"],
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (user.isActive === false) {
      throw new Error("Your account has been deactivated. Please contact your administrator.");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant?.id || null,
        locationId: user.location?.id || null,
      },
    };
  }
}
