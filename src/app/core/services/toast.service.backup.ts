import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cart, CartItem, Coupon } from '../models/cart.model';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>(this.getEmptyCart());
  public cart$ = this.cartSubject.asObservable();

  private readonly CART_STORAGE_KEY = 'shoplux_cart';
  private readonly SHIPPING_COST = 9.99;
  private readonly FREE_SHIPPING_THRESHOLD = 100;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    this.loadCart();

    // Sync cart when user logs in/out
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.syncCartWithServer();
      }
    });
  }

  private getEmptyCart(): Cart {
    return {
      id: this.generateCartId(),
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      updatedAt: new Date()
    };
  }

  private loadCart() {
    const savedCart = localStorage.getItem(this.CART_STORAGE_KEY);
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      this.cartSubject.next(cart);
    }
  }

  private saveCart(cart: Cart) {
    localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
    this.cartSubject.next(cart);
  }

  async addToCart(product: any, quantity: number = 1, variant?: any) {
    const cart = this.cartSubject.value;
    
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === product.id && 
              JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        id: this.generateItemId(),
        productId: product.id,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0]?.url || '',
          slug: product.slug,
          stock: product.stock
        },
        quantity,
        selectedVariant: variant,
        price: product.price
      };
      cart.items.push(newItem);
    }

    this.calculateTotals(cart);
    this.saveCart(cart);

    if (this.authService.isAuthenticated) {
      await this.syncCartWithServer();
    }
  }

  async removeFromCart(itemId: string) {
    const cart = this.cartSubject.value;
    cart.items = cart.items.filter(item => item.id !== itemId);
    this.calculateTotals(cart);
    this.saveCart(cart);

    if (this.authService.isAuthenticated) {
      await this.syncCartWithServer();
    }
  }

  async updateQuantity(itemId: string, quantity: number) {
    const cart = this.cartSubject.value;
    const item = cart.items.find(i => i.id === itemId);
    
    if (item) {
      if (quantity <= 0) {
        await this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        this.calculateTotals(cart);
        this.saveCart(cart);

        if (this.authService.isAuthenticated) {
          await this.syncCartWithServer();
        }
      }
    }
  }

  async applyCoupon(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await this.supabase.client
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { success: false, message: 'Code promo invalide' };
      }

      const coupon: Coupon = {
        id: data.id,
        code: data.code,
        type: data.type,
        value: data.value,
        minPurchase: data.min_purchase,
        maxDiscount: data.max_discount,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        usageLimit: data.usage_limit,
        usageCount: data.usage_count,
        isActive: data.is_active
      };

      // Validate coupon
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return { success: false, message: 'Code promo expiré' };
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return { success: false, message: 'Code promo limite atteinte' };
      }

      const cart = this.cartSubject.value;

      if (coupon.minPurchase && cart.subtotal < coupon.minPurchase) {
        return { 
          success: false, 
          message: `Achat minimum de ${coupon.minPurchase}€ requis` 
        };
      }

      cart.couponCode = coupon.code;
      this.calculateTotals(cart, coupon);
      this.saveCart(cart);

      return { success: true, message: 'Code promo appliqué avec succès!' };
    } catch (error) {
      return { success: false, message: 'Erreur lors de l\'application du code' };
    }
  }

  async removeCoupon() {
    const cart = this.cartSubject.value;
    cart.couponCode = undefined;
    this.calculateTotals(cart);
    this.saveCart(cart);
  }

  private calculateTotals(cart: Cart, coupon?: Coupon) {
    // Calculate subtotal
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    // Calculate discount
    if (coupon) {
      if (coupon.type === 'percentage') {
        cart.discount = cart.subtotal * (coupon.value / 100);
        if (coupon.maxDiscount) {
          cart.discount = Math.min(cart.discount, coupon.maxDiscount);
        }
      } else {
        cart.discount = coupon.value;
      }
    } else {
      cart.discount = 0;
    }

    // Calculate shipping
    const subtotalAfterDiscount = cart.subtotal - cart.discount;
    cart.shipping = subtotalAfterDiscount >= this.FREE_SHIPPING_THRESHOLD 
      ? 0 
      : this.SHIPPING_COST;

    // No tax
    cart.tax = 0;

    // Calculate total
    cart.total = subtotalAfterDiscount + cart.shipping;
    cart.updatedAt = new Date();
  }

  async clearCart() {
    const cart = this.getEmptyCart();
    this.saveCart(cart);
  }

  private async syncCartWithServer() {
    const cart = this.cartSubject.value;
    const user = this.authService.currentUser;

    if (!user) return;

    try {
      await this.supabase.client
        .from('carts')
        .upsert({
          user_id: user.id,
          items: cart.items,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  }

  private generateCartId(): string {
    return 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateItemId(): string {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  get cart(): Cart {
    return this.cartSubject.value;
  }

  get itemCount(): number {
    return this.cartSubject.value.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

