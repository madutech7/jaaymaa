import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Product, ProductFilter, Category } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);

  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  // Simple cache for products
  private productsCache = new Map<string, { products: Product[]; timestamp: number }>();
  private readonly CACHE_DURATION = 300000; // 5 minutes cache (increased for better performance)
  private countCache = new Map<string, { count: number; timestamp: number }>();
  private categoriesCache: { categories: Category[]; timestamp: number } | null = null;

  constructor() {
    this.loadCategories().catch(err => console.error('Error loading categories:', err));
  }

  private getCacheKey(filter?: ProductFilter): string {
    // Normalize filter to ensure consistent cache keys
    // Remove undefined values and sort keys for consistency
    const normalized: any = {};
    
    if (filter) {
      if (filter.categoryId) normalized.categoryId = filter.categoryId;
      if (filter.search) normalized.search = filter.search;
      if (filter.minPrice !== undefined) normalized.minPrice = filter.minPrice;
      if (filter.maxPrice !== undefined) normalized.maxPrice = filter.maxPrice;
      if (filter.brand) normalized.brand = Array.isArray(filter.brand) ? filter.brand.sort().join(',') : filter.brand;
      if (filter.status) normalized.status = filter.status;
      if (filter.sort) normalized.sort = filter.sort;
      if (filter.page) normalized.page = filter.page;
      if (filter.limit) normalized.limit = filter.limit;
    }
    
    // Sort keys to ensure consistent cache keys
    const sortedKeys = Object.keys(normalized).sort();
    const sorted: any = {};
    sortedKeys.forEach(key => {
      sorted[key] = normalized[key];
    });
    
    return JSON.stringify(sorted);
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  // Method to clear cache when needed (e.g., after product update)
  clearCache(): void {
    this.productsCache.clear();
    this.countCache.clear();
  }

  async getProductCount(filter?: ProductFilter): Promise<number> {
    try {
      // Build query parameters - must match exactly with getProducts
      const params: any = {};
      
      if (filter?.categoryId) {
        params.category_id = filter.categoryId;
      }
      if (filter?.search) {
        params.search = filter.search;
      }
      if (filter?.minPrice !== undefined) {
        params.min_price = filter.minPrice;
      }
      if (filter?.maxPrice !== undefined) {
        params.max_price = filter.maxPrice;
      }
      // By default, only count active products (same as backend default)
      // Only pass status if explicitly set, otherwise backend will default to 'active'
      if (filter?.status) {
        params.status = filter.status;
      }
      // Note: We don't pass status='active' explicitly to let backend handle default

      // Check cache AFTER building params to ensure consistency
      const cacheKey = this.getCacheKey(filter);
      const cached = this.countCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.count;
      }

      // Call the count endpoint directly
      const count = await firstValueFrom(
        this.api.get<number>('products/count', params)
      );

      // Cache the result
      const finalCount = typeof count === 'number' ? count : 0;
      this.countCache.set(cacheKey, { count: finalCount, timestamp: Date.now() });
      
      return finalCount;
    } catch (error) {
      console.error('Error getting product count:', error);
      return 0;
    }
  }

  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    try {
      // Build query parameters - must match exactly with getProductCount
      const params: any = {};
      
      if (filter?.categoryId) {
        params.category_id = filter.categoryId;
      }
      if (filter?.search) {
        params.search = filter.search;
      }
      if (filter?.minPrice !== undefined) {
        params.min_price = filter.minPrice;
      }
      if (filter?.maxPrice !== undefined) {
        params.max_price = filter.maxPrice;
      }
      // By default, only get active products (same as backend default)
      if (filter?.status) {
        params.status = filter.status;
      }
      // Note: We don't pass status='active' explicitly to let backend handle default
      
      if (filter?.sort) {
        params.sort = filter.sort;
      }
      if (filter?.page !== undefined) {
        params.page = filter.page;
      }
      if (filter?.limit !== undefined) {
        params.limit = filter.limit;
      }

      // Check cache AFTER building params to ensure consistency
      const cacheKey = this.getCacheKey(filter);
      const cached = this.productsCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        this.productsSubject.next(cached.products);
        return cached.products;
      }

      const data = await firstValueFrom(
        this.api.get<any[]>('products', params)
      );

      const products = this.mapProducts(data || []);
      
      // Cache the results
      this.productsCache.set(cacheKey, { products, timestamp: Date.now() });
      this.productsSubject.next(products);
      
      return products;
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      // Check cache first
      const cacheKey = `slug_${slug}`;
      const cached = this.productsCache.get(cacheKey);
      if (cached && cached.products.length > 0 && this.isCacheValid(cached.timestamp)) {
        return cached.products[0];
      }

      const data = await firstValueFrom(
        this.api.get<any>(`products/slug/${slug}`)
      );

      if (data) {
        const product = this.mapProduct(data);
        // Cache the result
        this.productsCache.set(cacheKey, { products: [product], timestamp: Date.now() });
        return product;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading product by slug:', error);
      return null;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      // Check cache first
      const cacheKey = `id_${id}`;
      const cached = this.productsCache.get(cacheKey);
      if (cached && cached.products.length > 0 && this.isCacheValid(cached.timestamp)) {
        return cached.products[0];
      }

      const data = await firstValueFrom(
        this.api.get<any>(`products/${id}`)
      );

      if (data) {
        const product = this.mapProduct(data);
        // Cache the result
        this.productsCache.set(cacheKey, { products: [product], timestamp: Date.now() });
        return product;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading product by id:', error);
      return null;
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const cacheKey = 'featured';
      const cached = this.productsCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.products;
      }

      const data = await firstValueFrom(
        this.api.get<any[]>('products', { is_featured: true })
      );

      const products = this.mapProducts(data || []).slice(0, 8);
      this.productsCache.set(cacheKey, { products, timestamp: Date.now() });
      return products;
    } catch (error) {
      console.error('Error loading featured products:', error);
      return [];
    }
  }

  async getNewArrivals(): Promise<Product[]> {
    try {
      const cacheKey = 'new_arrivals';
      const cached = this.productsCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.products;
      }

      const data = await firstValueFrom(
        this.api.get<any[]>('products', { is_new_arrival: true })
      );

      const products = this.mapProducts(data || []).slice(0, 8);
      this.productsCache.set(cacheKey, { products, timestamp: Date.now() });
      return products;
    } catch (error) {
      console.error('Error loading new arrivals:', error);
      return [];
    }
  }

  async getBestSellers(): Promise<Product[]> {
    try {
      const cacheKey = 'best_sellers';
      const cached = this.productsCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.products;
      }

      const data = await firstValueFrom(
        this.api.get<any[]>('products', { is_best_seller: true })
      );

      const products = this.mapProducts(data || []).slice(0, 8);
      this.productsCache.set(cacheKey, { products, timestamp: Date.now() });
      return products;
    } catch (error) {
      console.error('Error loading best sellers:', error);
      return [];
    }
  }

  async loadCategories() {
    try {
      // Check cache first
      if (this.categoriesCache && this.isCacheValid(this.categoriesCache.timestamp)) {
        this.categoriesSubject.next(this.categoriesCache.categories);
        return;
      }

      const data = await firstValueFrom(
        this.api.get<any[]>('categories')
      );

      if (data) {
        const categories = this.mapCategories(data);
        this.categoriesCache = { categories, timestamp: Date.now() };
        this.categoriesSubject.next(categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async getCategories(): Promise<Category[]> {
    await this.loadCategories();
    return this.categoriesSubject.value;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const data = await firstValueFrom(
        this.api.get<any>(`categories/slug/${slug}`)
      );

      return data ? this.mapCategory(data) : null;
    } catch (error) {
      console.error('Error loading category by slug:', error);
      return null;
    }
  }

  async createProduct(productData: any): Promise<Product | null> {
    try {
      const data = await firstValueFrom(
        this.api.post<any>('products', productData)
      );

      this.clearCache();
      return data ? this.mapProduct(data) : null;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, productData: any): Promise<Product | null> {
    try {
      const data = await firstValueFrom(
        this.api.patch<any>(`products/${id}`, productData)
      );

      this.clearCache();
      return data ? this.mapProduct(data) : null;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.api.delete(`products/${id}`)
      );

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  async createCategory(categoryData: any): Promise<Category | null> {
    try {
      const data = await firstValueFrom(
        this.api.post<any>('categories', categoryData)
      );

      this.categoriesCache = null; // Clear cache
      await this.loadCategories();
      return data ? this.mapCategory(data) : null;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, categoryData: any): Promise<Category | null> {
    try {
      const data = await firstValueFrom(
        this.api.patch<any>(`categories/${id}`, categoryData)
      );

      this.categoriesCache = null; // Clear cache
      await this.loadCategories();
      return data ? this.mapCategory(data) : null;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.api.delete(`categories/${id}`)
      );

      this.categoriesCache = null; // Clear cache
      await this.loadCategories();
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  // Mapping functions
  private mapProducts(data: any[]): Product[] {
    return data.map(item => this.mapProduct(item));
  }

  private mapProduct(data: any): Product {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.short_description,
      price: parseFloat(data.price),
      compareAtPrice: data.compare_at_price ? parseFloat(data.compare_at_price) : undefined,
      sku: data.sku,
      stock: data.stock,
      images: Array.isArray(data.images) ? data.images : [],
      categoryId: data.category_id,
      category: data.category ? this.mapCategory(data.category) : undefined,
      brand: data.brand,
      tags: Array.isArray(data.tags) ? data.tags : [],
      variants: data.variants || [],
      specifications: data.specifications || {},
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      isFeatured: data.is_featured || false,
      isNewArrival: data.is_new_arrival || false,
      isBestSeller: data.is_best_seller || false,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapCategories(data: any[]): Category[] {
    return data.map(item => this.mapCategory(item));
  }

  private mapCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parent_id,
      image: data.image,
      order: data.order || 0,
      isActive: data.is_active !== false
    };
  }

  // Get all brands from products
  async getBrands(): Promise<string[]> {
    try {
      const products = await this.getProducts();
      const brands = new Set<string>();
      products.forEach(product => {
        if (product.brand) {
          brands.add(product.brand);
        }
      });
      return Array.from(brands).sort();
    } catch (error) {
      console.error('Error getting brands:', error);
      return [];
    }
  }

  // Search products by query
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    try {
      const data = await firstValueFrom(
        this.api.get<any[]>('products', { search: query, limit })
      );
      return this.mapProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}
