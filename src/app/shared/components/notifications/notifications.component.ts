import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  private subscriptions: Subscription[] = [];

  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {
    // S'abonner aux notifications
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(
        notifications => {
          this.notifications = notifications;
        }
      )
    );

    // S'abonner au compteur de non lus
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(
        count => {
          this.unreadCount = count;
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  async markAsRead(notification: Notification, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    
    if (!notification.read) {
      await this.notificationService.markAsRead(notification.id);
    }
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  async deleteNotification(notificationId: string, event: Event): Promise<void> {
    event.stopPropagation();
    await this.notificationService.deleteNotification(notificationId);
  }

  handleNotificationClick(notification: Notification): void {
    // Marquer comme lu
    this.markAsRead(notification);
    
    // Fermer le dropdown
    this.closeDropdown();
    
    // La navigation se fera via le routerLink dans le template
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}

