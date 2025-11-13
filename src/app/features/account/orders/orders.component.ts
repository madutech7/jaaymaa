import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  searchQuery = '';
  statusFilter = '';
  sortOrder: 'asc' | 'desc' = 'desc';
  isLoading = true;

  constructor(
    private orderService: OrderService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private async loadOrders(): Promise<void> {
    this.isLoading = true;
    try {
      this.orders = await this.orderService.getOrders();
      this.filteredOrders = [...this.orders];
      this.sortOrders();
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      this.isLoading = false;
    }
  }

  filterOrders(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = !this.searchQuery || 
        order.orderNumber.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = !this.statusFilter || order.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    this.sortOrders();
  }

  sortOrders(): void {
    this.filteredOrders.sort((a, b) => {
      const dateA = a.createdAt.getTime();
      const dateB = b.createdAt.getTime();
      
      return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  getOrderStatusLabel(status: OrderStatus): string {
    const statusLabels: Record<OrderStatus, string> = {
      'pending': 'En attente',
      'processing': 'En cours',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      'refunded': 'Remboursée'
    };
    return statusLabels[status] || status;
  }
}
