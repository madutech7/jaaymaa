import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Order, OrderStatus, PaymentStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    public currencyService: CurrencyService
  ) {}

  async ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      await this.loadOrder(orderId);
    } else {
      this.error = 'ID de commande invalide';
      this.loading = false;
    }
  }

  async loadOrder(orderId: string) {
    try {
      this.loading = true;
      this.order = await this.orderService.getOrderById(orderId);
      if (!this.order) {
        this.error = 'Commande introuvable';
      }
    } catch (error: any) {
      this.error = 'Erreur lors du chargement de la commande';
      console.error('Error loading order:', error);
    } finally {
      this.loading = false;
    }
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      'pending': 'En attente',
      'processing': 'En traitement',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      'refunded': 'Remboursée'
    };
    return labels[status] || status;
  }

  getStatusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      'pending': 'En attente',
      'paid': 'Payée',
      'failed': 'Échouée',
      'refunded': 'Remboursée'
    };
    return labels[status] || status;
  }

  getPaymentStatusClass(status: PaymentStatus): string {
    const classes: Record<PaymentStatus, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}

