import { AppDataSource } from "../config/data-source";
import { Product } from "../entities/Product";
import { ProductVariant } from "../entities/ProductVariant";

export class ProductService {
  private productRepository = AppDataSource.getRepository(Product);
  private variantRepository = AppDataSource.getRepository(ProductVariant);

  async createProduct(
    tenantId: string,
    name: string,
    category?: string,
    discount?: number,
    product_code?: string
  ) {
    const product = this.productRepository.create({
      tenant: { id: tenantId },
      name,
      product_code,
      category,
      discount: discount || 0,
    });

    return await this.productRepository.save(product);
  }

  async getProductsByTenant(tenantId: string) {
    return await this.productRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ["variants"],
    });
  }

  async getAllProducts() {
    return await this.productRepository.find({
      relations: ["variants", "tenant"],
      order: { name: "ASC" },
    });
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ["tenant", "variants"],
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  async updateProduct(
    id: string,
    data: { name?: string; category?: string; discount?: number; product_code?: string }
  ) {
    const product = await this.getProductById(id);

    if (data.name) product.name = data.name;
    if (data.category) product.category = data.category;
    if (data.discount !== undefined) product.discount = data.discount;
    if (data.product_code !== undefined) product.product_code = data.product_code;

    return await this.productRepository.save(product);
  }

  async deleteProduct(id: string) {
    const product = await this.getProductById(id);
    return await this.productRepository.remove(product);
  }

  // Product Variant Methods
  async createVariant(productId: string, variant_name: string) {
    const variant = this.variantRepository.create({
      product: { id: productId },
      variant_name,
    });

    return await this.variantRepository.save(variant);
  }

  async getVariantsByProduct(productId: string) {
    return await this.variantRepository.find({
      where: { product: { id: productId } },
      relations: ["product"],
    });
  }

  async searchVariants(tenantId: string, searchTerm: string) {
    return await this.variantRepository
      .createQueryBuilder("variant")
      .leftJoinAndSelect("variant.product", "product")
      .where("product.tenant_id = :tenantId", { tenantId })
      .andWhere(
        "(product.name ILIKE :search OR variant.variant_name ILIKE :search OR product.product_code ILIKE :search)",
        { search: `%${searchTerm}%` }
      )
      .getMany();
  }

  async searchByCode(tenantId: string, code: string) {
    return await this.variantRepository
      .createQueryBuilder("variant")
      .leftJoinAndSelect("variant.product", "product")
      .where("product.tenant_id = :tenantId", { tenantId })
      .andWhere("product.product_code ILIKE :code", { code: `%${code}%` })
      .getMany();
  }
}
