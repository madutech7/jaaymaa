import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  private wishlistSubject = new BehaviorSubject<WishlistItem[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  constructor() {
    // Load wishlist when user is authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadWishlist();
      } else {
        this.wishlistSubject.next([]);
      }
    });
  }

  private async loadWishlist(): Promise<void> {
    try {
      // Only load wishlist if user is logged in
      const user = this.authService.currentUser;
      if (!user) {
        this.wishlistSubject.next([]);
        return;
      }

      const data = await firstValueFrom(
        this.api.get<any[]>('wishlists')
      );

      if (data) {
        const wishlistItems: WishlistItem[] = data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          productId: item.product_id,
          product: item.product ? this.mapProduct(item.product) : undefined,
          createdAt: new Date(item.created_at)
        }));
        this.wishlistSubject.next(wishlistItems);
      }
    } catch (error) {
      // Silently fail if user is not authenticated
      this.wishlistSubject.next([]);
    }
  }

  async getWishlist(): Promise<WishlistItem[]> {
    await this.loadWishlist();
    return this.wishlistSubject.value;
  }

  async addToWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.authService.currentUser;
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      await firstValueFrom(
        this.api.post(`wishlists/${productId}`, {})
      );

      await this.loadWishlist();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async removeFromWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.authService.currentUser;
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      await firstValueFrom(
        this.api.delete(`wishlists/${productId}`)
      );

      await this.loadWishlist();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async isInWishlist(productId: string): Promise<boolean> {
    try {
      // Check if user is logged in first
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        return false; // User not logged in, return false silently
      }

      const result = await firstValueFrom(
        this.api.get<{ inWishlist: boolean }>(`wishlists/check/${productId}`)
      );
      return result.inWishlist;
    } catch (error) {
      return false;
    }
  }

  async toggleWishlist(productId: string): Promise<{ success: boolean; isInWishlist: boolean; error?: string }> {
    const isIn = await this.isInWishlist(productId);
    
    if (isIn) {
      const result = await this.removeFromWishlist(productId);
      return { ...result, isInWishlist: false };
    } else {
      const result = await this.addToWishlist(productId);
      return { ...result, isInWishlist: true };
    }
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
      categoryId: data.category_id,
      images: data.images || [],
      isFeatured: data.is_featured || false,
      isNewArrival: data.is_new_arrival || false,
      isBestSeller: data.is_best_seller || false,
      status: data.status || 'active',
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  get wishlistCount(): number {
    return this.wishlistSubject.value.length;
  }

  async clearWishlist(): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove all items one by one
      const items = this.wishlistSubject.value;
      for (const item of items) {
        await this.removeFromWishlist(item.productId);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
