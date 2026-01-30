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
    locationId: string,
    items: Array<{
      productVariantId: string;
      quantity: number;
    }>,
    taxAmount?: number,
    changeAmount?: number,
    customerName?: string
  ) {
    // Start transaction
    return await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Validate stock availability for all items
      for (const item of items) {
        const stock = await this.inventoryService.checkStock(
          locationId,
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
          locationId,
          item.productVariantId
        );

        // Use discounted price if available, otherwise use selling price
        const unitPrice = stock.discountedPrice ?? Number(stock.sellingPrice);
        const subtotal = unitPrice * item.quantity;
        totalAmount += subtotal;

        const invoiceItem = transactionalEntityManager.create(InvoiceItem, {
          product_variant: { id: item.productVariantId } as any,
          quantity: item.quantity,
          unit_price: unitPrice,
          cost_price: stock.costPrice,
          discount: stock.discount ?? 0,
          original_price: Number(stock.sellingPrice),
          subtotal,
        });

        invoiceItems.push(invoiceItem);

        // Deduct stock (will be saved with invoice ID after invoice is created)
        // We'll pass the invoice ID after it's saved
      }

      const invoice = new Invoice();
      invoice.tenant = { id: tenantId } as any;
      invoice.location = { id: locationId } as any;
      invoice.invoice_number = invoiceNumber;
      if (customerName) {
        invoice.customer_name = customerName;
      }
      invoice.total_amount = totalAmount + (taxAmount || 0);
      invoice.tax_amount = taxAmount || 0;
      invoice.change_amount = changeAmount ?? null;

      const savedInvoice = await transactionalEntityManager.save(Invoice, invoice);

      // Link items to invoice and deduct stock
      for (let i = 0; i < invoiceItems.length; i++) {
        const item = invoiceItems[i];
        item.invoice = savedInvoice;
        
        // Deduct stock with invoice reference
        await this.inventoryService.deductStock(
          tenantId,
          locationId,
          items[i].productVariantId,
          items[i].quantity,
          savedInvoice.id
        );
      }

      await transactionalEntityManager.save(InvoiceItem, invoiceItems);

      // Fetch the complete invoice with relations inside the transaction
      const completeInvoice = await transactionalEntityManager.findOne(Invoice, {
        where: { id: savedInvoice.id },
        relations: [
          "tenant",
          "location",
          "items",
          "items.product_variant",
          "items.product_variant.product",
        ],
      });

      if (!completeInvoice) {
        throw new Error("Failed to retrieve created invoice");
      }

      return completeInvoice;
    });
  }

  async getInvoiceById(id: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: [
        "tenant",
        "location",
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

  async getInvoicesByLocation(locationId: string) {
    return await this.invoiceRepository.find({
      where: { location: { id: locationId } },
      relations: ["items", "items.product_variant", "items.product_variant.product"],
      order: { created_at: "DESC" },
    });
  }

  async getInvoicesByTenant(tenantId: string) {
    return await this.invoiceRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ["location", "items", "items.product_variant", "items.product_variant.product"],
      order: { created_at: "DESC" },
    });
  }

  async getAllInvoices() {
    return await this.invoiceRepository.find({
      relations: ["tenant", "location", "items", "items.product_variant", "items.product_variant.product"],
      order: { created_at: "DESC" },
    });
  }

  async getInvoicesByDateRange(
    locationId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.invoiceRepository
      .createQueryBuilder("invoice")
      .where("invoice.branch_id = :locationId", { locationId })
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

  async calculateProfit(locationId: string, startDate: Date, endDate: Date) {
    const invoices = await this.getInvoicesByDateRange(
      locationId,
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
