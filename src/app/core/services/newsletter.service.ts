import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isSubscribed: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {

  constructor(private supabase: SupabaseService) {}

  /**
   * S'abonner à la newsletter
   */
  async subscribe(email: string, firstName?: string, lastName?: string): Promise<boolean> {
    try {
      // Vérifier si l'email existe déjà
      const { data: existing } = await this.supabase.client
        .from('newsletter_subscribers')
        .select('id, is_subscribed')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        // Réabonner si désinscrit
        if (!existing.is_subscribed) {
          const { error } = await this.supabase.client
            .from('newsletter_subscribers')
            .update({
              is_subscribed: true,
              subscribed_at: new Date().toISOString(),
              unsubscribed_at: null
            })
            .eq('id', existing.id);

          return !error;
        }
        return true; // Déjà abonné
      }

      // Nouvel abonné
      const { error } = await this.supabase.client
        .from('newsletter_subscribers')
        .insert({
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          is_subscribed: true
        });

      if (error) {
        console.error('Error subscribing to newsletter:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      return false;
    }
  }

  /**
   * Se désabonner de la newsletter
   */
  async unsubscribe(email: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('newsletter_subscribers')
        .update({
          is_subscribed: false,
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) {
        console.error('Error unsubscribing from newsletter:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      return false;
    }
  }

  /**
   * Récupérer tous les abonnés (admin)
   */
  async getAllSubscribers(activeOnly: boolean = true): Promise<NewsletterSubscriber[]> {
    try {
      let query = this.supabase.client
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_subscribed', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching subscribers:', error);
        return [];
      }

      return data ? data.map(s => this.mapSubscriber(s)) : [];
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  }

  /**
   * Vérifier si un email est abonné
   */
  async isSubscribed(email: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.client
        .from('newsletter_subscribers')
        .select('is_subscribed')
        .eq('email', email)
        .maybeSingle();

      if (error) return false;
      return data?.is_subscribed || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Mapper les données Supabase vers le modèle NewsletterSubscriber
   */
  private mapSubscriber(data: any): NewsletterSubscriber {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      isSubscribed: data.is_subscribed,
      subscribedAt: new Date(data.subscribed_at),
      unsubscribedAt: data.unsubscribed_at ? new Date(data.unsubscribed_at) : undefined
    };
  }
}

