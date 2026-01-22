import { AppDataSource } from "../config/data-source";
import { Tenant, SubscriptionStatus } from "../entities/Tenant";

export class TenantService {
  private tenantRepository = AppDataSource.getRepository(Tenant);

  async createTenant(
    name: string,
    subscriptionStatus: SubscriptionStatus = SubscriptionStatus.TRIAL
  ) {
    // Validate subscription status
    if (
      subscriptionStatus &&
      !Object.values(SubscriptionStatus).includes(subscriptionStatus)
    ) {
      throw new Error(
        `Invalid subscription status. Must be one of: ${Object.values(
          SubscriptionStatus
        ).join(", ")}`
      );
    }

    const tenant = this.tenantRepository.create({
      name,
      subscription_status: subscriptionStatus || SubscriptionStatus.TRIAL,
    });

    return await this.tenantRepository.save(tenant);
  }

  async getAllTenants() {
    // Return only essential fields, no relations needed for list view
    return await this.tenantRepository.find({
      select: ["id", "name", "subscription_status", "created_at"],
      order: { created_at: "DESC" },
    });
  }

  async getTenantById(id: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ["branches", "users", "products"],
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    return tenant;
  }

  async updateTenant(
    id: string,
    data: { name?: string; subscription_status?: SubscriptionStatus }
  ) {
    const tenant = await this.getTenantById(id);

    if (data.name) tenant.name = data.name;
    if (data.subscription_status) {
      // Validate subscription status
      if (
        !Object.values(SubscriptionStatus).includes(data.subscription_status)
      ) {
        throw new Error(
          `Invalid subscription status. Must be one of: ${Object.values(
            SubscriptionStatus
          ).join(", ")}`
        );
      }
      tenant.subscription_status = data.subscription_status;
    }

    return await this.tenantRepository.save(tenant);
  }

  async deleteTenant(id: string) {
    const tenant = await this.getTenantById(id);
    return await this.tenantRepository.remove(tenant);
  }
}
