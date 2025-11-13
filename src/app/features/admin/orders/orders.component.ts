import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  isLoading = true;
  searchQuery = '';
  selectedStatus = '';

  constructor(
    private orderService: OrderService,
    public currencyService: CurrencyService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    try {
      this.isLoading = true;
      const orders = await this.orderService.getOrders();
      this.orders = orders.map(order => ({
        ...order,
        order_number: order.orderNumber,
        user_id: order.userId,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        shipping_address: order.shippingAddress,
        billing_address: order.billingAddress,
        tracking_number: order.trackingNumber,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      }));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get filteredOrders() {
    return this.orders.filter(order => {
      const matchesSearch = !this.searchQuery || 
        order.order_number.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || 
        order.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  async updateOrderStatus(order: any, newStatus: string) {
    try {
      await this.orderService.updateOrderStatus(order.id, newStatus as any);
      await this.loadOrders();
      this.toastService.success('Statut de la commande mis à jour!');
    } catch (error: any) {
      console.error('Error updating order:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  isCashPaymentPending(order: any): boolean {
    const isCashPayment = order.payment_method === 'cash_on_delivery' || 
                         order.payment_method === 'Paiement à la livraison' ||
                         order.payment_method?.toLowerCase().includes('espèces') ||
                         order.payment_method?.toLowerCase().includes('cash');
    return isCashPayment && order.payment_status === 'pending';
  }

  async validateCashPayment(order: any) {
    try {
      await this.orderService.validateCashPayment(order.id);
      await this.loadOrders();
      this.toastService.success('Paiement en espèces validé avec succès!');
    } catch (error: any) {
      console.error('Error validating cash payment:', error);
      this.toastService.info('Erreur: ' + (error.message || 'Erreur lors de la validation'));
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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En cours',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }
}
