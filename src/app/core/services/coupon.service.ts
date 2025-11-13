import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount?: number;
  isActive: boolean;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private api = inject(ApiService);

  async getCoupons(): Promise<Coupon[]> {
    try {
      const data = await firstValueFrom(
        this.api.get<any[]>('coupons')
      );

      return (data || []).map(this.mapCoupon);
    } catch (error) {
      console.error('Error loading coupons:', error);
      return [];
    }
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      const data = await firstValueFrom(
        this.api.get<any>(`coupons/code/${code}`)
      );

      return data ? this.mapCoupon(data) : null;
    } catch (error) {
      console.error('Error loading coupon:', error);
      return null;
    }
  }

  async createCoupon(couponData: any): Promise<Coupon | null> {
    try {
      const data = await firstValueFrom(
        this.api.post<any>('coupons', couponData)
      );

      return data ? this.mapCoupon(data) : null;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  }

  async updateCoupon(id: string, couponData: any): Promise<Coupon | null> {
    try {
      const data = await firstValueFrom(
        this.api.patch<any>(`coupons/${id}`, couponData)
      );

      return data ? this.mapCoupon(data) : null;
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  }

  async deleteCoupon(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.api.delete(`coupons/${id}`)
      );

      return true;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return false;
    }
  }

  private mapCoupon(data: any): Coupon {
    return {
      id: data.id,
      code: data.code,
      type: data.type,
      value: data.value,
      minPurchase: data.min_purchase,
      maxDiscount: data.max_discount,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      usageLimit: data.usage_limit,
      usageCount: data.usage_count || 0,
      isActive: data.is_active,
      createdAt: data.created_at ? new Date(data.created_at) : undefined
    };
  }
}










