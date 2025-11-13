import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { LoyaltyService } from '../../../core/services/loyalty.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { User } from '../../../core/models/user.model';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  recentOrders: Order[] = [];
  totalOrders = 0;
  totalSpent = 0;
  wishlistCount = 0;
  isLoading = true;
  loyaltyPoints = 0;
  loyaltyTier = 'bronze';

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private wishlistService: WishlistService,
    private loyaltyService: LoyaltyService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    this.isLoading = true;

    // Charger l'utilisateur
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    try {
      // Charger les commandes récentes (3 dernières)
      const orders = await this.orderService.getOrders();
      this.recentOrders = orders.slice(0, 3);
      this.totalOrders = orders.length;
      
      // Calculer le total dépensé
      this.totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

      // Charger le nombre de produits en wishlist
      const wishlistItems = await this.wishlistService.getWishlist();
      this.wishlistCount = wishlistItems.length;

      // Charger les points de fidélité
      this.loyaltyPoints = await this.loyaltyService.loadPoints();
      this.loyaltyTier = this.loyaltyService.getTierFromPoints(this.loyaltyPoints);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getOrderStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'processing': 'En cours',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return statusLabels[status] || status;
  }

  getUserLevel(): string {
    const points = this.currentUser?.loyaltyPoints || 0;
    if (points < 500) return 'Bronze';
    if (points < 1000) return 'Argent';
    if (points < 2000) return 'Or';
    return 'Platine';
  }

  getNextLevelPoints(): number {
    const points = this.currentUser?.loyaltyPoints || 0;
    if (points < 500) return 500 - points;
    if (points < 1000) return 1000 - points;
    if (points < 2000) return 2000 - points;
    return 0;
  }

  getLevelProgress(): number {
    const points = this.currentUser?.loyaltyPoints || 0;
    if (points < 500) return (points / 500) * 100;
    if (points < 1000) return ((points - 500) / 500) * 100;
    if (points < 2000) return ((points - 1000) / 1000) * 100;
    return 100;
  }
}
