import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Refund {
  id: string;
  orderId: string;
  transactionId?: string;
  amount: number;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'processed';
  processedBy?: string;
  requestedAt: Date;
  processedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RefundService {

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {}

  /**
   * Demander un remboursement
   */
  async requestRefund(
    orderId: string,
    amount: number,
    reason: string
  ): Promise<Refund | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('refunds')
        .insert({
          order_id: orderId,
          amount,
          reason,
          status: 'requested'
        })
        .select()
        .single();

      if (error) {
        console.error('Error requesting refund:', error);
        return null;
      }

      return this.mapRefund(data);
    } catch (error) {
      console.error('Error requesting refund:', error);
      return null;
    }
  }

  /**
   * Récupérer les remboursements d'une commande
   */
  async getOrderRefunds(orderId: string): Promise<Refund[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('refunds')
        .select('*')
        .eq('order_id', orderId)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching order refunds:', error);
        return [];
      }

      return data ? data.map(r => this.mapRefund(r)) : [];
    } catch (error) {
      console.error('Error fetching order refunds:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les remboursements (admin)
   */
  async getAllRefunds(status?: Refund['status']): Promise<Refund[]> {
    try {
      let query = this.supabase.client
        .from('refunds')
        .select('*')
        .order('requested_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all refunds:', error);
        return [];
      }

      return data ? data.map(r => this.mapRefund(r)) : [];
    } catch (error) {
      console.error('Error fetching all refunds:', error);
      return [];
    }
  }

  /**
   * Approuver un remboursement (admin)
   */
  async approveRefund(refundId: string): Promise<boolean> {
    try {
      const user = this.supabase.currentUser;
      if (!user) return false;

      const { error } = await this.supabase.client
        .from('refunds')
        .update({
          status: 'approved',
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId);

      if (error) {
        console.error('Error approving refund:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error approving refund:', error);
      return false;
    }
  }

  /**
   * Rejeter un remboursement (admin)
   */
  async rejectRefund(refundId: string): Promise<boolean> {
    try {
      const user = this.supabase.currentUser;
      if (!user) return false;

      const { error } = await this.supabase.client
        .from('refunds')
        .update({
          status: 'rejected',
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId);

      if (error) {
        console.error('Error rejecting refund:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error rejecting refund:', error);
      return false;
    }
  }

  /**
   * Marquer un remboursement comme traité (admin)
   */
  async markAsProcessed(refundId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('refunds')
        .update({
          status: 'processed'
        })
        .eq('id', refundId);

      if (error) {
        console.error('Error marking refund as processed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking refund as processed:', error);
      return false;
    }
  }

  /**
   * Mapper les données Supabase vers le modèle Refund
   */
  private mapRefund(data: any): Refund {
    return {
      id: data.id,
      orderId: data.order_id,
      transactionId: data.transaction_id,
      amount: parseFloat(data.amount),
      reason: data.reason,
      status: data.status,
      processedBy: data.processed_by,
      requestedAt: new Date(data.requested_at),
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined
    };
  }

  /**
   * Obtenir la couleur du badge selon le statut
   */
  getStatusColor(status: Refund['status']): string {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'processed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}

