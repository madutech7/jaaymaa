import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private measurementId = environment.ga4.measurementId;

  constructor(private router: Router) {
    this.initializeGoogleAnalytics();
    this.trackPageViews();
  }

  private initializeGoogleAnalytics() {
    // Charger le script Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialiser gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: false // On gère manuellement les page views
    });
  }

  private trackPageViews() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        gtag('config', this.measurementId, {
          page_path: event.urlAfterRedirects,
          page_title: document.title,
          page_location: window.location.href
        });
      });
  }

  // ===== ÉVÉNEMENTS E-COMMERCE =====

  /**
   * Track un produit vu
   */
  trackViewItem(item: {
    item_id: string;
    item_name: string;
    category: string;
    price: number;
    currency: string;
    item_brand?: string;
    item_variant?: string;
  }) {
    gtag('event', 'view_item', {
      currency: item.currency,
      value: item.price,
      items: [{
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        price: item.price,
        currency: item.currency,
        item_brand: item.item_brand,
        item_variant: item.item_variant
      }]
    });
  }

  /**
   * Track un produit ajouté au panier
   */
  trackAddToCart(item: {
    item_id: string;
    item_name: string;
    category: string;
    price: number;
    quantity: number;
    currency: string;
    item_brand?: string;
    item_variant?: string;
  }) {
    gtag('event', 'add_to_cart', {
      currency: item.currency,
      value: item.price * item.quantity,
      items: [{
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        currency: item.currency,
        item_brand: item.item_brand,
        item_variant: item.item_variant
      }]
    });
  }

  /**
   * Track un produit retiré du panier
   */
  trackRemoveFromCart(item: {
    item_id: string;
    item_name: string;
    category: string;
    price: number;
    quantity: number;
    currency: string;
  }) {
    gtag('event', 'remove_from_cart', {
      currency: item.currency,
      value: item.price * item.quantity,
      items: [{
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        currency: item.currency
      }]
    });
  }

  /**
   * Track le début du processus de commande
   */
  trackBeginCheckout(items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    price: number;
    quantity: number;
    currency: string;
  }>, value: number, currency: string) {
    gtag('event', 'begin_checkout', {
      currency: currency,
      value: value,
      items: items
    });
  }

  /**
   * Track une commande complétée
   */
  trackPurchase(transaction: {
    transaction_id: string;
    value: number;
    currency: string;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      price: number;
      quantity: number;
      currency: string;
    }>;
    shipping?: number;
    tax?: number;
  }) {
    gtag('event', 'purchase', {
      transaction_id: transaction.transaction_id,
      currency: transaction.currency,
      value: transaction.value,
      shipping: transaction.shipping || 0,
      tax: transaction.tax || 0,
      items: transaction.items
    });
  }

  // ===== ÉVÉNEMENTS GÉNÉRAUX =====

  /**
   * Track une recherche
   */
  trackSearch(searchTerm: string, resultsCount?: number) {
    gtag('event', 'search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  /**
   * Track un clic sur un lien
   */
  trackLinkClick(linkText: string, linkUrl: string, linkCategory?: string) {
    gtag('event', 'click', {
      link_text: linkText,
      link_url: linkUrl,
      link_category: linkCategory || 'general'
    });
  }

  /**
   * Track un scroll
   */
  trackScroll(depth: number) {
    gtag('event', 'scroll', {
      scroll_depth: depth
    });
  }

  /**
   * Track un engagement (temps sur page)
   */
  trackEngagement(timeOnPage: number, pageTitle: string) {
    gtag('event', 'engagement_time_msec', {
      engagement_time_msec: timeOnPage,
      page_title: pageTitle
    });
  }

  /**
   * Track un événement personnalisé
   */
  trackCustomEvent(eventName: string, parameters?: { [key: string]: any }) {
    gtag('event', eventName, parameters);
  }

  /**
   * Track une erreur
   */
  trackError(errorMessage: string, errorLocation?: string) {
    gtag('event', 'exception', {
      description: errorMessage,
      fatal: false,
      custom_map: {
        error_location: errorLocation
      }
    });
  }

  /**
   * Track un utilisateur connecté
   */
  trackUserLogin(userId: string, method: string = 'email') {
    gtag('config', this.measurementId, {
      user_id: userId
    });
    
    gtag('event', 'login', {
      method: method
    });
  }

  /**
   * Track un utilisateur déconnecté
   */
  trackUserLogout() {
    gtag('event', 'logout');
  }

  /**
   * Track un abonnement newsletter
   */
  trackNewsletterSignup(method: string = 'email') {
    gtag('event', 'sign_up', {
      method: method
    });
  }

  /**
   * Track un partage social
   */
  trackSocialShare(platform: string, content: string) {
    gtag('event', 'share', {
      method: platform,
      content_type: content
    });
  }
}

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: Function;
  }
}