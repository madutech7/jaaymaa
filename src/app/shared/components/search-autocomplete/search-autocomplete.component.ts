import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-search-autocomplete',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="relative w-full group">
      <!-- Search Input -->
      <input
        #searchInput
        type="text"
        [(ngModel)]="searchQuery"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (input)="onSearch()"
        (keydown.enter)="goToSearchPage()"
        (keydown.arrowdown)="navigateResults(1)"
        (keydown.arrowup)="navigateResults(-1)"
        (keydown.escape)="closeResults()"
        placeholder="Rechercher des produits premium..."
        class="w-full px-6 py-3.5 pl-14 pr-32 rounded-2xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900 transition-all outline-none bg-white/50 backdrop-blur-sm"
      />
      
      <!-- Search Icon -->
      <svg class="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>

      <!-- Loading Spinner -->
      <div *ngIf="isLoading" class="absolute right-28 top-1/2 transform -translate-y-1/2">
        <div class="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
      </div>

      <!-- Search Button -->
      <button 
        (click)="goToSearchPage()"
        class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
      >
        Rechercher
      </button>

      <!-- Autocomplete Dropdown -->
      <div 
        *ngIf="showResults && (results.length > 0 || recentSearches.length > 0 || searchQuery.length > 0)"
        class="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[500px] overflow-y-auto z-50 animate-scaleIn"
      >
        <!-- Recent Searches -->
        <div *ngIf="recentSearches.length > 0 && searchQuery.length === 0" class="p-3 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400">Recherches récentes</h3>
            <button (click)="clearHistory()" class="text-xs text-purple-600 hover:text-purple-700">Effacer</button>
          </div>
          <div class="space-y-1">
            <button
              *ngFor="let search of recentSearches"
              (click)="selectSearch(search)"
              class="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ search }}</span>
            </button>
          </div>
        </div>

        <!-- Search Results -->
        <div *ngIf="results.length > 0" class="p-3">
          <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Produits</h3>
          <div class="space-y-1">
            <a
              *ngFor="let product of results; let i = index"
              [routerLink]="['/products', product.slug]"
              (click)="selectProduct(product)"
              [class.bg-purple-50]="i === selectedIndex"
              [class.dark:bg-purple-900/20]="i === selectedIndex"
              class="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
            >
              <!-- Product Image -->
              <div class="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img 
                  [src]="getProductImage(product)" 
                  [alt]="product.name"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform"
                >
              </div>
              
              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate" [innerHTML]="highlightQuery(product.name)"></p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ product.price | currency:'XOF':'symbol':'1.0-0' }}</p>
              </div>

              <!-- Arrow Icon -->
              <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>

        <!-- No Results -->
        <div *ngIf="searchQuery.length > 0 && results.length === 0 && !isLoading" class="p-6 text-center">
          <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm text-gray-500 dark:text-gray-400">Aucun produit trouvé pour "{{ searchQuery }}"</p>
          <button 
            (click)="goToSearchPage()"
            class="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Voir tous les produits →
          </button>
        </div>

        <!-- View All Results -->
        <div *ngIf="results.length > 0" class="p-3 border-t border-gray-100 dark:border-gray-700">
          <button
            (click)="goToSearchPage()"
            class="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            Voir tous les résultats ({{ totalResults }})
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SearchAutocompleteComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;

  searchQuery = '';
  results: Product[] = [];
  recentSearches: string[] = [];
  showResults = false;
  isLoading = false;
  selectedIndex = -1;
  totalResults = 0;

  private searchSubject = new Subject<string>();
  private subscription?: Subscription;
  private readonly RECENT_SEARCHES_KEY = 'shoplux-recent-searches';
  private readonly MAX_RECENT = 5;

  constructor(
    private productService: ProductService,
    private router: Router,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.loadRecentSearches();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private setupSearch(): void {
    this.subscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.length < 2) {
            this.results = [];
            this.isLoading = false;
            return [];
          }
          this.isLoading = true;
          return this.productService.searchProducts(query, 5);
        })
      )
      .subscribe(products => {
        this.results = products;
        this.isLoading = false;
        this.selectedIndex = -1;
        
        // Track search in analytics
        if (this.searchQuery.length > 0) {
          this.analyticsService.trackSearch(this.searchQuery, products.length);
        }
      });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onFocus(): void {
    this.showResults = true;
  }

  onBlur(): void {
    // Delay to allow click events to fire
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }

  closeResults(): void {
    this.showResults = false;
    this.searchInput?.nativeElement.blur();
  }

  navigateResults(direction: number): void {
    if (this.results.length === 0) return;

    this.selectedIndex += direction;
    
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.results.length - 1;
    } else if (this.selectedIndex >= this.results.length) {
      this.selectedIndex = 0;
    }
  }

  selectProduct(product: Product): void {
    this.saveToHistory(this.searchQuery);
    this.showResults = false;
    this.searchQuery = '';
    
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

  selectSearch(search: string): void {
    this.searchQuery = search;
    this.goToSearchPage();
  }

  goToSearchPage(): void {
    if (this.searchQuery.trim()) {
      this.saveToHistory(this.searchQuery);
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery }
      });
      this.searchQuery = '';
      this.showResults = false;
    }
  }

  clearHistory(): void {
    this.recentSearches = [];
    localStorage.removeItem(this.RECENT_SEARCHES_KEY);
  }

  private saveToHistory(query: string): void {
    if (!query.trim()) return;

    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(s => s !== query);
    
    // Add to beginning
    this.recentSearches.unshift(query);
    
    // Keep only MAX_RECENT
    this.recentSearches = this.recentSearches.slice(0, this.MAX_RECENT);
    
    // Save to localStorage
    localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
  }

  private loadRecentSearches(): void {
    const saved = localStorage.getItem(this.RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        this.recentSearches = JSON.parse(saved);
      } catch {
        this.recentSearches = [];
      }
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

  highlightQuery(text: string): string {
    if (!this.searchQuery) return text;
    
    const regex = new RegExp(`(${this.searchQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
  }
}

