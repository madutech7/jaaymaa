import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { LazyImageComponent } from '../../shared/components/lazy-image/lazy-image.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { CurrencyService } from '../../core/services/currency.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LazyImageComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  featuredProducts: Product[] = [];
  newArrivals: Product[] = [];
  bestSellers: Product[] = [];
  isLoading = true;
  Math = Math;
  private autoSlideInterval: any;
  private readonly AUTO_SLIDE_DURATION = 3000; // 3 secondes

  banners = [
    {
      title: 'Collection Été 2025',
      subtitle: 'Découvrez nos nouveautés',
      discount: '30',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      link: '/products?category=summer'
    },
    {
      title: 'Offres Spéciales',
      subtitle: 'Jusqu\'à -50% sur une sélection',
      discount: '50',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
      link: '/products?sale=true'
    }
  ];

  sliderItems = [
    {
      name: 'Collection Premium 2025',
      description: 'Découvrez notre sélection exclusive de produits haut de gamme pour un style d\'exception.',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop',
      link: '/products'
    },
    {
      name: 'Soldes d\'Hiver',
      description: 'Profitez de réductions exceptionnelles jusqu\'à -50% sur une sélection de produits.',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=1080&fit=crop',
      link: '/products?sale=true'
    },
    {
      name: 'Nouveautés Tech',
      description: 'Les dernières innovations technologiques pour votre quotidien connecté.',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920&h=1080&fit=crop',
      link: '/products?category=electronics'
    },
    {
      name: 'Mode & Style',
      description: 'Affirmez votre personnalité avec nos collections mode tendance et intemporelle.',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop',
      link: '/products?category=fashion'
    },
    {
      name: 'Maison & Déco',
      description: 'Transformez votre intérieur avec nos produits design et fonctionnels.',
      image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1920&h=1080&fit=crop',
      link: '/products?category=home'
    },
    {
      name: 'Livraison Gratuite',
      description: 'Profitez de la livraison gratuite dès 50 000 FCFA d\'achat partout au Sénégal.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&h=1080&fit=crop',
      link: '/products'
    }
  ];

  categories = [
    {
      name: 'Électronique',
      slug: 'electronics',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
    },
    {
      name: 'Mode',
      slug: 'fashion',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'
    },
    {
      name: 'Maison',
      slug: 'home',
      image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'
    },
    {
      name: 'Sport',
      slug: 'sport',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400'
    },
    {
      name: 'Beauté',
      slug: 'beauty',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'
    }
  ];

  currentBannerIndex = 0;

  constructor(
    private productService: ProductService,
    private analyticsService: AnalyticsService,
    private router: Router,
    public currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.startBannerRotation();
    this.startAutoSlide();
    
    // Track page view
    this.analyticsService.trackCustomEvent('page_view', {
      page_title: 'Accueil',
      page_location: window.location.href,
      content_group: 'home'
    });
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  nextSlide() {
    const slide = document.querySelector('.slide');
    if (slide) {
      const items = slide.querySelectorAll('.item');
      if (items.length > 0) {
        slide.appendChild(items[0]);
      }
    }
    // Réinitialiser le défilement automatique après une navigation manuelle
    this.restartAutoSlide();
  }

  prevSlide() {
    const slide = document.querySelector('.slide');
    if (slide) {
      const items = slide.querySelectorAll('.item');
      if (items.length > 0) {
        slide.prepend(items[items.length - 1]);
      }
    }
    // Réinitialiser le défilement automatique après une navigation manuelle
    this.restartAutoSlide();
  }

  startAutoSlide() {
    this.stopAutoSlide(); // S'assurer qu'il n'y a pas d'intervalle en cours
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, this.AUTO_SLIDE_DURATION);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  restartAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  pauseAutoSlide() {
    this.stopAutoSlide();
  }

  resumeAutoSlide() {
    this.startAutoSlide();
  }

  goToSlide(index: number) {
    const slide = document.querySelector('.slide');
    if (slide) {
      const items = slide.querySelectorAll('.item');
      if (items.length > 0 && index < items.length) {
        // Move the selected slide to position 2 (active position)
        const targetItem = items[index];
        const currentActive = items[1];
        
        if (targetItem && currentActive) {
          // Swap positions
          if (index > 1) {
            // Move items before target to end
            for (let i = 1; i < index; i++) {
              slide.appendChild(items[i]);
            }
          } else if (index < 1) {
            // Move items after target to beginning
            for (let i = items.length - 1; i > index; i--) {
              slide.prepend(items[i]);
            }
          }
        }
      }
    }
    // Réinitialiser le défilement automatique après un clic sur un indicateur
    this.restartAutoSlide();
  }

  navigateToSlide(link: string) {
    this.router.navigateByUrl(link);
    this.analyticsService.trackLinkClick('Slider CTA', link, 'banner');
  }

  async loadProducts() {
    try {
      this.isLoading = true;
      const [featured, newArrivals, bestSellers] = await Promise.all([
        this.productService.getFeaturedProducts(),
        this.productService.getNewArrivals(),
        this.productService.getBestSellers()
      ]);

      this.featuredProducts = featured;
      this.newArrivals = newArrivals;
      this.bestSellers = bestSellers;
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.isLoading = false;
    }
  }

  startBannerRotation() {
    setInterval(() => {
      this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
    }, 3000);
  }

  nextBanner() {
    this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
  }

  prevBanner() {
    this.currentBannerIndex = (this.currentBannerIndex - 1 + this.banners.length) % this.banners.length;
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

  onProductClick(product: Product) {
    // Track product view
    this.analyticsService.trackViewItem({
      item_id: product.id.toString(),
      item_name: product.name,
      category: product.category?.name || 'Général',
      price: product.price,
      currency: 'XOF',
      item_brand: 'JAAYMAA',
      item_variant: product.variants?.[0]?.name
    });
  }

  onExploreClick() {
    this.analyticsService.trackLinkClick('Explorer', '/products', 'cta');
  }

  onLearnMoreClick() {
    this.analyticsService.trackLinkClick('En savoir plus', '#about', 'cta');
  }

  scrollToProducts() {
    const element = document.getElementById('products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.analyticsService.trackLinkClick('Scroll to products', '#products', 'cta');
    }
  }
}

