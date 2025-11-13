import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface SupportTicket {
  id: string;
  userId: string;
  orderId?: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: SupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  userId: string;
  isStaff: boolean;
  message: string;
  attachments?: string[];
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  private ticketsSubject = new BehaviorSubject<SupportTicket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();

  async createTicket(
    subject: string,
    category: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    orderId?: string
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      const user = this.authService.currentUser;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const ticketData = {
        subject,
        category,
        message,
        priority,
        order_id: orderId
      };

      // For now, return mock success since backend may not have support endpoint
      // Implement when backend has the endpoint
      return { 
        success: true, 
        ticketId: 'mock-' + Date.now() 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getTickets(): Promise<SupportTicket[]> {
    try {
      const user = this.authService.currentUser;
      if (!user) return [];

      // For now, return empty array since backend may not have support endpoint
      // Implement when backend has the endpoint
      return [];
    } catch (error) {
      console.error('Error loading tickets:', error);
      return [];
    }
  }

  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      // Implement when backend has the endpoint
      return null;
    } catch (error) {
      console.error('Error loading ticket:', error);
      return null;
    }
  }

  async addMessage(
    ticketId: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Implement when backend has the endpoint
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async closeTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Implement when backend has the endpoint
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
