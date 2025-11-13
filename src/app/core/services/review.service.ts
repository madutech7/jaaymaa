import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  verifiedPurchasePercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const data = await firstValueFrom(
        this.api.get<any[]>('reviews', { product_id: productId })
      );

      return (data || []).map(r => ({
        id: r.id,
        productId: r.product_id,
        userId: r.user_id,
        userName: r.user_name || 'Anonyme',
        userAvatar: r.user_avatar,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        verifiedPurchase: r.verified_purchase || false,
        helpfulCount: r.helpful_count || 0,
        createdAt: new Date(r.created_at)
      }));
    } catch (error) {
      console.error('Error loading reviews:', error);
      return [];
    }
  }

  async getProductReviewStats(productId: string): Promise<ReviewStats> {
    const reviews = await this.getProductReviews(productId);
    
    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedPurchasePercentage: 0
      };
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const rating = r.rating as keyof typeof ratingDistribution;
      ratingDistribution[rating]++;
    });

    const verifiedCount = reviews.filter(r => r.verifiedPurchase).length;
    const verifiedPurchasePercentage = (verifiedCount / totalReviews) * 100;

    return {
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      ratingDistribution,
      verifiedPurchasePercentage: parseFloat(verifiedPurchasePercentage.toFixed(1))
    };
  }

  async createReview(
    productIdOrData: string | any,
    rating?: number,
    title?: string,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.authService.currentUser;
      if (!user) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      let reviewData: any;
      
      // Support both signatures
      if (typeof productIdOrData === 'string') {
        reviewData = {
          product_id: productIdOrData,
          rating,
          title,
          comment
        };
      } else {
        reviewData = {
          product_id: productIdOrData.productId,
          rating: productIdOrData.rating,
          title: productIdOrData.title,
          comment: productIdOrData.comment
        };
      }

      await firstValueFrom(
        this.api.post('reviews', reviewData)
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async canUserReview(productId: string): Promise<boolean> {
    // TODO: Implémenter la vérification côté backend
    // Pour l'instant, on retourne true si l'utilisateur est connecté
    return this.authService.isAuthenticated;
  }

  async updateReview(
    reviewId: string,
    rating: number,
    title: string,
    comment: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.api.patch(`reviews/${reviewId}`, {
          rating,
          title,
          comment
        })
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firstValueFrom(
        this.api.delete(`reviews/${reviewId}`)
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async markReviewHelpful(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would need a backend endpoint
      // For now, we'll just return success
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
