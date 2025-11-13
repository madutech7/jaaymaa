import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { UserService } from '../../../core/services/user.service';
import { ApiService } from '../../../core/services/api.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { ChartConfiguration } from 'chart.js';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  revenueGrowth: number;
  orderGrowth: number;
  recentOrders: any[];
  topProducts: any[];
  topCustomers: any[];
  orderStatusDistribution: any[];
  revenueByMonth: any[];
  lowStockProducts: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats: Stats = {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    recentOrders: [],
    topProducts: [],
    topCustomers: [],
    orderStatusDistribution: [],
    revenueByMonth: [],
    lowStockProducts: []
  };
  
  isLoading = true;
  errorMessage: string | null = null;
  
  // Chart configurations
  revenueChartConfig?: ChartConfiguration;
  ordersChartConfig?: ChartConfiguration;
  categoryChartConfig?: ChartConfiguration;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private userService: UserService,
    private api: ApiService,
    private authService: AuthService,
    public currencyService: CurrencyService
  ) {}

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    try {
      this.isLoading = true;
      this.errorMessage = null;

      // Vérifier l'authentification
      const isAuthenticated = await this.authService.checkAuthStatus();
      if (!isAuthenticated) {
        this.errorMessage = 'Vous devez être connecté pour accéder au dashboard';
        this.isLoading = false;
        return;
      }

      // Vérifier que l'utilisateur est admin
      const currentUser = this.authService.currentUser;
      if (!currentUser || currentUser.role !== 'admin') {
        this.errorMessage = 'Accès refusé : droits administrateur requis';
        this.isLoading = false;
        return;
      }

      // Get orders - Utiliser OrderService pour une meilleure gestion
      let orders: any[] = [];
      try {
        orders = await this.orderService.getOrders();
        console.log('📦 Orders loaded:', orders.length);
        if (orders.length > 0) {
          console.log('📦 First order sample:', {
            id: orders[0].id,
            total: orders[0].total,
            status: orders[0].status,
            createdAt: orders[0].createdAt,
            created_at: orders[0].created_at
          });
        }
      } catch (error: any) {
        console.error('❌ Error loading orders:', error);
        if (error?.status === 401) {
          this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          return;
        }
        // Continuer même si les commandes échouent
      }

      // Toujours calculer les statistiques, même si orders est vide
      if (orders && orders.length > 0) {
        this.stats.totalOrders = orders.length;
        
        // Calculer le revenu total avec vérification
        const revenueSum = orders.reduce((sum: number, order: any) => {
          // Convertir en nombre si c'est une chaîne
          const orderTotal = typeof order.total === 'string' 
            ? parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0
            : Number(order.total) || 0;
          
          if (isNaN(orderTotal)) {
            console.warn('⚠️ Order with invalid total:', order.id, order.total, 'type:', typeof order.total);
            return sum;
          }
          return sum + orderTotal;
        }, 0);
        this.stats.totalRevenue = revenueSum;
        console.log('💰 Total Revenue calculated:', this.stats.totalRevenue);
        
        this.stats.pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
        this.stats.completedOrders = orders.filter((o: any) => o.status === 'delivered').length;
        this.stats.cancelledOrders = orders.filter((o: any) => o.status === 'cancelled').length;
        console.log('📊 Order statuses:', {
          pending: this.stats.pendingOrders,
          delivered: this.stats.completedOrders,
          cancelled: this.stats.cancelledOrders
        });
        
        this.stats.averageOrderValue = this.stats.totalOrders > 0 ? this.stats.totalRevenue / this.stats.totalOrders : 0;
        console.log('📈 Average Order Value:', this.stats.averageOrderValue);
        
        // Recent orders
        this.stats.recentOrders = orders
          .sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
            return dateB - dateA;
          })
          .slice(0, 5);

        // Order status distribution
        this.stats.orderStatusDistribution = this.calculateOrderStatusDistribution(orders);

        // Revenue calculations
        this.calculateRevenueStats(orders);

        // Top customers (async, will be set separately)
        this.calculateTopCustomers(orders).then(customers => {
          this.stats.topCustomers = customers;
        }).catch(err => console.error('Error calculating top customers:', err));
        
        // Initialize charts
        this.initializeCharts(orders);
      } else {
        console.warn('⚠️ No orders found or orders array is empty');
        // Réinitialiser les statistiques liées aux commandes
        this.stats.totalOrders = 0;
        this.stats.totalRevenue = 0;
        this.stats.pendingOrders = 0;
        this.stats.completedOrders = 0;
        this.stats.cancelledOrders = 0;
        this.stats.averageOrderValue = 0;
        this.stats.monthlyRevenue = 0;
        this.stats.weeklyRevenue = 0;
        this.stats.dailyRevenue = 0;
        this.stats.revenueGrowth = 0;
        this.stats.recentOrders = [];
        this.stats.orderStatusDistribution = [];
      }

      // Get customers
      try {
        const users = await this.userService.getAllUsers();
        console.log('👥 All users loaded:', users.length);
        const customers = users.filter(u => u.role === 'customer');
        this.stats.totalCustomers = customers.length;
        console.log('👥 Customers loaded:', this.stats.totalCustomers, 'out of', users.length, 'total users');
      } catch (error: any) {
        console.error('❌ Error loading customers:', error);
        // Continuer même si les utilisateurs échouent
      }

      // Get products
      try {
        const allProducts = await this.productService.getProducts();
        console.log('🛍️ All products loaded:', allProducts.length);
        const products = allProducts.filter((p: any) => {
          const isActive = p.status === 'active';
          if (!isActive) {
            console.log('⚠️ Product not active:', p.id, p.name, 'status:', p.status);
          }
          return isActive;
        });
        this.stats.totalProducts = products.length;
        this.stats.lowStockProducts = products.filter((p: any) => (p.stock || 0) < 10);
        console.log('🛍️ Active products:', this.stats.totalProducts, 'out of', allProducts.length, 'total products');
        console.log('⚠️ Low stock products:', this.stats.lowStockProducts.length);
        
        // Category chart
        if (products.length > 0) {
          this.initializeCategoryChart(products);
        }
      } catch (error: any) {
        console.error('❌ Error loading products:', error);
        // Continuer même si les produits échouent
      }

      // Get top products
      try {
        await this.loadTopProducts();
      } catch (error: any) {
        console.error('Error loading top products:', error);
      }

    } catch (error: any) {
      console.error('Error loading stats:', error);
      this.errorMessage = error?.error?.message || error?.message || 'Erreur lors du chargement des statistiques';
      
      if (error?.status === 401) {
        this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error?.status === 403) {
        this.errorMessage = 'Accès refusé : droits administrateur requis';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private calculateOrderStatusDistribution(orders: any[]) {
    const distribution = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count: count as number,
      percentage: ((count as number) / orders.length) * 100
    }));
  }

  private calculateRevenueStats(orders: any[]) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const startOfWeek = weekStart;
    
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startOfDay.setHours(0, 0, 0, 0);

    console.log('📅 Date ranges:', {
      startOfMonth: startOfMonth.toISOString(),
      startOfWeek: startOfWeek.toISOString(),
      startOfDay: startOfDay.toISOString(),
      now: now.toISOString()
    });

    // Monthly revenue
    const monthlyOrders = orders.filter(o => {
      const orderDate = o.createdAt ? new Date(o.createdAt) : (o.created_at ? new Date(o.created_at) : null);
      if (!orderDate || isNaN(orderDate.getTime())) {
        console.warn('⚠️ Order with invalid date:', o.id, o.createdAt, o.created_at);
        return false;
      }
      return orderDate >= startOfMonth;
    });
    this.stats.monthlyRevenue = monthlyOrders.reduce((sum, order) => {
      const total = typeof order.total === 'string' 
        ? parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0
        : Number(order.total) || 0;
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    console.log('💰 Monthly revenue:', this.stats.monthlyRevenue, 'from', monthlyOrders.length, 'orders');

    // Weekly revenue
    const weeklyOrders = orders.filter(o => {
      const orderDate = o.createdAt ? new Date(o.createdAt) : (o.created_at ? new Date(o.created_at) : null);
      if (!orderDate || isNaN(orderDate.getTime())) return false;
      return orderDate >= startOfWeek;
    });
    this.stats.weeklyRevenue = weeklyOrders.reduce((sum, order) => {
      const total = typeof order.total === 'string' 
        ? parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0
        : Number(order.total) || 0;
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    console.log('💰 Weekly revenue:', this.stats.weeklyRevenue, 'from', weeklyOrders.length, 'orders');

    // Daily revenue
    const dailyOrders = orders.filter(o => {
      const orderDate = o.createdAt ? new Date(o.createdAt) : (o.created_at ? new Date(o.created_at) : null);
      if (!orderDate || isNaN(orderDate.getTime())) return false;
      return orderDate >= startOfDay;
    });
    this.stats.dailyRevenue = dailyOrders.reduce((sum, order) => {
      const total = typeof order.total === 'string' 
        ? parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0
        : Number(order.total) || 0;
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    console.log('💰 Daily revenue:', this.stats.dailyRevenue, 'from', dailyOrders.length, 'orders');

    // Calculate growth (simplified - comparing with previous period)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousMonth.setHours(0, 0, 0, 0);
    const previousMonthOrders = orders.filter(o => {
      const orderDate = o.createdAt ? new Date(o.createdAt) : (o.created_at ? new Date(o.created_at) : null);
      if (!orderDate || isNaN(orderDate.getTime())) return false;
      return orderDate >= previousMonth && orderDate < startOfMonth;
    });
    const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => {
      const total = typeof order.total === 'string' 
        ? parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0
        : Number(order.total) || 0;
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    console.log('💰 Previous month revenue:', previousMonthRevenue, 'from', previousMonthOrders.length, 'orders');

    this.stats.revenueGrowth = previousMonthRevenue > 0 
      ? ((this.stats.monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : (this.stats.monthlyRevenue > 0 ? 100 : 0);
    console.log('📈 Revenue growth:', this.stats.revenueGrowth + '%');
  }

  private async calculateTopCustomers(orders: any[]) {
    try {
      // Get all users to map user info
      const users = await this.userService.getAllUsers();
      const userMap = new Map(users.map(u => [u.id, u]));

      const customerStats = orders.reduce((acc: any, order: any) => {
        const userId = order.user_id || order.userId;
        if (!userId) return acc;
        
        const user = userMap.get(userId);
        if (!user) return acc;

        if (!acc[userId]) {
          acc[userId] = {
            user: {
              first_name: user.firstName || '',
              last_name: user.lastName || '',
              email: user.email
            },
            totalSpent: 0,
            orderCount: 0
          };
        }
        const orderTotal = typeof order.total === 'string' 
          ? parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0
          : Number(order.total) || 0;
        acc[userId].totalSpent += orderTotal;
        acc[userId].orderCount += 1;
        return acc;
      }, {});

      return Object.values(customerStats)
        .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
    } catch (error) {
      console.error('Error calculating top customers:', error);
      return [];
    }
  }

  private async loadTopProducts() {
    try {
      // Get orders with items using OrderService
      const orders = await this.orderService.getOrders();

      const productStats: Record<string, any> = {};
      
      // Process orders to get product stats
      for (const order of orders || []) {
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            const productId = item.productId;
            if (productId) {
              if (!productStats[productId]) {
                productStats[productId] = {
                  product: {
                    id: productId,
                    name: item.productName || 'Produit inconnu'
                  },
                  totalSold: 0,
                  totalRevenue: 0
                };
              }
              productStats[productId].totalSold += item.quantity || 0;
              const itemPriceValue = item.price;
              const itemPrice = typeof itemPriceValue === 'string' 
                ? parseFloat(String(itemPriceValue).replace(/[^\d.-]/g, '')) || 0
                : Number(itemPriceValue) || 0;
              const itemQuantity = Number(item.quantity) || 0;
              productStats[productId].totalRevenue += itemQuantity * itemPrice;
            }
          }
        }
      }

      this.stats.topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.totalSold - a.totalSold)
        .slice(0, 5);
    } catch (error) {
      console.error('Error loading top products:', error);
      this.stats.topProducts = [];
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

  private initializeCharts(orders: any[]) {
    // Revenue chart (last 7 days)
    const last7Days = this.getLast7Days();
    const revenueData = last7Days.map(date => {
      return orders
        .filter(o => {
          const orderDate = o.createdAt ? new Date(o.createdAt) : new Date(o.created_at);
          return this.isSameDay(orderDate, date);
        })
        .reduce((sum, order) => {
          const orderTotal = typeof order.total === 'string' 
            ? parseFloat(order.total.replace(/[^\d.-]/g, '')) || 0
            : Number(order.total) || 0;
          return sum + (isNaN(orderTotal) ? 0 : orderTotal);
        }, 0);
    });

    this.revenueChartConfig = {
      type: 'line',
      data: {
        labels: last7Days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Revenus (FCFA)',
          data: revenueData,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => this.currencyService.formatPrice(context.parsed.y)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.currencyService.formatPrice(value as number)
            }
          }
        }
      }
    };

    // Orders chart (last 7 days)
    const ordersData = last7Days.map(date => {
      return orders.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt) : new Date(o.created_at);
        return this.isSameDay(orderDate, date);
      }).length;
    });

    this.ordersChartConfig = {
      type: 'bar',
      data: {
        labels: last7Days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Commandes',
          data: ordersData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };
  }

  private initializeCategoryChart(products: any[]) {
    // Group products by category
    const categoryStats = products.reduce((acc: any, product) => {
      const categoryName = product.category?.name || 'Sans catégorie';
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += 1;
      return acc;
    }, {});

    const labels = Object.keys(categoryStats);
    const data = Object.values(categoryStats) as number[];
    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(6, 182, 212, 0.8)'
    ];

    this.categoryChartConfig = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(c => c.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };
  }

  private getLast7Days(): Date[] {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}
