import { AppDataSource } from "../config/data-source";
import { Location } from "../entities/Location";

export class LocationService {
  private locationRepository = AppDataSource.getRepository(Location);

  async createLocation(
    tenantId: string,
    name: string,
    address?: string,
    phone?: string
  ) {
    const location = this.locationRepository.create({
      tenant: { id: tenantId },
      name,
      address,
      phone,
    });

    return await this.locationRepository.save(location);
  }

  async getLocationsByTenant(tenantId: string) {
    if (!tenantId) {
      throw new Error("Tenant ID is required");
    }
    try {
      return await this.locationRepository.find({
        where: { tenant: { id: tenantId } },
        relations: ["tenant"],
        order: { name: "ASC" },
      });
    } catch (error: any) {
      console.error("Error in getLocationsByTenant:", error);
      throw new Error(`Failed to fetch locations: ${error.message}`);
    }
  }

  async getAllLocations() {
    try {
      return await this.locationRepository.find({
        relations: ["tenant"],
        order: { name: "ASC" },
      });
    } catch (error: any) {
      console.error("Error in getAllLocations:", error);
      throw new Error(`Failed to fetch all locations: ${error.message}`);
    }
  }

  async getLocationById(id: string) {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ["tenant", "users", "inventory"],
    });

    if (!location) {
      throw new Error("Location not found");
    }

    return location;
  }

  async updateLocation(
    id: string,
    data: { name?: string; address?: string; phone?: string }
  ) {
    const location = await this.getLocationById(id);

    if (data.name) location.name = data.name;
    if (data.address) location.address = data.address;
    if (data.phone) location.phone = data.phone;

    return await this.locationRepository.save(location);
  }

  async deleteLocation(id: string) {
    const location = await this.getLocationById(id);
    return await this.locationRepository.remove(location);
  }
}
