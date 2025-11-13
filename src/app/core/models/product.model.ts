export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  images: ProductImage[];
  categoryId: string;
  category?: Category;
  brand?: string;
  tags?: string[];
  variants?: ProductVariant[];
  specifications?: Record<string, string>;
  rating?: number;
  reviewCount?: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: VariantOption[];
  price?: number;
  sku?: string;
  stock?: number;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  order: number;
  isActive: boolean;
}

export interface ProductFilter {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string[];
  tags?: string[];
  rating?: number;
  inStock?: boolean;
  search?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';
  page?: number;
  limit?: number;
  status?: 'active' | 'draft' | 'archived';
}

