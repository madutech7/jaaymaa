import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface PromotionalBanner {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  buttonText?: string;
  position: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private bannersSubject = new BehaviorSubject<PromotionalBanner[]>([]);
  public banners$ = this.bannersSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.loadActiveBanners();
  }

  /**
   * Charger les bannières actives
   */
  async loadActiveBanners(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await this.supabase.client
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error loading banners:', error);
        return;
      }

      const banners = data ? data.map(b => this.mapBanner(b)) : [];
      this.bannersSubject.next(banners);
    } catch (error) {
      console.error('Error loading banners:', error);
    }
  }

  /**
   * Récupérer toutes les bannières (admin)
   */
  async getAllBanners(): Promise<PromotionalBanner[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('promotional_banners')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching all banners:', error);
        return [];
      }

      return data ? data.map(b => this.mapBanner(b)) : [];
    } catch (error) {
      console.error('Error fetching all banners:', error);
      return [];
    }
  }

  /**
   * Créer une nouvelle bannière (admin)
   */
  async createBanner(banner: Partial<PromotionalBanner>): Promise<PromotionalBanner | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('promotional_banners')
        .insert({
          title: banner.title,
          description: banner.description || null,
          image_url: banner.imageUrl || null,
          link_url: banner.linkUrl || null,
          button_text: banner.buttonText || null,
          position: banner.position || 0,
          is_active: banner.isActive ?? true,
          start_date: banner.startDate?.toISOString() || new Date().toISOString(),
          end_date: banner.endDate?.toISOString() || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating banner:', error);
        return null;
      }

      return this.mapBanner(data);
    } catch (error) {
      console.error('Error creating banner:', error);
      return null;
    }
  }

  /**
   * Mettre à jour une bannière (admin)
   */
  async updateBanner(id: string, updates: Partial<PromotionalBanner>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.linkUrl !== undefined) updateData.link_url = updates.linkUrl;
      if (updates.buttonText !== undefined) updateData.button_text = updates.buttonText;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate?.toISOString();
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate?.toISOString();

      const { error } = await this.supabase.client
        .from('promotional_banners')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating banner:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating banner:', error);
      return false;
    }
  }

  /**
   * Supprimer une bannière (admin)
   */
  async deleteBanner(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('promotional_banners')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting banner:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting banner:', error);
      return false;
    }
  }

  /**
   * Mapper les données Supabase vers le modèle PromotionalBanner
   */
  private mapBanner(data: any): PromotionalBanner {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      linkUrl: data.link_url,
      buttonText: data.button_text,
      position: data.position,
      isActive: data.is_active,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      createdAt: new Date(data.created_at)
    };
  }
}

