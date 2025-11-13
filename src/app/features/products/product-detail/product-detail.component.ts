import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ReviewService, Review, ReviewStats } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  selectedImage = 0;
  quantity = 1;
  isLoading = true;
  relatedProducts: Product[] = [];
  recentlyViewedProducts: Product[] = [];
  isInWishlist = false;
  activeTab: 'description' | 'specifications' | 'reviews' | 'shipping' = 'description';
  Math = Math;
  Object = Object;

  // Enhanced UI features
  selectedSize: string | null = null;
  selectedColor: string | null = null;
  showSizeGuide = false;
  isImageZoomed = false;
  isSticky = false;
  
  // Available sizes and colors (will be populated from product variants)
  availableSizes: string[] = [];
  availableColors: { name: string; value: string; image?: string }[] = [];

  // Reviews
  reviews: Review[] = [];
  reviewStats: ReviewStats | null = null;
  showReviewForm = false;
  canReview = false;
  reviewFormData = {
    rating: 5,
    title: '',
    comment: ''
  };

  tabs = [
    { id: 'description' as const, label: 'Description' },
    { id: 'specifications' as const, label: 'Spécifications' },
    { id: 'reviews' as const, label: 'Avis clients' },
    { id: 'shipping' as const, label: 'Livraison & Retours' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    public currencyService: CurrencyService,
    private reviewService: ReviewService,
    public authService: AuthService
  ,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      this.loadProduct(slug);
    });

    // Listen to scroll for sticky add to cart
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll.bind(this));
    }
  }

  onScroll() {
    if (typeof window !== 'undefined') {
      this.isSticky = window.scrollY > 800;
    }
  }

  async loadProduct(slug: string) {
    try {
      this.isLoading = true;
      this.product = await this.productService.getProductBySlug(slug);
      
      if (this.product) {
        // Load related products, wishlist check, and reviews in parallel for better performance
        const [
          relatedProducts, 
          inWishlist, 
          reviews, 
          stats, 
          canReviewResult
        ] = await Promise.all([
          // Related products from same category
          this.productService.getProducts({
            categoryId: this.product.categoryId,
            limit: 8
          }),
          this.wishlistService.isInWishlist(this.product.id),
          this.reviewService.getProductReviews(this.product.id).catch(() => []),
          this.reviewService.getProductReviewStats(this.product.id).catch(() => null),
          this.reviewService.canUserReview(this.product.id).catch(() => false)
        ]);
        
        this.relatedProducts = relatedProducts.filter((p: any) => p.id !== this.product!.id).slice(0, 4);
        
        // Recently viewed - get from localStorage
        this.loadRecentlyViewed();
        // Save current product to recently viewed
        this.saveToRecentlyViewed(this.product.id);
        
        this.isInWishlist = inWishlist;
        this.reviews = reviews;
        this.reviewStats = stats;
        this.canReview = typeof canReviewResult === 'boolean' ? canReviewResult : false;

        // Extract sizes and colors from variants
        this.extractVariants();
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      this.isLoading = false;
    }
  }

  extractVariants() {
    if (!this.product?.variants) {
      // Default sizes if no variants
      this.availableSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
      this.availableColors = [
        { name: 'Noir', value: '#000000' },
        { name: 'Blanc', value: '#FFFFFF' },
        { name: 'Gris', value: '#808080' }
      ];
      return;
    }

    // Extract unique sizes and colors from variants
    const sizeSet = new Set<string>();
    const colorMap = new Map<string, { name: string; value: string }>();

    this.product.variants.forEach(variant => {
      variant.options.forEach(option => {
        if (option.name.toLowerCase() === 'size' || option.name.toLowerCase() === 'taille') {
          sizeSet.add(option.value);
        }
        if (option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'couleur') {
          colorMap.set(option.value, { name: option.value, value: option.value });
        }
      });
    });

    this.availableSizes = Array.from(sizeSet);
    this.availableColors = Array.from(colorMap.values());
  }

  selectSize(size: string) {
    this.selectedSize = size;
  }

  selectColor(color: { name: string; value: string }) {
    this.selectedColor = color.name;
    // You could also change the main image based on color
  }

  toggleSizeGuide() {
    this.showSizeGuide = !this.showSizeGuide;
  }

  selectImage(index: number) {
    this.selectedImage = index;
  }

  nextImage() {
    if (this.product && this.product.images.length > 0) {
      this.selectedImage = (this.selectedImage + 1) % this.product.images.length;
    }
  }

  previousImage() {
    if (this.product && this.product.images.length > 0) {
      this.selectedImage = this.selectedImage === 0 
        ? this.product.images.length - 1 
        : this.selectedImage - 1;
    }
  }

  increaseQuantity() {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  async addToCart() {
    if (this.product) {
      await this.cartService.addToCart(this.product, this.quantity);
    }
  }

  async buyNow() {
    if (this.product) {
      await this.cartService.addToCart(this.product, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }

  async toggleWishlist() {
    if (!this.product) return;

    if (this.isInWishlist) {
      const result = await this.wishlistService.removeFromWishlist(this.product.id);
      if (result.success) {
        this.isInWishlist = false;
      }
    } else {
      const result = await this.wishlistService.addToWishlist(this.product.id);
      if (result.success) {
        this.isInWishlist = true;
      }
    }
  }

  getDiscountPercentage(): number {
    if (!this.product?.compareAtPrice || this.product.compareAtPrice <= this.product.price) return 0;
    return Math.round(((this.product.compareAtPrice - this.product.price) / this.product.compareAtPrice) * 100);
  }

  getProductImage(product: Product, index: number = 0): string {
    if (product.images && product.images.length > index) {
      const image = product.images[index];
      if (typeof image === 'string') {
        return image;
      }
      return image?.url || '/assets/logo.png';
    }
    return '/assets/logo.png';
  }

  // Review methods
  async loadReviews() {
    if (!this.product) return;
    try {
      // Load reviews and stats in parallel
      const [reviews, stats] = await Promise.all([
        this.reviewService.getProductReviews(this.product.id),
        this.reviewService.getProductReviewStats(this.product.id)
      ]);
      this.reviews = reviews;
      this.reviewStats = stats;
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }

  async checkCanReview() {
    if (!this.product) return;
    try {
      this.canReview = await this.reviewService.canUserReview(this.product.id);
    } catch (error) {
      console.error('Error checking can review:', error);
      this.canReview = false;
    }
  }

  toggleReviewForm() {
    if (!this.authService.currentUser) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.showReviewForm = !this.showReviewForm;
  }

  async submitReview() {
    if (!this.product) return;

    if (!this.reviewFormData.title || !this.reviewFormData.comment) {
      this.toastService.warning('Veuillez remplir tous les champs');
      return;
    }

    const result = await this.reviewService.createReview({
      productId: this.product.id,
      rating: this.reviewFormData.rating,
      title: this.reviewFormData.title,
      comment: this.reviewFormData.comment
    });

    if (result.success) {
      this.showReviewForm = false;
      this.reviewFormData = { rating: 5, title: '', comment: '' };
      await this.loadReviews();
      await this.checkCanReview();
      this.toastService.success('Votre avis a été publié avec succès !');
    } else {
      this.toastService.info('Erreur: ' + result.error);
    }
  }

  getRatingArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  getRatingPercentage(rating: number): number {
    if (!this.reviewStats || this.reviewStats.totalReviews === 0) return 0;
    return (this.reviewStats.ratingDistribution[rating] / this.reviewStats.totalReviews) * 100;
  }

  // Recently viewed products management
  saveToRecentlyViewed(productId: string) {
    if (typeof window === 'undefined') return;
    
    try {
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      // Remove if already exists
      const filtered = recentlyViewed.filter((id: string) => id !== productId);
      // Add to beginning
      filtered.unshift(productId);
      // Keep only last 8
      const limited = filtered.slice(0, 8);
      localStorage.setItem('recentlyViewed', JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving to recently viewed:', error);
    }
  }

  async loadRecentlyViewed() {
    if (typeof window === 'undefined') return;
    
    try {
      const recentlyViewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      if (recentlyViewedIds.length === 0) return;
      
      // Load all recently viewed products
      const allProducts = await this.productService.getProducts({ limit: 100 });
      this.recentlyViewedProducts = allProducts
        .filter(p => recentlyViewedIds.includes(p.id) && p.id !== this.product?.id)
        .slice(0, 4);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }

}
