import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WishlistService, WishlistItem } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Product } from '../../../core/models/product.model';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];
  isLoading = true;

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private confirmationService: ConfirmationService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  private async loadWishlist(): Promise<void> {
    this.isLoading = true;
    try {
      this.wishlistItems = await this.wishlistService.getWishlist();
    } catch (error) {
      console.error('Erreur lors du chargement de la wishlist:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async removeFromWishlist(productId: string): Promise<void> {
    const result = await this.wishlistService.removeFromWishlist(productId);
    if (result.success) {
      this.wishlistItems = this.wishlistItems.filter(item => item.productId !== productId);
    }
  }

  async clearWishlist(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Vider la wishlist',
      message: 'Êtes-vous sûr de vouloir supprimer tous les produits de votre wishlist ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'warning'
    });
    
    if (confirmed) {
      const result = await this.wishlistService.clearWishlist();
      if (result.success) {
        this.wishlistItems = [];
      }
    }
  }

  async addToCart(product: Product): Promise<void> {
    if (product.stock === 0) return;

    await this.cartService.addToCart(product, 1);

    // Optionnel: Retirer de la wishlist après ajout au panier
    // await this.removeFromWishlist(product.id);
  }

  getDiscountPercentage(product: Product): number {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  }

  getProductImage(product: Product | undefined): string {
    if (!product || !product.images || product.images.length === 0) {
      return '/assets/logo.png';
    }
    
    const firstImage = product.images[0];
    
    // Handle both string URLs and objects with url property
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    
    return (firstImage as any)?.url || '/assets/logo.png';
  }
}
