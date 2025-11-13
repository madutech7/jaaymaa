import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ApiService } from '../../../core/services/api.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class AdminOrderDetailComponent implements OnInit {
  order: any = null;
  isLoading = true;
  orderId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private api: ApiService,
    public currencyService: CurrencyService,
    private toastService: ToastService
  ) {
    this.route.params.subscribe(params => {
      this.orderId = params['id'];
      if (this.orderId) {
        this.loadOrder();
      }
    });
  }

  async ngOnInit() {
    // L'ID est déjà récupéré dans le constructor
  }

  getProductImage(product: any): string | null {
    if (!product?.images) {
      return null;
    }
    
    if (!Array.isArray(product.images)) {
      return null;
    }
    
    if (product.images.length === 0) {
      return null;
    }
    
    const firstImage = product.images[0];
    
    // Handle both string URLs and object with url property
    if (typeof firstImage === 'string') {
      return firstImage;
    } else if (firstImage && typeof firstImage === 'object' && firstImage.url) {
      return firstImage.url;
    }
    
    return null;
  }

  async loadOrder() {
    try {
      this.isLoading = true;
      
      // Use OrderService to get order by ID
      const orderData = await firstValueFrom(
        this.api.get<any>(`orders/${this.orderId}`)
      );

      if (!orderData) {
        throw new Error('Commande introuvable');
      }

      // Map the order data to match the expected format for the template
      // Backend returns: items, user (relation), shipping (not shipping_cost)
      this.order = {
        ...orderData,
        order_items: (orderData.items || []).map((item: any) => ({
          id: item.id || '',
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product_id || item.productId,
            name: item.product_name || item.productName || 'Produit',
            slug: item.product_slug || '',
            images: item.product_image ? [item.product_image] : []
          }
        })),
        user: orderData.user ? {
          id: orderData.user.id || orderData.user_id,
          email: orderData.user.email || '',
          first_name: orderData.user.first_name || orderData.user.firstName || '',
          last_name: orderData.user.last_name || orderData.user.lastName || '',
          phone: orderData.user.phone || ''
        } : {
          id: orderData.user_id,
          email: '',
          first_name: '',
          last_name: '',
          phone: ''
        },
        // Map shipping to shipping_cost for template compatibility
        shipping_cost: orderData.shipping || 0
      };
    } catch (error: any) {
      console.error('Error loading order:', error);
      this.toastService.info('Erreur lors du chargement de la commande: ' + (error.message || 'Erreur inconnue'));
    } finally {
      this.isLoading = false;
    }
  }

  async updateOrderStatus(newStatus: string) {
    try {
      await firstValueFrom(
        this.api.patch<any>(`orders/${this.orderId}/status`, { status: newStatus })
      );

      if (this.order) {
        this.order.status = newStatus;
      }
      this.toastService.success('Statut de la commande mis à jour!');
    } catch (error: any) {
      console.error('Error updating order:', error);
      this.toastService.info('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const statuses: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En cours',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return statuses[status] || status;
  }

  goBack() {
    this.router.navigate(['/admin/orders']);
  }
}
