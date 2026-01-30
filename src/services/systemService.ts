import { AppDataSource } from "../config/data-source";
import { Tenant } from "../entities/Tenant";
import { Location } from "../entities/Location";
import { User } from "../entities/User";
import { Invoice } from "../entities/Invoice";
import { Inventory } from "../entities/Inventory";

export class SystemService {
  private tenantRepository = AppDataSource.getRepository(Tenant);
  private locationRepository = AppDataSource.getRepository(Location);
  private userRepository = AppDataSource.getRepository(User);
  private invoiceRepository = AppDataSource.getRepository(Invoice);
  private inventoryRepository = AppDataSource.getRepository(Inventory);

  async getSystemOverview() {
    const [
      totalTenants,
      totalLocations,
      totalUsers,
      recentInvoices,
      totalInventoryItems,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.locationRepository.count(),
      this.userRepository.count(),
      this.invoiceRepository.find({
        take: 10,
        order: { created_at: "DESC" },
        relations: ["tenant", "location"],
      }),
      this.inventoryRepository.count(),
    ]);

    // Get tenants with location counts
    const tenants = await this.tenantRepository.find({
      relations: ["locations"],
    });

    const tenantsWithStats = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      subscriptionStatus: tenant.subscription_status,
      createdAt: tenant.created_at,
      locationCount: tenant.locations.length,
    }));

    // Get all locations with tenant info
    const locations = await this.locationRepository.find({
      relations: ["tenant"],
      order: { name: "ASC" },
    });

    const locationsWithStats = locations.map((location) => ({
      id: location.id,
      name: location.name,
      address: location.address,
      phone: location.phone,
      tenantName: location.tenant.name,
      tenantId: location.tenant.id,
    }));

    // Get all users with tenant and location info
    const users = await this.userRepository.find({
      relations: ["tenant", "location"],
      order: { email: "ASC" },
    });

    const usersWithStats = users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantName: user.tenant?.name || null,
      locationName: user.location?.name || null,
    }));

    // Get inventory items with product and location info
    const inventoryItems = await this.inventoryRepository.find({
      relations: ["product_variant", "product_variant.product", "location", "location.tenant"],
      take: 100, // Limit to 100 items
    });

    const inventoryWithStats = inventoryItems.map((item) => ({
      id: item.id,
      productName: item.product_variant?.product?.name || "Unknown",
      variantName: item.product_variant?.variant_name || "N/A",
      quantity: item.quantity,
      costPrice: item.cost_price,
      sellingPrice: item.selling_price,
      locationName: item.location?.name || "Unknown",
      tenantName: item.location?.tenant?.name || "Unknown",
    }));

    // Calculate total revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRevenue = await this.invoiceRepository
      .createQueryBuilder("invoice")
      .select("SUM(invoice.total_amount)", "total")
      .where("invoice.created_at >= :date", { date: thirtyDaysAgo })
      .getRawOne();

    // Get revenue breakdown by tenant
    const revenueByTenant = await this.invoiceRepository
      .createQueryBuilder("invoice")
      .leftJoin("invoice.tenant", "tenant")
      .select("tenant.name", "tenantName")
      .addSelect("SUM(invoice.total_amount)", "totalRevenue")
      .addSelect("COUNT(invoice.id)", "invoiceCount")
      .where("invoice.created_at >= :date", { date: thirtyDaysAgo })
      .groupBy("tenant.id")
      .addGroupBy("tenant.name")
      .orderBy("SUM(invoice.total_amount)", "DESC")
      .getRawMany();

    // Get revenue breakdown by location
    const revenueByLocation = await this.invoiceRepository
      .createQueryBuilder("invoice")
      .leftJoin("invoice.location", "location")
      .leftJoin("location.tenant", "tenant")
      .select("location.name", "locationName")
      .addSelect("tenant.name", "tenantName")
      .addSelect("SUM(invoice.total_amount)", "totalRevenue")
      .addSelect("COUNT(invoice.id)", "invoiceCount")
      .where("invoice.created_at >= :date", { date: thirtyDaysAgo })
      .groupBy("location.id")
      .addGroupBy("location.name")
      .addGroupBy("tenant.name")
      .orderBy("SUM(invoice.total_amount)", "DESC")
      .getRawMany();

    return {
      summary: {
        totalTenants,
        totalLocations,
        totalUsers,
        totalInventoryItems,
        totalRevenueLast30Days: recentRevenue?.total || 0,
      },
      tenants: tenantsWithStats,
      locations: locationsWithStats,
      users: usersWithStats,
      inventoryItems: inventoryWithStats,
      revenue: {
        total: recentRevenue?.total || 0,
        byTenant: revenueByTenant.map((r) => ({
          tenantName: r.tenantname || r.tenantName,
          totalRevenue: parseFloat(r.totalrevenue || r.totalRevenue || 0),
          invoiceCount: parseInt(r.invoicecount || r.invoiceCount || 0),
        })),
        byLocation: revenueByLocation.map((r) => ({
          tenantName: r.tenantname || r.tenantName,
          locationName: r.locationname || r.locationName,
          totalRevenue: parseFloat(r.totalrevenue || r.totalRevenue || 0),
          invoiceCount: parseInt(r.invoicecount || r.invoiceCount || 0),
        })),
      },
      recentActivity: {
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          totalAmount: inv.total_amount,
          tenantName: inv.tenant.name,
          locationName: inv.location.name,
          createdAt: inv.created_at,
        })),
      },
      timestamp: new Date(),
    };
  }
}

