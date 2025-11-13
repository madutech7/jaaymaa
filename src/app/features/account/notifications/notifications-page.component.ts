import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  unreadCount = 0;
  selectedFilter: 'all' | 'unread' | 'order' | 'promotion' | 'system' | 'review' = 'all';

  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.applyFilter();
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  applyFilter(): void {
    if (this.selectedFilter === 'all') {
      this.filteredNotifications = this.notifications;
    } else if (this.selectedFilter === 'unread') {
      this.filteredNotifications = this.notifications.filter(n => !n.read);
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.type === this.selectedFilter);
    }
  }

  setFilter(filter: typeof this.selectedFilter): void {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  async markAsRead(notification: Notification): Promise<void> {
    if (!notification.read) {
      await this.notificationService.markAsRead(notification.id);
    }
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationService.deleteNotification(notificationId);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''}`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} heure${Math.floor(seconds / 3600) > 1 ? 's' : ''}`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} jour${Math.floor(seconds / 86400) > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}

