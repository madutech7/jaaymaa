import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

interface AuthResponse {
  user: any;
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize auth state from localStorage
    this.initPromise = this.initializeAuth();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private async initializeAuth(): Promise<void> {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(this.mapToUserModel(user));
        this.isAuthenticatedSubject.next(true);
        
        // Refresh user profile from backend
        await this.loadUserProfile();
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        this.clearAuthState();
      }
    }
  }

  /**
   * Wait for auth initialization to complete
   */
  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus(): Promise<boolean> {
    await this.waitForInit();
    return this.isAuthenticated;
  }

  /**
   * Register new user
   */
  async signUp(email: string, password: string, userData: any) {
    try {
      const registerData = {
        email,
        password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone
      };

      const response = await firstValueFrom(
        this.api.post<AuthResponse>('auth/register', registerData)
      );

      this.handleAuthResponse(response);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string) {
    try {
      const response = await firstValueFrom(
        this.api.post<AuthResponse>('auth/login', { email, password })
      );

      this.handleAuthResponse(response);
      return { success: true };
    } catch (error: any) {
      // Handle 401 Unauthorized specifically
      if (error?.status === 401 || error?.error?.statusCode === 401) {
        return { 
          success: false, 
          error: 'Email ou mot de passe incorrect' 
        };
      }
      
      // Handle other errors
      const errorMessage = error?.error?.message || error?.message || 'Erreur de connexion';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out user
   */
  async signOut() {
    try {
      this.clearAuthState();
      this.router.navigate(['/']);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string) {
    try {
      await firstValueFrom(
        this.api.post('auth/forgot-password', { email })
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load current user profile from backend
   */
  async loadUserProfile(userId?: string) {
    try {
      const user = await firstValueFrom(
        this.api.get<any>('users/me')
      );

      if (user) {
        const mappedUser = this.mapToUserModel(user);
        this.currentUserSubject.next(mappedUser);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.clearAuthState();
    }
  }

  /**
   * Sign in with Google - redirects to backend OAuth endpoint
   */
  async signInWithGoogle() {
    try {
      // Get returnUrl from current route or default
      const currentUrl = this.router.url;
      const returnUrl = currentUrl.includes('returnUrl') 
        ? decodeURIComponent(currentUrl.split('returnUrl=')[1].split('&')[0])
        : '/account/dashboard';
      
      // Store returnUrl in localStorage to retrieve it after OAuth callback
      localStorage.setItem('google_oauth_return_url', returnUrl);
      
      // Redirect to backend Google OAuth endpoint
      // The backend will handle the OAuth flow and redirect to callback
      const apiUrl = this.api['baseUrl'] || 'http://localhost:3000/api';
      const googleAuthUrl = `${apiUrl}/auth/google`;
      
      window.location.href = googleAuthUrl;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur lors de la connexion Google' };
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(userData: Partial<User>) {
    try {
      const updateData: any = {};
      
      if (userData.firstName) updateData.first_name = userData.firstName;
      if (userData.lastName) updateData.last_name = userData.lastName;
      if (userData.phone) updateData.phone = userData.phone;
      if (userData.avatar) updateData.avatar_url = userData.avatar;

      const user = await firstValueFrom(
        this.api.patch<any>('users/me', updateData)
      );

      const mappedUser = this.mapToUserModel(user);
      this.currentUserSubject.next(mappedUser);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, data: mappedUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user addresses
   */
  async getUserAddresses(type?: 'billing' | 'shipping') {
    try {
      const params = type ? { type } : {};
      const addresses = await firstValueFrom(
        this.api.get<any[]>('addresses', params)
      );
      return addresses || [];
    } catch (error) {
      console.error('Error loading addresses:', error);
      return [];
    }
  }

  /**
   * Get default address
   */
  async getDefaultAddress(type: 'billing' | 'shipping') {
    try {
      const addresses = await this.getUserAddresses(type);
      // Map addresses to match the expected format
      const mappedAddresses = addresses.map((addr: any) => ({
        ...addr,
        isDefault: addr.is_default || addr.isDefault
      }));
      return mappedAddresses.find((addr: any) => addr.isDefault || addr.is_default) || null;
    } catch (error) {
      console.error('Error loading default address:', error);
      return null;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.api.post('auth/change-password', {
          currentPassword,
          newPassword
        })
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save new address
   */
  async saveAddress(address: any) {
    if (!this.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
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
        is_default: address.isDefault || false
      };

      const data = await firstValueFrom(
        this.api.post<any>('addresses', addressData)
      );

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle authentication response
   */
  private handleAuthResponse(response: AuthResponse) {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    const mappedUser = this.mapToUserModel(response.user);
    this.currentUserSubject.next(mappedUser);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Clear authentication state
   */
  private clearAuthState() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Map backend user data to frontend User model
   */
  private mapToUserModel(data: any): User {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      avatar: data.avatar_url,
      role: data.role,
      loyaltyPoints: data.loyalty_points || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Getters
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}
