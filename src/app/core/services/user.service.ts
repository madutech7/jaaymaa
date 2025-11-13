import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: string;
  loyaltyPoints?: number;
  orderCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  async getAllUsers(): Promise<User[]> {
    try {
      const data = await firstValueFrom(
        this.api.get<any[]>('users')
      );

      const users = (data || []).map(this.mapUser);
      this.usersSubject.next(users);
      return users;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const data = await firstValueFrom(
        this.api.get<any>(`users/${id}`)
      );

      return data ? this.mapUser(data) : null;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  }

  async updateUser(id: string, userData: Partial<any>): Promise<User | null> {
    try {
      const data = await firstValueFrom(
        this.api.patch<any>(`users/${id}`, userData)
      );

      return data ? this.mapUser(data) : null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.api.delete(`users/${id}`)
      );

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  private mapUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      avatar: data.avatar_url,
      role: data.role,
      loyaltyPoints: data.loyalty_points || 0,
      orderCount: data.orderCount || data.order_count || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}










