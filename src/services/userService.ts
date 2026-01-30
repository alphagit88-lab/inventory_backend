import { AppDataSource } from "../config/data-source";
import { User, UserRole } from "../entities/User";
import { Location } from "../entities/Location";
import bcrypt from "bcryptjs";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private locationRepository = AppDataSource.getRepository(Location);

  async createLocationUser(
    tenantId: string,
    locationId: string,
    email: string,
    password: string
  ) {
    // Verify location belongs to tenant
    const location = await this.locationRepository.findOne({
      where: { id: locationId, tenant: { id: tenantId } },
    });

    if (!location) {
      throw new Error("Location not found or does not belong to tenant");
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
      role: UserRole.LOCATION_USER,
      tenant: { id: tenantId },
      location: { id: locationId },
    });

    return await this.userRepository.save(user);
  }

  async createStoreAdmin(
    tenantId: string,
    email: string,
    password: string,
    locationId?: string
  ) {
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
      role: UserRole.STORE_ADMIN,
      tenant: { id: tenantId },
      location: locationId ? { id: locationId } : undefined,
    });

    return await this.userRepository.save(user);
  }

  async getUsersByTenant(tenantId: string) {
    // Return all users (location users and store admins) for the tenant
    return await this.userRepository.find({
      where: {
        tenant: { id: tenantId }
      },
      relations: ["location", "tenant"],
      order: { email: "ASC" },
    });
  }

  async getAllUsers() {
    return await this.userRepository.find({
      relations: ["location", "tenant"],
      order: { email: "ASC" },
    });
  }

  async getUsersByLocation(locationId: string) {
    return await this.userRepository.find({
      where: { location: { id: locationId } },
      relations: ["location"],
      order: { email: "ASC" },
    });
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["tenant", "location"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUser(id: string, data: { email?: string; locationId?: string }) {
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

    if (data.locationId) {
      // Verify location belongs to same tenant
      const location = await this.locationRepository.findOne({
        where: { id: data.locationId, tenant: { id: user.tenant.id } },
      });

      if (!location) {
        throw new Error("Location not found or does not belong to tenant");
      }

      user.location = location;
    }

    return await this.userRepository.save(user);
  }

  async deleteUser(id: string) {
    const user = await this.getUserById(id);
    return await this.userRepository.remove(user);
  }

  async toggleUserStatus(id: string) {
    const user = await this.getUserById(id);
    user.isActive = !user.isActive;
    return await this.userRepository.save(user);
  }
}

