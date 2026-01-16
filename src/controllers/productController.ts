import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProductService } from "../services/productService";

const productService = new ProductService();

export class ProductController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, category } = req.body;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      if (!name) {
        res.status(400).json({ message: "Name is required" });
        return;
      }

      const product = await productService.createProduct(
        tenantId,
        name,
        category
      );

      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      const products = await productService.getProductsByTenant(tenantId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id as string);
      res.json(product);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const product = await productService.updateProduct(id as string, data);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id as string);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Variant endpoints
  async createVariant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { brand, size } = req.body;

      if (!brand || !size) {
        res.status(400).json({ message: "Brand and size are required" });
        return;
      }

      const variant = await productService.createVariant(
        productId as string,
        brand,
        size
      );

      res.status(201).json(variant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getVariantsByProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const variants = await productService.getVariantsByProduct(productId as string);
      res.json(variants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async searchVariants(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      if (!search) {
        res.status(400).json({ message: "Search term is required" });
        return;
      }

      const variants = await productService.searchVariants(
        tenantId,
        search as string
      );

      res.json(variants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
