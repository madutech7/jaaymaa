import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  private api = inject(ApiService);

  async getShippingMethods(): Promise<ShippingMethod[]> {
    try {
      const data = await firstValueFrom(
        this.api.get<any[]>('shipping')
      );

      return (data || []).map(method => ({
        id: method.id,
        name: method.name,
        description: method.description,
        price: parseFloat(method.price),
        estimatedDays: method.estimated_days,
        isActive: method.is_active
      }));
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      // Return default shipping method
      return [
        {
          id: 'standard',
          name: 'Livraison Standard',
          description: '5-7 jours ouvrables',
          price: 9.99,
          estimatedDays: '5-7',
          isActive: true
        }
      ];
    }
  }

  calculateShipping(subtotal: number, country: string = 'FR'): number {
    // Free shipping for orders over 100€
    if (subtotal >= 100) {
      return 0;
    }
    
    // Standard shipping
    return 9.99;
  }

  async loadShippingMethods(countryCode?: string): Promise<ShippingMethod[]> {
    return this.getShippingMethods();
  }
}
