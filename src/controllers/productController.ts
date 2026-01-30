import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProductService } from "../services/productService";
import { UserRole } from "../entities/User";

const productService = new ProductService();

export class ProductController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, category, discount, product_code, tenantId: bodyTenantId } = req.body;
      // Super Admin can provide tenantId in body, others use from session
      const tenantId = req.user?.role === UserRole.SUPER_ADMIN
        ? (bodyTenantId || req.user?.tenantId)
        : req.user?.tenantId;

      if (!tenantId) {
        const message = req.user?.role === UserRole.SUPER_ADMIN
          ? "Tenant ID is required. Please switch context or provide tenantId in request body."
          : "Tenant ID is required";
        res.status(400).json({ message });
        return;
      }

      if (!name) {
        res.status(400).json({ message: "Name is required" });
        return;
      }

      const product = await productService.createProduct(
        tenantId,
        name,
        category,
        discount,
        product_code
      );

      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getByTenant(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('[PRODUCT] getByTenant called');
      console.log('[PRODUCT] User role:', req.user?.role);
      console.log('[PRODUCT] User tenantId from session:', req.user?.tenantId);
      console.log('[PRODUCT] Query tenantId:', req.query.tenantId);

      // Super Admin can provide tenantId in query params, others use from session
      const tenantId = req.user?.role === UserRole.SUPER_ADMIN
        ? (req.query.tenantId as string || req.user?.tenantId)
        : req.user?.tenantId;

      console.log('[PRODUCT] Final tenantId to use:', tenantId);

      // For super admin without context, return all products
      if (req.user?.role === UserRole.SUPER_ADMIN && !tenantId) {
        console.log('[PRODUCT] Super Admin without context - returning all products');
        const products = await productService.getAllProducts();
        res.json(products);
        return;
      }

      if (!tenantId) {
        console.log('[PRODUCT] No tenantId - returning error');
        res.status(400).json({ message: "Tenant context is required." });
        return;
      }

      console.log('[PRODUCT] Fetching products for tenantId:', tenantId);
      const products = await productService.getProductsByTenant(tenantId);
      console.log('[PRODUCT] Found', products.length, 'products');
      res.json(products);
    } catch (error: any) {
      console.error('[PRODUCT] Error:', error);
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
      const { variant_name } = req.body;

      if (!variant_name) {
        res.status(400).json({ message: "Variant name is required" });
        return;
      }

      const variant = await productService.createVariant(
        productId as string,
        variant_name
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

  async searchByCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      const tenantId = req.user?.tenantId;

      console.log('[SEARCH_BY_CODE] Search request');
      console.log('[SEARCH_BY_CODE] Code:', code);
      console.log('[SEARCH_BY_CODE] TenantId:', tenantId);

      if (!tenantId) {
        res.status(400).json({ message: "Tenant ID is required" });
        return;
      }

      if (!code) {
        res.status(400).json({ message: "Product code is required" });
        return;
      }

      const variants = await productService.searchByCode(
        tenantId,
        code as string
      );

      console.log('[SEARCH_BY_CODE] Found variants:', variants.length);
      res.json(variants);
    } catch (error: any) {
      console.error('[SEARCH_BY_CODE] Error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}
