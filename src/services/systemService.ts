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

    // Calculate total revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRevenue = await this.invoiceRepository
      .createQueryBuilder("invoice")
      .select("SUM(invoice.total_amount)", "total")
      .where("invoice.created_at >= :date", { date: thirtyDaysAgo })
      .getRawOne();

    return {
      summary: {
        totalTenants,
        totalBranches,
        totalUsers,
        totalInventoryItems,
        totalRevenueLast30Days: recentRevenue?.total || 0,
      },
      tenants: tenantsWithStats,
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

