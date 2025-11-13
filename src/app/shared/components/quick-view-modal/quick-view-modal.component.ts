import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Modal Overlay -->
    <div 
      *ngIf="isOpen && product"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      (click)="close()"
    >
      <!-- Modal Content -->
      <div 
        class="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
        (click)="$event.stopPropagation()"
      >
        <!-- Close Button -->
        <button
          (click)="close()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center shadow-lg transition-all"
        >
          <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <div class="grid md:grid-cols-2 gap-8 p-6 md:p-8">
          <!-- Left: Image Gallery -->
          <div>
            <!-- Main Image -->
            <div class="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
              <img 
                [src]="selectedImage" 
                [alt]="product.name"
                class="w-full h-full object-cover"
              >
            </div>

            <!-- Thumbnail Gallery -->
            <div *ngIf="product.images && product.images.length > 1" class="grid grid-cols-4 gap-2">
              <button
                *ngFor="let image of getProductImages(); let i = index"
                (click)="selectImage(i)"
                [class.ring-2]="selectedImageIndex === i"
                [class.ring-purple-500]="selectedImageIndex === i"
                class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-75 transition-opacity"
              >
                <img 
                  [src]="image" 
                  [alt]="product.name"
                  class="w-full h-full object-cover"
                >
              </button>
            </div>
          </div>

          <!-- Right: Product Info -->
          <div class="flex flex-col">
            <!-- Product Name -->
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ product.name }}</h2>

            <!-- Brand -->
            <p *ngIf="product.brand" class="text-purple-600 dark:text-purple-400 font-semibold mb-4">{{ product.brand }}</p>

            <!-- Rating -->
            <div class="flex items-center mb-4">
              <div class="flex text-yellow-400">
                <svg *ngFor="let star of [1,2,3,4,5]" 
                     [class.text-gray-300]="star > (product.rating || 0)"
                     class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <span class="text-gray-600 dark:text-gray-400 ml-2">({{ product.reviewCount || 0 }} avis)</span>
            </div>

            <!-- Price -->
            <div class="mb-6">
              <div class="flex items-baseline space-x-3">
                <span class="text-4xl font-black text-gray-900 dark:text-white">{{ currencyService.formatPrice(product.price) }}</span>
                <span *ngIf="product.compareAtPrice" class="text-xl text-gray-400 line-through">
                  {{ currencyService.formatPrice(product.compareAtPrice) }}
                </span>
              </div>
              <div *ngIf="product.compareAtPrice" class="mt-2">
                <span class="inline-block px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                  -{{ getDiscountPercentage() }}% de réduction
                </span>
              </div>
            </div>

            <!-- Description -->
            <div class="mb-6">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ product.shortDescription || product.description }}
              </p>
            </div>

            <!-- Stock Status -->
            <div class="mb-6">
              <div *ngIf="product.stock > 0" class="flex items-center space-x-2 text-green-600">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span class="font-semibold">En stock ({{ product.stock }} disponibles)</span>
              </div>
              <div *ngIf="product.stock === 0" class="flex items-center space-x-2 text-red-600">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                <span class="font-semibold">Rupture de stock</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-auto space-y-3">
              <!-- Add to Cart -->
              <button
                (click)="addToCart()"
                [disabled]="product.stock === 0"
                class="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span>{{ product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier' }}</span>
              </button>

              <!-- View Full Details -->
              <a
                [routerLink]="['/products', product.slug]"
                (click)="close()"
                class="w-full py-4 border-2 border-purple-600 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Voir les détails complets</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class QuickViewModalComponent implements OnInit {
  @Input() product: Product | null = null;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();

  selectedImage = '';
  selectedImageIndex = 0;

  constructor(
    private cartService: CartService,
    public currencyService: CurrencyService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.product) {
      this.selectedImage = this.getProductImages()[0] || '/assets/logo.png';
    }
  }

  ngOnChanges(): void {
    if (this.product) {
      this.selectedImage = this.getProductImages()[0] || '/assets/logo.png';
      this.selectedImageIndex = 0;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close();
  }

  close(): void {
    this.isOpen = false;
    this.closeModal.emit();
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
    this.selectedImage = this.getProductImages()[index];
  }

  getProductImages(): string[] {
    if (!this.product || !this.product.images || this.product.images.length === 0) {
      return ['/assets/logo.png'];
    }

    return this.product.images.map(img => {
      if (typeof img === 'string') {
        return img;
      }
      return (img as any)?.url || '/assets/logo.png';
    });
  }

  getDiscountPercentage(): number {
    if (!this.product || !this.product.compareAtPrice) return 0;
    return Math.round(((this.product.compareAtPrice - this.product.price) / this.product.compareAtPrice) * 100);
  }

  async addToCart(): Promise<void> {
    if (!this.product || this.product.stock === 0) return;

    await this.cartService.addToCart(this.product, 1);
  }
}

