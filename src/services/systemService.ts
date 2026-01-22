import { AppDataSource } from "../config/data-source";
import { Tenant } from "../entities/Tenant";
import { Branch } from "../entities/Branch";
import { User } from "../entities/User";
import { Invoice } from "../entities/Invoice";
import { Inventory } from "../entities/Inventory";

export class SystemService {
  private tenantRepository = AppDataSource.getRepository(Tenant);
  private branchRepository = AppDataSource.getRepository(Branch);
  private userRepository = AppDataSource.getRepository(User);
  private invoiceRepository = AppDataSource.getRepository(Invoice);
  private inventoryRepository = AppDataSource.getRepository(Inventory);

  async getSystemOverview() {
    const [
      totalTenants,
      totalBranches,
      totalUsers,
      recentInvoices,
      totalInventoryItems,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.branchRepository.count(),
      this.userRepository.count(),
      this.invoiceRepository.find({
        take: 10,
        order: { created_at: "DESC" },
        relations: ["tenant", "branch"],
      }),
      this.inventoryRepository.count(),
    ]);

    // Get tenants with branch counts
    const tenants = await this.tenantRepository.find({
      relations: ["branches"],
    });

    const tenantsWithStats = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      subscriptionStatus: tenant.subscription_status,
      createdAt: tenant.created_at,
      branchCount: tenant.branches.length,
    }));

    // Get all branches with tenant info
    const branches = await this.branchRepository.find({
      relations: ["tenant"],
      order: { name: "ASC" },
    });

    const branchesWithStats = branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      tenantName: branch.tenant.name,
      tenantId: branch.tenant.id,
    }));

    // Get all users with tenant and branch info
    const users = await this.userRepository.find({
      relations: ["tenant", "branch"],
      order: { email: "ASC" },
    });

    const usersWithStats = users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantName: user.tenant?.name || null,
      branchName: user.branch?.name || null,
    }));

    // Get inventory items with product and branch info
    const inventoryItems = await this.inventoryRepository.find({
      relations: ["product_variant", "product_variant.product", "branch", "branch.tenant"],
      take: 100, // Limit to 100 items
    });

    const inventoryWithStats = inventoryItems.map((item) => ({
      id: item.id,
      productName: item.product_variant?.product?.name || "Unknown",
      brand: item.product_variant?.brand || "N/A",
      size: item.product_variant?.size || "N/A",
      quantity: item.quantity,
      costPrice: item.cost_price,
      sellingPrice: item.selling_price,
      branchName: item.branch?.name || "Unknown",
      tenantName: item.branch?.tenant?.name || "Unknown",
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

    return {
      summary: {
        totalTenants,
        totalBranches,
        totalUsers,
        totalInventoryItems,
        totalRevenueLast30Days: recentRevenue?.total || 0,
      },
      tenants: tenantsWithStats,
      branches: branchesWithStats,
      users: usersWithStats,
      inventoryItems: inventoryWithStats,
      revenue: {
        total: recentRevenue?.total || 0,
        byTenant: revenueByTenant.map((r) => ({
          tenantName: r.tenantname || r.tenantName,
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
          branchName: inv.branch.name,
          createdAt: inv.created_at,
        })),
      },
      timestamp: new Date(),
    };
  }
}

