import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import { ProductCompareService } from '../../../core/services/product-compare.service';
import { CartService } from '../../../core/services/cart.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-compare',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-compare.component.html',
  styleUrls: ['./product-compare.component.scss']
})
export class ProductCompareComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  private subscription?: Subscription;

  compareAttributes = [
    { key: 'price', label: 'Prix' },
    { key: 'compareAtPrice', label: 'Prix barré' },
    { key: 'discount', label: 'Réduction' },
    { key: 'brand', label: 'Marque' },
    { key: 'category', label: 'Catégorie' },
    { key: 'rating', label: 'Note' },
    { key: 'reviewCount', label: 'Nombre d\'avis' },
    { key: 'stock', label: 'Stock' },
    { key: 'description', label: 'Description' }
  ];

  constructor(
    private compareService: ProductCompareService,
    private cartService: CartService,
    public currencyService: CurrencyService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.compareService.compareProducts$.subscribe(products => {
      this.products = products;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  removeProduct(productId: string): void {
    this.compareService.removeProduct(productId);
    this.toastService.info('Produit retiré de la comparaison');
  }

  clearAll(): void {
    this.compareService.clearAll();
    this.toastService.info('Comparaison effacée');
  }

  async addToCart(product: Product): Promise<void> {
    if (product.stock > 0) {
      await this.cartService.addToCart(product, 1);
      this.toastService.success('Produit ajouté au panier !');
    }
  }

  getProductImage(product: Product): string {
    if (!product.images || product.images.length === 0) {
      return '/assets/logo.png';
    }
    
    const firstImage = product.images[0];
    
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    
    return (firstImage as any)?.url || '/assets/logo.png';
  }

  getDiscountPercentage(product: Product): number {
    if (!product.compareAtPrice) return 0;
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  }

  getAttributeValue(product: Product, key: string): any {
    switch (key) {
      case 'price':
        return this.currencyService.formatPrice(product.price);
      case 'compareAtPrice':
        return product.compareAtPrice ? this.currencyService.formatPrice(product.compareAtPrice) : '-';
      case 'discount':
        return product.compareAtPrice ? `-${this.getDiscountPercentage(product)}%` : '-';
      case 'brand':
        return product.brand || '-';
      case 'category':
        return product.category?.name || '-';
      case 'rating':
        return product.rating || '-';
      case 'reviewCount':
        return product.reviewCount || 0;
      case 'stock':
        return product.stock > 0 ? `${product.stock} disponibles` : 'Rupture de stock';
      case 'description':
        return product.shortDescription || product.description || '-';
      default:
        return '-';
    }
  }

  getBestValue(key: string): number | null {
    if (this.products.length === 0) return null;
    
    switch (key) {
      case 'price':
        const minPrice = Math.min(...this.products.map(p => p.price));
        return this.products.findIndex(p => p.price === minPrice);
      case 'rating':
        const maxRating = Math.max(...this.products.map(p => p.rating || 0));
        return this.products.findIndex(p => (p.rating || 0) === maxRating);
      case 'discount':
        const maxDiscount = Math.max(...this.products.map(p => this.getDiscountPercentage(p)));
        return this.products.findIndex(p => this.getDiscountPercentage(p) === maxDiscount);
      default:
        return null;
    }
  }

  isBestValue(product: Product, key: string): boolean {
    const bestIndex = this.getBestValue(key);
    if (bestIndex === null) return false;
    return this.products[bestIndex]?.id === product.id;
  }

  backToProducts(): void {
    this.router.navigate(['/products']);
  }

  getBestPriceProduct(): Product | null {
    if (this.products.length === 0) return null;
    return this.products.reduce((min, product) => 
      product.price < min.price ? product : min
    );
  }

  getBestRatingProduct(): Product | null {
    if (this.products.length === 0) return null;
    return this.products.reduce((max, product) => 
      (product.rating || 0) > (max.rating || 0) ? product : max
    );
  }

  getMostReviewedProduct(): Product | null {
    if (this.products.length === 0) return null;
    return this.products.reduce((max, product) => 
      (product.reviewCount || 0) > (max.reviewCount || 0) ? product : max
    );
  }

  getProgressPercentage(): number {
    return Math.round((this.products.length / 4) * 100);
  }
}

