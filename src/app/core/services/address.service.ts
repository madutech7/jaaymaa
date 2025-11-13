import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Address } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  private addressesSubject = new BehaviorSubject<Address[]>([]);
  public addresses$ = this.addressesSubject.asObservable();

  async loadAddresses(): Promise<Address[]> {
    try {
      const user = this.authService.currentUser;
      if (!user) return [];

      const data = await firstValueFrom(
        this.api.get<any[]>('addresses')
      );

      const addresses = (data || []).map(this.mapAddress);
      this.addressesSubject.next(addresses);
      return addresses;
    } catch (error) {
      console.error('Error loading addresses:', error);
      return [];
    }
  }

  async getAddress(id: string): Promise<Address | null> {
    try {
      const data = await firstValueFrom(
        this.api.get<any>(`addresses/${id}`)
      );

      return data ? this.mapAddress(data) : null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }

  async createAddress(address: Omit<Address, 'id' | 'userId'>): Promise<{ success: boolean; error?: string; address?: Address }> {
    try {
      const user = this.authService.currentUser;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const addressData = {
        type: address.type,
        first_name: address.firstName,
        last_name: address.lastName,
        street: address.street,
        city: address.city,
        state: address.state,
        zip_code: address.zipCode,
        country: address.country,
        phone: address.phone,
        is_default: address.isDefault
      };

      const data = await firstValueFrom(
        this.api.post<any>('addresses', addressData)
      );

      await this.loadAddresses();

      return {
        success: true,
        address: this.mapAddress(data)
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateAddress(id: string, address: Partial<Address>): Promise<{ success: boolean; error?: string }> {
    try {
      const addressData: any = {};
      
      if (address.type) addressData.type = address.type;
      if (address.firstName) addressData.first_name = address.firstName;
      if (address.lastName) addressData.last_name = address.lastName;
      if (address.street) addressData.street = address.street;
      if (address.city) addressData.city = address.city;
      if (address.state) addressData.state = address.state;
      if (address.zipCode) addressData.zip_code = address.zipCode;
      if (address.country) addressData.country = address.country;
      if (address.phone) addressData.phone = address.phone;
      if (address.isDefault !== undefined) addressData.is_default = address.isDefault;

      await firstValueFrom(
        this.api.patch(`addresses/${id}`, addressData)
      );

      await this.loadAddresses();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async setDefaultAddress(id: string, type?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.api.patch(`addresses/${id}/set-default`, type ? { type } : {})
      );

      await this.loadAddresses();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteAddress(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.api.delete(`addresses/${id}`)
      );

      await this.loadAddresses();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private mapAddress(data: any): Address {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      firstName: data.first_name,
      lastName: data.last_name,
      street: data.street,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
      phone: data.phone,
      isDefault: data.is_default
    };
  }
}
