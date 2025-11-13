import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'promotion' | 'system' | 'review';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Load notifications when user is authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadNotifications();
      } else {
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  async loadNotifications(): Promise<void> {
    try {
      const user = this.authService.currentUser;
      if (!user) return;

      // For now, return empty array since backend may not have notifications endpoint
      // You can implement this when backend has the endpoint
      this.notificationsSubject.next([]);
      this.unreadCountSubject.next(0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Implement when backend has the endpoint
      const notifications = this.notificationsSubject.value;
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        this.notificationsSubject.next([...notifications]);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      // Implement when backend has the endpoint
      const notifications = this.notificationsSubject.value.map(n => ({
        ...n,
        read: true
      }));
      this.notificationsSubject.next(notifications);
      this.unreadCountSubject.next(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      // Implement when backend has the endpoint
      const notifications = this.notificationsSubject.value.filter(
        n => n.id !== notificationId
      );
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  get notifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  get unreadCount(): number {
    return this.unreadCountSubject.value;
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'order': '📦',
      'promotion': '🎁',
      'system': '⚙️',
      'review': '⭐'
    };
    return icons[type] || '📬';
  }

  async createNotification(data: any): Promise<void> {
    // TODO: Implémenter avec le backend
    console.warn('createNotification not implemented yet', data);
  }
}
