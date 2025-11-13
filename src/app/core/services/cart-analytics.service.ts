import { Injectable } from '@angular/core';
import { AnalyticsService } from './analytics.service';
import { CartService } from './cart.service';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartAnalyticsService {

  constructor(
    private analyticsService: AnalyticsService,
    private cartService: CartService
  ) {
    this.setupCartTracking();
  }

  private setupCartTracking() {
    // Track cart changes - using cart service methods instead of observable
    // This will be called manually when needed
  }

  trackCartView(items: any[]) {
    const totalValue = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    this.analyticsService.trackCustomEvent('view_cart', {
      currency: 'XOF',
      value: totalValue,
      items: items.map(item => ({
        item_id: item.product.id.toString(),
        item_name: item.product.name,
        category: item.product.category?.name || 'Général',
        price: item.product.price,
        quantity: item.quantity,
        currency: 'XOF'
      }))
    });
  }

  trackBeginCheckout(items: any[]) {
    const totalValue = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    this.analyticsService.trackBeginCheckout(
      items.map(item => ({
        item_id: item.product.id.toString(),
        item_name: item.product.name,
        category: item.product.category?.name || 'Général',
        price: item.product.price,
        quantity: item.quantity,
        currency: 'XOF'
      })),
      totalValue,
      'XOF'
    );
  }

  trackPurchase(orderData: {
    orderId: string;
    items: any[];
    total: number;
    shipping?: number;
    tax?: number;
  }) {
    this.analyticsService.trackPurchase({
      transaction_id: orderData.orderId,
      value: orderData.total,
      currency: 'XOF',
      shipping: orderData.shipping || 0,
      tax: orderData.tax || 0,
      items: orderData.items.map(item => ({
        item_id: item.product.id.toString(),
        item_name: item.product.name,
        category: item.product.category?.name || 'Général',
        price: item.product.price,
        quantity: item.quantity,
        currency: 'XOF'
      }))
    });
  }
}
