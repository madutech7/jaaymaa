import { Component, OnInit, HostListener, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { User } from '../../../core/models/user.model';
import { Category } from '../../../core/models/product.model';
import { Product } from '../../../core/models/product.model';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentUser: User | null = null;
  cartItemCount = 0;
  categories: Category[] = [];
  searchQuery = '';
  showMobileMenu = false;
  showUserMenu = false;
  showSearchBar = false;
  showSearchSuggestions = false;
  searchResults: Product[] = [];
  isLoadingSearch = false;
  recentSearches: string[] = [];
  
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private readonly RECENT_SEARCHES_KEY = 'shoplux-recent-searches';
  private readonly MAX_RECENT = 5;

  constructor(
    public authService: AuthService,
    public cartService: CartService,
    private productService: ProductService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );

    this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
      }
    );

    this.cartService.cart$.subscribe(
      cart => this.cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    );

    this.productService.categories$.subscribe(
      categories => this.categories = categories.filter(c => !c.parentId).slice(0, 6)
    );

    this.loadRecentSearches();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  goToLogin(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    // Get current URL to redirect back after login
    const currentUrl = this.router.url;
    // Only add returnUrl if not already on login/register page
    if (!currentUrl.includes('/auth/')) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: currentUrl } });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  private setupSearch(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.length < 2) {
            this.searchResults = [];
            this.isLoadingSearch = false;
            return Promise.resolve([]);
          }
          this.isLoadingSearch = true;
          return this.productService.searchProducts(query, 5);
        })
      )
      .subscribe(products => {
        this.searchResults = products;
        this.isLoadingSearch = false;
      });
  }

  onSearchInput(): void {
    if (this.searchQuery.trim().length >= 2) {
      this.searchSubject.next(this.searchQuery);
      this.showSearchSuggestions = true;
    } else {
      this.searchResults = [];
      this.showSearchSuggestions = this.searchQuery.length > 0 || this.recentSearches.length > 0;
    }
  }

  onSearchFocus(): void {
    this.showSearchSuggestions = true;
  }

  onSearchBlur(): void {
    // Delay to allow click events to fire
    setTimeout(() => {
      this.showSearchSuggestions = false;
      if (!this.searchQuery.trim()) {
        this.showSearchBar = false;
      }
    }, 200);
  }

  private loadRecentSearches(): void {
    try {
      const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (stored) {
        this.recentSearches = JSON.parse(stored).slice(0, this.MAX_RECENT);
      }
    } catch (e) {
      this.recentSearches = [];
    }
  }

  private saveToHistory(query: string): void {
    if (!query.trim()) return;
    
    const trimmed = query.trim();
    this.recentSearches = [
      trimmed,
      ...this.recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())
    ].slice(0, this.MAX_RECENT);
    
    try {
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (e) {
      // Ignore storage errors
    }
  }

  selectRecentSearch(search: string): void {
    this.searchQuery = search;
    this.onSearch();
  }

  selectProduct(product: Product): void {
    this.saveToHistory(this.searchQuery);
    this.router.navigate(['/products', product.slug]);
    this.searchQuery = '';
    this.showSearchSuggestions = false;
    this.showSearchBar = false;
  }

  clearRecentSearches(): void {
    this.recentSearches = [];
    try {
      localStorage.removeItem(this.RECENT_SEARCHES_KEY);
    } catch (e) {
      // Ignore storage errors
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
    return firstImage?.url || '/assets/logo.png';
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.saveToHistory(this.searchQuery);
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchQuery } 
      });
      this.searchQuery = '';
      this.showSearchBar = false;
      this.showSearchSuggestions = false;
    }
  }

  async logout() {
    await this.authService.signOut();
    this.showUserMenu = false;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleSearchBar() {
    this.showSearchBar = !this.showSearchBar;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Fermer le menu utilisateur si on clique en dehors
    if (this.showUserMenu && !this.elementRef.nativeElement.contains(event.target)) {
      this.showUserMenu = false;
    }
    
    // Fermer le menu mobile si on clique en dehors
    if (this.showMobileMenu && !this.elementRef.nativeElement.contains(event.target)) {
      this.showMobileMenu = false;
    }
    
    // Fermer la barre de recherche si on clique en dehors
    if (this.showSearchBar && !this.elementRef.nativeElement.contains(event.target)) {
      this.showSearchBar = false;
    }
  }

}

