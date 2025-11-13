import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earn' | 'redeem';
  reason: string;
  orderId?: string;
  createdAt: Date;
}

export interface LoyaltyStats {
  totalPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private pointsSubject = new BehaviorSubject<number>(0);
  public points$ = this.pointsSubject.asObservable();

  // Points configuration
  private readonly POINTS_PER_FCFA = 1; // 1 point pour 100 FCFA dépensés
  private readonly POINTS_PER_REVIEW = 50;
  private readonly POINTS_REGISTRATION = 100;

  private api = inject(ApiService);

  constructor(
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadPoints();
      } else {
        this.pointsSubject.next(0);
      }
    });
  }

  async loadPoints(): Promise<number> {
    const user = this.authService.currentUser;
    if (!user) return 0;

    try {
      const userProfile = await firstValueFrom(
        this.api.get<any>('users/me')
      );

      const points = userProfile?.loyalty_points || 0;
      this.pointsSubject.next(points);
      return points;
    } catch (error: any) {
      console.error('Error loading points:', error);
      return 0;
    }
  }

  async addPoints(points: number, reason: string, orderId?: string): Promise<{ success: boolean; error?: string }> {
    const user = this.authService.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Get current points
      const currentPoints = await this.loadPoints();
      const newPoints = currentPoints + points;

      // Update user points via backend API
      await firstValueFrom(
        this.api.patch<any>('users/me', { loyalty_points: newPoints })
      );

      this.pointsSubject.next(newPoints);
      return { success: true };
    } catch (error: any) {
      console.error('Error adding points:', error);
      return { success: false, error: error.message };
    }
  }

  async redeemPoints(points: number, reason: string): Promise<{ success: boolean; error?: string; discount?: number }> {
    const user = this.authService.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const currentPoints = await this.loadPoints();

      if (currentPoints < points) {
        return { success: false, error: 'Points insuffisants' };
      }

      const newPoints = currentPoints - points;

      // Update user points via backend API
      await firstValueFrom(
        this.api.patch<any>('users/me', { loyalty_points: newPoints })
      );

      this.pointsSubject.next(newPoints);

      // Calculate discount (1 point = 1 FCFA)
      const discount = points;

      return { success: true, discount };
    } catch (error: any) {
      console.error('Error redeeming points:', error);
      return { success: false, error: error.message };
    }
  }

  calculatePointsForOrder(orderTotal: number): number {
    // 1 point per 100 FCFA spent
    return Math.floor(orderTotal / 100);
  }

  convertPointsToDiscount(points: number): number {
    // 1 point = 1 FCFA
    return points;
  }

  getTierFromPoints(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (points >= 10000) return 'platinum';
    if (points >= 5000) return 'gold';
    if (points >= 2000) return 'silver';
    return 'bronze';
  }

  getTierBenefits(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string[] {
    const benefits: { [key: string]: string[] } = {
      bronze: [
        '1 point = 1 FCFA',
        'Offres exclusives'
      ],
      silver: [
        '1 point = 1 FCFA',
        'Offres exclusives',
        'Livraison prioritaire',
        'Accès anticipé aux ventes'
      ],
      gold: [
        '1 point = 1,2 FCFA',
        'Offres exclusives',
        'Livraison prioritaire',
        'Accès anticipé aux ventes',
        'Support client prioritaire'
      ],
      platinum: [
        '1 point = 1,5 FCFA',
        'Offres exclusives',
        'Livraison express gratuite',
        'Accès anticipé aux ventes',
        'Support client VIP',
        'Cadeaux d\'anniversaire'
      ]
    };

    return benefits[tier] || benefits['bronze'];
  }

  getNextTier(currentTier: 'bronze' | 'silver' | 'gold' | 'platinum'): { tier: string; pointsNeeded: number } | null {
    const tiers: { [key: string]: { tier: string; pointsNeeded: number } | null } = {
      bronze: { tier: 'silver', pointsNeeded: 2000 },
      silver: { tier: 'gold', pointsNeeded: 5000 },
      gold: { tier: 'platinum', pointsNeeded: 10000 },
      platinum: null
    };

    return tiers[currentTier];
  }

  get currentPoints(): number {
    return this.pointsSubject.value;
  }
}

