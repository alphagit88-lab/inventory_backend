import { AppDataSource } from "../config/data-source";
import { Invoice } from "../entities/Invoice";
import { InvoiceItem } from "../entities/InvoiceItem";
import { InventoryService } from "./inventoryService";

export class InvoiceService {
  private invoiceRepository = AppDataSource.getRepository(Invoice);
  private invoiceItemRepository = AppDataSource.getRepository(InvoiceItem);
  private inventoryService = new InventoryService();

  async createInvoice(
    tenantId: string,
    branchId: string,
    items: Array<{
      productVariantId: string;
      quantity: number;
    }>,
    taxAmount?: number,
    changeAmount?: number
  ) {
    // Start transaction
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Validate stock availability for all items
      for (const item of items) {
        const stock = await this.inventoryService.checkStock(
          branchId,
          item.productVariantId
        );

        if (!stock.available || stock.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for product variant ${item.productVariantId}`
          );
        }
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(tenantId);

      // Create invoice
      let totalAmount = 0;
      const invoiceItems: InvoiceItem[] = [];

      for (const item of items) {
        const stock = await this.inventoryService.checkStock(
          branchId,
          item.productVariantId
        );

        const subtotal = Number(stock.sellingPrice) * item.quantity;
        totalAmount += subtotal;

        const invoiceItem = transactionalEntityManager.create(InvoiceItem, {
          product_variant: { id: item.productVariantId } as any,
          quantity: item.quantity,
          unit_price: stock.sellingPrice,
          cost_price: stock.costPrice,
          subtotal,
        });

        invoiceItems.push(invoiceItem);

        // Deduct stock (will be saved with invoice ID after invoice is created)
        // We'll pass the invoice ID after it's saved
      }

      const invoice = transactionalEntityManager.create(Invoice, {
        tenant: { id: tenantId },
        branch: { id: branchId },
        invoice_number: invoiceNumber,
        total_amount: totalAmount + (taxAmount || 0),
        tax_amount: taxAmount || 0,
        change_amount: changeAmount ?? null,
      });

      const savedInvoice = await transactionalEntityManager.save(Invoice, invoice);

      // Link items to invoice and deduct stock
      for (let i = 0; i < invoiceItems.length; i++) {
        const item = invoiceItems[i];
        item.invoice = savedInvoice;
        
        // Deduct stock with invoice reference
        await this.inventoryService.deductStock(
          tenantId,
          branchId,
          items[i].productVariantId,
          items[i].quantity,
          savedInvoice.id
        );
      }

      await transactionalEntityManager.save(InvoiceItem, invoiceItems);

      return await this.getInvoiceById(savedInvoice.id);
    });
  }

  async getInvoiceById(id: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: [
        "tenant",
        "branch",
        "items",
        "items.product_variant",
        "items.product_variant.product",
      ],
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return invoice;
  }

  async getInvoicesByBranch(branchId: string) {
    return await this.invoiceRepository.find({
      where: { branch: { id: branchId } },
      relations: ["items", "items.product_variant"],
      order: { created_at: "DESC" },
    });
  }

  async getInvoicesByTenant(tenantId: string) {
    return await this.invoiceRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ["branch", "items"],
      order: { created_at: "DESC" },
    });
  }

  async getInvoicesByDateRange(
    branchId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.invoiceRepository
      .createQueryBuilder("invoice")
      .where("invoice.branch_id = :branchId", { branchId })
      .andWhere("invoice.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .leftJoinAndSelect("invoice.items", "items")
      .leftJoinAndSelect("items.product_variant", "variant")
      .leftJoinAndSelect("variant.product", "product")
      .orderBy("invoice.created_at", "DESC")
      .getMany();
  }

  async calculateProfit(branchId: string, startDate: Date, endDate: Date) {
    const invoices = await this.getInvoicesByDateRange(
      branchId,
      startDate,
      endDate
    );

    let totalRevenue = 0;
    let totalCost = 0;

    for (const invoice of invoices) {
      for (const item of invoice.items) {
        totalRevenue += Number(item.unit_price) * item.quantity;
        totalCost += Number(item.cost_price) * item.quantity;
      }
    }

    return {
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      invoiceCount: invoices.length,
    };
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.invoiceRepository.count({
      where: { tenant: { id: tenantId } },
    });

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `INV-${year}${month}-${String(count + 1).padStart(5, "0")}`;
  }
}
