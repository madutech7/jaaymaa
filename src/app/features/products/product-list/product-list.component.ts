import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductFilter, Category } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ProductCompareService } from '../../../core/services/product-compare.service';
import { LazyImageComponent } from '../../../shared/components/lazy-image/lazy-image.component';
import { QuickViewModalComponent } from '../../../shared/components/quick-view-modal/quick-view-modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LazyImageComponent, QuickViewModalComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, AfterViewChecked {
  products: Product[] = [];
  categories: Category[] = [];
  isLoading = true;
  
  // Quick View Modal
  showQuickView = false;
  selectedProduct: Product | null = null;
  
  // Product Compare
  compareCount = 0;
  
  filter: ProductFilter = {
    page: 1,
    limit: 12,
    sort: 'newest'
  };

  // Pagination
  totalProducts = 0;
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  Math = Math; // Expose Math to template

  // Filter UI state
  selectedCategory: string = '';
  priceRange = { min: 0, max: 1000 };
  selectedBrands: string[] = [];
  availableBrands: string[] = [];
  showFilters = false;
  
  // Cache last filter to detect significant changes
  private lastFilter: ProductFilter | null = null;
  
      // Scroll tracking
      private shouldScrollToTop = false;
      @ViewChild('productsContainer', { static: false }) productsContainer?: ElementRef;
      
      // Flag to prevent infinite loops when updating URL
      private isUpdatingUrl = false;

      constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router,
    public currencyService: CurrencyService,
    private toastService: ToastService,
    private analyticsService: AnalyticsService,
    public compareService: ProductCompareService,
    private viewportScroller: ViewportScroller
  ) {}

  async ngOnInit() {
    // Subscribe to compare count
    this.compareService.compareProducts$.subscribe(products => {
      this.compareCount = products.length;
    });
    
    // Load categories and listen to query params in parallel
    const categoriesPromise = this.loadCategories();
    
      // Listen to query params
      this.route.queryParams.subscribe(async params => {
        // Skip if we're currently updating the URL to avoid infinite loops
        if (this.isUpdatingUrl) {
          return;
        }
        
        // Wait for categories if not loaded yet
        if (this.categories.length === 0) {
          await categoriesPromise;
        }
        
        this.filter.search = params['search'] || undefined;
        
        // Handle category from query params
        const categoryParam = params['category'];
        if (categoryParam) {
          // Try to find category by slug or id
          const category = this.categories.find(c => c.slug === categoryParam || c.id === categoryParam);
          if (category) {
            this.selectedCategory = category.slug;
            this.filter.categoryId = category.id;
          } else {
            // Category not found - clear filter and update URL
            this.selectedCategory = '';
            this.filter.categoryId = undefined;
            // Remove category from URL if it doesn't exist
            this.updateUrl({ category: null });
          }
        } else {
          this.selectedCategory = '';
          this.filter.categoryId = undefined;
        }
        
        this.filter.sort = params['sort'] || 'newest';
        
        // Update price filters from URL
        if (params['min_price']) {
          this.filter.minPrice = Number(params['min_price']);
          this.priceRange.min = this.filter.minPrice;
        } else {
          this.filter.minPrice = undefined;
        }
        
        if (params['max_price']) {
          this.filter.maxPrice = Number(params['max_price']);
          this.priceRange.max = this.filter.maxPrice;
        } else {
          this.filter.maxPrice = undefined;
        }
        
        // Update pagination from URL
        const pageParam = params['page'];
        if (pageParam) {
          this.currentPage = Number(pageParam);
          this.filter.page = this.currentPage;
        } else {
          this.currentPage = 1;
          this.filter.page = 1;
        }
        
        // Load products (cache will be managed in loadProducts based on filter changes)
        await this.loadProducts();
      });
    }

  async loadCategories() {
    // Wait for categories to be loaded
    this.categories = await this.productService.getCategories();
  }

  /**
   * Check if filter changed significantly (not just pagination)
   */
  private hasFilterChanged(newFilter: ProductFilter): boolean {
    if (!this.lastFilter) {
      return true; // First load, clear cache
    }

    // Compare filters excluding page (pagination doesn't need cache clear)
    const compareKeys: (keyof ProductFilter)[] = [
      'categoryId', 'search', 'minPrice', 'maxPrice', 
      'brand', 'status', 'sort', 'limit'
    ];

    for (const key of compareKeys) {
      if (newFilter[key] !== this.lastFilter[key]) {
        return true; // Significant filter change
      }
    }

    return false; // Only pagination changed, keep cache
  }

  async loadProducts() {
    try {
      this.isLoading = true;
      
      // Set current page in filter
      this.filter.page = this.currentPage;
      
      // Create a deep copy of the filter to ensure consistency
      // Remove undefined values to avoid cache key issues
      const filterCopy: ProductFilter = {
        page: this.filter.page,
        limit: this.filter.limit,
        sort: this.filter.sort,
      };
      
      if (this.filter.categoryId) {
        filterCopy.categoryId = this.filter.categoryId;
      }
      if (this.filter.search) {
        filterCopy.search = this.filter.search;
      }
      if (this.filter.minPrice !== undefined) {
        filterCopy.minPrice = this.filter.minPrice;
      }
      if (this.filter.maxPrice !== undefined) {
        filterCopy.maxPrice = this.filter.maxPrice;
      }
      if (this.filter.brand) {
        filterCopy.brand = this.filter.brand;
      }
      if (this.filter.status) {
        filterCopy.status = this.filter.status;
      }
      
      // Load products and count in parallel for better performance
      // Only clear cache if filters changed significantly (not on pagination)
      const shouldClearCache = this.hasFilterChanged(filterCopy);
      if (shouldClearCache) {
        this.productService.clearCache();
      }
      
      // Load products and count in parallel
      const [products, count] = await Promise.all([
        this.productService.getProducts(filterCopy),
        this.productService.getProductCount(filterCopy)
      ]);
      
      // Robust handling: if count is 0 but we have products, use products.length
      // This handles backend count endpoint issues gracefully
      if (products.length > 0 && count === 0) {
        this.totalProducts = products.length;
      } else if (products.length === 0 && count > 0) {
        this.totalProducts = count;
      } else {
        this.totalProducts = count > 0 ? count : products.length;
      }
      
      // Always set products and totalPages after validation
      this.products = products;
      this.totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
      
      // Extract unique brands from loaded products (cache this to avoid recalculation)
      this.availableBrands = [...new Set(this.products
        .map(p => p.brand)
        .filter(b => b) as string[])];
      
      // Store last filter for comparison
      this.lastFilter = { ...filterCopy };
    } catch (error) {
      console.error('Error loading products:', error);
      // On error, reset to safe defaults
      this.totalProducts = 0;
      this.totalPages = 1;
      this.products = [];
      this.toastService?.info('Erreur lors du chargement des produits. Veuillez réessayer.');
    } finally {
      this.isLoading = false;
      // Mark that we should scroll to top after view is checked
      this.shouldScrollToTop = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToTop && !this.isLoading) {
      this.shouldScrollToTop = false;
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        this.scrollToTop();
      });
    }
  }

  private scrollToTop(): void {
    // Try scrolling to container element first if available
    if (this.productsContainer?.nativeElement) {
      this.productsContainer.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Use ViewportScroller
    this.viewportScroller.scrollToPosition([0, 0]);
    
    // Also use window scroll methods as fallback
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Force scroll after a small delay to ensure it works
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      this.viewportScroller.scrollToPosition([0, 0]);
    }, 50);
  }

  async loadTotalCount() {
    try {
      this.totalProducts = await this.productService.getProductCount(this.filter);
      this.totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
    } catch (error) {
      console.error('Error loading total count:', error);
      this.totalProducts = this.products.length;
      this.totalPages = 1;
    }
  }

  onCategoryChange() {
    if (this.selectedCategory) {
      const category = this.categories.find(c => c.slug === this.selectedCategory);
      this.filter.categoryId = category?.id;
    } else {
      this.filter.categoryId = undefined;
    }
    
    this.currentPage = 1;
    this.filter.page = 1;
    
    // Update URL to reflect the category change
    this.updateUrl({
      category: this.selectedCategory || null,
      page: null // Reset page when changing category
    });
    
    // Clear cache and load products
    this.productService.clearCache();
    this.loadProducts();
  }

  onSortChange() {
    this.currentPage = 1;
    this.filter.page = 1;
    
    // Update URL to reflect the sort change
    this.updateUrl({
      sort: this.filter.sort || null,
      page: null // Reset page when changing sort
    });
    
    // Clear cache and load products
    this.productService.clearCache();
    this.loadProducts();
  }

  onPriceRangeChange() {
    this.filter.minPrice = this.priceRange.min;
    this.filter.maxPrice = this.priceRange.max;
    this.currentPage = 1;
    this.filter.page = 1;
    
    // Update URL to reflect the price range change
    this.updateUrl({
      min_price: this.filter.minPrice || null,
      max_price: this.filter.maxPrice || null,
      page: null // Reset page when changing price range
    });
    
    // Clear cache and load products
    this.productService.clearCache();
    this.loadProducts();
  }

  onBrandChange(brand: string, checked: boolean) {
    if (checked) {
      this.selectedBrands.push(brand);
    } else {
      this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    }
    this.filter.brand = this.selectedBrands.length > 0 ? this.selectedBrands : undefined;
    this.currentPage = 1;
    this.filter.page = 1;
    
    // Update URL (reset page when changing brand)
    this.updateUrl({
      page: null
    });
    
    // Clear cache and load products
    this.productService.clearCache();
    this.loadProducts();
  }

  clearFilters() {
    this.selectedCategory = '';
    this.priceRange = { min: 0, max: 1000 };
    this.selectedBrands = [];
    this.currentPage = 1;
    this.filter = {
      page: 1,
      limit: 12,
      sort: 'newest'
    };
    
    // Update URL to clear all filters
    this.updateUrl({
      category: null,
      sort: null,
      min_price: null,
      max_price: null,
      page: null,
      search: null
    });
    
    // Clear cache and load products
    this.productService.clearCache();
    this.loadProducts();
  }

  async addToCart(product: Product, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    await this.cartService.addToCart(product, 1);
  }

  getProductImage(product: Product): string {
    if (!product.images || product.images.length === 0) {
      return '/assets/logo.png';
    }
    
    const firstImage = product.images[0];
    
    // Handle both string URLs and objects with url property
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    
    return firstImage?.url || '/assets/logo.png';
  }

  getDiscountPercentage(product: Product): number {
    if (!product.compareAtPrice) return 0;
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.filter.page = page;
    
    // Update URL with new page
    this.updateUrl({
      page: page > 1 ? page : null
    });
    
    // Load products
    this.loadProducts();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  private updateUrl(queryParams: any): void {
    // Get current params
    const currentParams = { ...this.route.snapshot.queryParams };
    
    // Merge with new params (new params override current ones)
    const mergedParams = { ...currentParams };
    Object.keys(queryParams).forEach(key => {
      const value = queryParams[key];
      if (value === null || value === undefined || value === '') {
        // Remove the key if value is null/undefined/empty
        delete mergedParams[key];
      } else {
        // Update the key with new value
        mergedParams[key] = value;
      }
    });
    
    // Set flag to prevent infinite loop
    this.isUpdatingUrl = true;
    
    // Navigate to update URL (replace all params, not merge)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: mergedParams,
      replaceUrl: false
    }).then(() => {
      // Reset flag after navigation completes
      setTimeout(() => {
        this.isUpdatingUrl = false;
      }, 100);
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      const leftBound = Math.max(1, this.currentPage - 2);
      const rightBound = Math.min(this.totalPages, this.currentPage + 2);
      
      if (leftBound > 1) {
        pages.push(1);
        if (leftBound > 2) {
          pages.push(-1); // Ellipsis
        }
      }
      
      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }
      
      if (rightBound < this.totalPages) {
        if (rightBound < this.totalPages - 1) {
          pages.push(-1); // Ellipsis
        }
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  onProductClick(product: Product) {
    // Track product view
    this.analyticsService.trackViewItem({
      item_id: product.id.toString(),
      item_name: product.name,
      category: product.category?.name || 'Général',
      price: product.price,
      currency: 'XOF',
      item_brand: 'JAAYMAA'
    });
  }

  onSearch(searchTerm: string) {
    if (searchTerm.trim()) {
      this.analyticsService.trackSearch(searchTerm, this.products.length);
    }
  }

  openQuickView(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedProduct = product;
    this.showQuickView = true;
  }

  closeQuickView(): void {
    this.showQuickView = false;
    this.selectedProduct = null;
  }

  toggleCompare(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.compareService.isInComparison(product.id)) {
      this.compareService.removeProduct(product.id);
      this.toastService.info('Produit retiré de la comparaison');
    } else {
      if (this.compareService.addProduct(product)) {
        this.toastService.success('Produit ajouté à la comparaison');
      } else {
        this.toastService.warning('Vous pouvez comparer jusqu\'à 4 produits seulement');
      }
    }
  }

  goToCompare(): void {
    this.router.navigate(['/products/compare']);
  }

  isInComparison(productId: string): boolean {
    return this.compareService.isInComparison(productId);
  }
}

