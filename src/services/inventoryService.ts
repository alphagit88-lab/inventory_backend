import { AppDataSource } from "../config/data-source";
import { Inventory } from "../entities/Inventory";
import { StockMovement, MovementType } from "../entities/StockMovement";

export class InventoryService {
  private inventoryRepository = AppDataSource.getRepository(Inventory);
  private stockMovementRepository =
    AppDataSource.getRepository(StockMovement);

  async stockIn(
    tenantId: string,
    locationId: string,
    productVariantId: string,
    quantity: number,
    costPrice: number,
    sellingPrice: number,
    supplier?: string
  ) {
    const existing = await this.inventoryRepository.findOne({
      where: {
        location: { id: locationId },
        product_variant: { id: productVariantId },
      },
    });

    const quantityBefore = existing ? existing.quantity : 0;
    const quantityAfter = quantityBefore + quantity;

    if (existing) {
      // Update existing inventory
      existing.quantity = quantityAfter;
      existing.cost_price = costPrice;
      existing.selling_price = sellingPrice;
      const savedInventory = await this.inventoryRepository.save(existing);

      // Record stock movement
      await this.createStockMovement(
        tenantId,
        locationId,
        productVariantId,
        MovementType.STOCK_IN,
        quantity,
        costPrice,
        sellingPrice,
        supplier,
        quantityBefore,
        quantityAfter
      );

      return savedInventory;
    } else {
      // Create new inventory record
      const inventory = this.inventoryRepository.create({
        tenant: { id: tenantId },
        location: { id: locationId },
        product_variant: { id: productVariantId },
        quantity: quantityAfter,
        cost_price: costPrice,
        selling_price: sellingPrice,
      });

      const savedInventory = await this.inventoryRepository.save(inventory);

      // Record stock movement
      await this.createStockMovement(
        tenantId,
        locationId,
        productVariantId,
        MovementType.STOCK_IN,
        quantity,
        costPrice,
        sellingPrice,
        supplier,
        quantityBefore,
        quantityAfter
      );

      return savedInventory;
    }
  }

  private async createStockMovement(
    tenantId: string,
    locationId: string,
    productVariantId: string,
    movementType: MovementType,
    quantity: number,
    unitCostPrice: number,
    unitSellingPrice: number,
    supplier: string | undefined,
    quantityBefore: number,
    quantityAfter: number,
    referenceId?: string
  ) {
    const movement = this.stockMovementRepository.create({
      tenant: { id: tenantId },
      location: { id: locationId },
      product_variant: { id: productVariantId },
      movement_type: movementType,
      quantity,
      unit_cost_price: unitCostPrice,
      unit_selling_price: unitSellingPrice,
      supplier: supplier || null,
      reference_id: referenceId || null,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
    } as any);

    return await this.stockMovementRepository.save(movement);
  }

  async getInventoryByLocation(locationId: string) {
    return await this.inventoryRepository.find({
      where: { location: { id: locationId } },
      relations: ["location", "product_variant", "product_variant.product"],
    });
  }

  async getInventoryByTenant(tenantId: string) {
    return await this.inventoryRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ["location", "product_variant", "product_variant.product"],
    });
  }

  async getAllInventory() {
    return await this.inventoryRepository.find({
      relations: ["location", "product_variant", "product_variant.product", "tenant"],
      order: { location: { name: "ASC" } },
    });
  }

  async checkStock(locationId: string, productVariantId: string) {
    const inventory = await this.inventoryRepository.findOne({
      where: {
        location: { id: locationId },
        product_variant: { id: productVariantId },
      },
      relations: ["product_variant", "product_variant.product"],
    });

    if (!inventory) {
      return { available: false, quantity: 0 };
    }

    const discount = Number(inventory.product_variant?.product?.discount ?? 0);
    const sellingPrice = Number(inventory.selling_price ?? 0);
    const discountedPrice = sellingPrice - (sellingPrice * discount / 100);

    return {
      available: inventory.quantity > 0,
      quantity: inventory.quantity,
      costPrice: inventory.cost_price,
      sellingPrice: inventory.selling_price,
      discount: discount,
      discountedPrice: discountedPrice,
    };
  }

  async deductStock(
    tenantId: string,
    locationId: string,
    productVariantId: string,
    quantity: number,
    referenceId?: string
  ) {
    const inventory = await this.inventoryRepository.findOne({
      where: {
        location: { id: locationId },
        product_variant: { id: productVariantId },
      },
    });

    if (!inventory) {
      throw new Error("Inventory item not found");
    }

    if (inventory.quantity < quantity) {
      throw new Error("Insufficient stock");
    }

    const quantityBefore = inventory.quantity;
    inventory.quantity -= quantity;
    const quantityAfter = inventory.quantity;

    const savedInventory = await this.inventoryRepository.save(inventory);

    // Record stock movement
    await this.createStockMovement(
      tenantId,
      locationId,
      productVariantId,
      MovementType.STOCK_OUT,
      quantity,
      inventory.cost_price,
      inventory.selling_price,
      undefined,
      quantityBefore,
      quantityAfter,
      referenceId
    );

    return savedInventory;
  }

  async getStockMovements(
    locationId: string,
    productVariantId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const query = this.stockMovementRepository
      .createQueryBuilder("movement")
      .where("movement.branch_id = :locationId", { locationId })
      .leftJoinAndSelect("movement.product_variant", "product_variant")
      .leftJoinAndSelect("product_variant.product", "product")
      .orderBy("movement.created_at", "DESC");

    if (productVariantId) {
      query.andWhere("movement.product_variant_id = :productVariantId", {
        productVariantId,
      });
    }

    if (startDate && endDate) {
      query.andWhere("movement.created_at BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    }

    return await query.getMany();
  }

  async getStockStatus(
    tenantId: string,
    locationId?: string,
    size?: string,
    category?: string,
    brand?: string
  ) {
    const query = this.inventoryRepository
      .createQueryBuilder("inventory")
      .leftJoinAndSelect("inventory.product_variant", "product_variant")
      .leftJoinAndSelect("product_variant.product", "product")
      .where("inventory.tenant_id = :tenantId", { tenantId });

    if (locationId) {
      query.andWhere("inventory.branch_id = :locationId", { locationId });
    }

    if (size) {
      query.andWhere("product_variant.variant_name ILIKE :size", { size: `%${size}%` });
    }

    if (category) {
      query.andWhere("product.category = :category", { category });
    }

    if (brand) {
      query.andWhere("product_variant.variant_name ILIKE :brand", { brand: `%${brand}%` });
    }

    const results = await query.getMany();

    // Group by product and size, aggregate quantities across locations
    const aggregated: Record<string, any> = {};

    for (const inv of results) {
      const key = `${inv.product_variant.product.name}_${inv.product_variant.variant_name}`;

      if (!aggregated[key]) {
        aggregated[key] = {
          productName: inv.product_variant.product.name,
          category: inv.product_variant.product.category,
          variantName: inv.product_variant.variant_name,
          totalQuantity: 0,
          locations: [],
        };
      }

      aggregated[key].totalQuantity += inv.quantity;
      aggregated[key].locations.push({
        locationId: inv.location.id,
        locationName: inv.location.name,
        quantity: inv.quantity,
        costPrice: inv.cost_price,
        sellingPrice: inv.selling_price,
      });
    }

    return Object.values(aggregated);
  }

  async getLocalStockReport(locationId: string) {
    const inventory = await this.inventoryRepository.find({
      where: { location: { id: locationId } },
      relations: ["product_variant", "product_variant.product"],
    });

    const summary = {
      totalItems: inventory.length,
      totalQuantity: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      totalValue: inventory.reduce(
        (sum, inv) => sum + Number(inv.cost_price) * inv.quantity,
        0
      ),
      lowStockItems: inventory.filter((inv) => inv.quantity < 10), // Items with less than 10 units
      items: inventory.map((inv) => ({
        productName: inv.product_variant.product.name,
        category: inv.product_variant.product.category,
        variantName: inv.product_variant.variant_name,
        quantity: inv.quantity,
        costPrice: inv.cost_price,
        sellingPrice: inv.selling_price,
        totalValue: Number(inv.cost_price) * inv.quantity,
      })),
    };

    return summary;
  }
}
