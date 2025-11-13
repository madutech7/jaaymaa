import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { Order, OrderStatus } from '../models/order.model';
import { Address } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);

  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  async createOrder(
    shippingAddress: Address,
    billingAddress: Address,
    paymentMethod: string,
    notes?: string
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const user = this.authService.currentUser;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const cart = this.cartService.cart;
      if (cart.items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      // Validate addresses
      if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
        return { success: false, error: 'Adresse de livraison incomplète' };
      }

      if (!billingAddress || !billingAddress.street || !billingAddress.city) {
        return { success: false, error: 'Adresse de facturation incomplète' };
      }

      // Don't send order_number - backend will generate it
      // Ensure all numeric values are numbers, not strings
      const orderData = {
        items: cart.items.map(item => ({
          product_id: item.productId,
          product_name: item.product.name,
          product_image: item.product.image,
          price: Number(item.price),
          quantity: Number(item.quantity),
          selected_variant: item.selectedVariant || null
        })),
        subtotal: Number(cart.subtotal) || 0,
        discount: Number(cart.discount) || 0,
        tax: Number(cart.tax) || 0,
        shipping: Number(cart.shipping) || 0,
        total: Number(cart.total) || 0,
        payment_method: paymentMethod || null,
        shipping_address: {
          type: shippingAddress.type || 'shipping',
          first_name: shippingAddress.firstName || '',
          last_name: shippingAddress.lastName || '',
          street: shippingAddress.street || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          zip_code: shippingAddress.zipCode || '',
          country: shippingAddress.country || 'Sénégal',
          phone: shippingAddress.phone || ''
        },
        billing_address: {
          type: billingAddress.type || 'billing',
          first_name: billingAddress.firstName || '',
          last_name: billingAddress.lastName || '',
          street: billingAddress.street || '',
          city: billingAddress.city || '',
          state: billingAddress.state || '',
          zip_code: billingAddress.zipCode || '',
          country: billingAddress.country || 'Sénégal',
          phone: billingAddress.phone || ''
        },
        notes: notes || null
      };

      const result = await firstValueFrom(
        this.api.post<any>('orders', orderData)
      );

      if (result && result.id) {
        // Clear cart after successful order
        await this.cartService.clearCart();
        return { success: true, orderId: result.id };
      }

      return { success: false, error: 'Failed to create order' };
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Extract detailed error message
      let errorMessage = 'Erreur lors de la création de la commande';
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.error?.error) {
        errorMessage = Array.isArray(error.error.error) 
          ? error.error.error.join(', ') 
          : error.error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const user = this.authService.currentUser;
      if (!user) return [];

      const data = await firstValueFrom(
        this.api.get<any[]>('orders')
      );

      const orders = (data || []).map(this.mapOrder);
      this.ordersSubject.next(orders);
      return orders;
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const data = await firstValueFrom(
        this.api.get<any>(`orders/${orderId}`)
      );

      return data ? this.mapOrder(data) : null;
    } catch (error) {
      console.error('Error loading order:', error);
      return null;
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      // Get all orders and filter by number (or implement backend endpoint)
      const orders = await this.getOrders();
      return orders.find(order => order.orderNumber === orderNumber) || null;
    } catch (error) {
      console.error('Error loading order by number:', error);
      return null;
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      const data = await firstValueFrom(
        this.api.patch<any>(`orders/${orderId}/status`, { status })
      );

      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async validateCashPayment(orderId: string) {
    try {
      const data = await firstValueFrom(
        this.api.patch<any>(`orders/${orderId}/validate-payment`, {})
      );

      return data;
    } catch (error) {
      console.error('Error validating cash payment:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.updateOrderStatus(orderId, 'cancelled');
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapOrder(data: any): Order {
    return {
      id: data.id,
      orderNumber: data.order_number,
      userId: data.user_id,
      items: (data.items || []).map((item: any) => ({
        id: item.id || '',
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        price: typeof item.price === 'string' ? parseFloat(item.price) || 0 : Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        selectedVariant: item.selected_variant
      })),
      subtotal: typeof data.subtotal === 'string' ? parseFloat(data.subtotal) || 0 : Number(data.subtotal) || 0,
      discount: typeof data.discount === 'string' ? parseFloat(data.discount) || 0 : Number(data.discount) || 0,
      tax: typeof data.tax === 'string' ? parseFloat(data.tax) || 0 : Number(data.tax) || 0,
      shipping: typeof data.shipping === 'string' ? parseFloat(data.shipping) || 0 : Number(data.shipping) || 0,
      total: typeof data.total === 'string' ? parseFloat(data.total) || 0 : Number(data.total) || 0,
      status: data.status,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method,
      shippingAddress: data.shipping_address,
      billingAddress: data.billing_address,
      trackingNumber: data.tracking_number,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SL${year}${month}${day}${random}`;
  }
}
