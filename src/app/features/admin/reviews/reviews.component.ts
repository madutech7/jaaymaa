import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { firstValueFrom } from 'rxjs';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  productName: string;
  productImage: string;
  userName: string;
  userEmail: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class AdminReviewsComponent implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  isLoading = true;
  showModal = false;
  selectedReview: Review | null = null;
  
  // Filters
  searchQuery = '';
  ratingFilter = '';
  verifiedFilter = '';

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadReviews();
  }

  async loadReviews() {
    try {
      this.isLoading = true;
      const data = await firstValueFrom(
        this.api.get<any[]>('reviews')
      );

      this.reviews = (data || []).map((review: any) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verifiedPurchase: review.verified_purchase || false,
        helpfulCount: review.helpful_count || 0,
        createdAt: new Date(review.created_at),
        productName: review.product?.name || '',
        productImage: review.product?.images?.[0]?.url || review.product?.images?.[0] || '',
        userName: `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.trim() || 'Anonyme',
        userEmail: review.user?.email || ''
      }));

      this.filteredReviews = [...this.reviews];
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      this.toastService.info('Erreur lors du chargement des avis: ' + (error.message || 'Erreur inconnue'));
    } finally {
      this.isLoading = false;
    }
  }

  filterReviews() {
    this.filteredReviews = this.reviews.filter(review => {
      const matchesSearch = !this.searchQuery || 
        review.productName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        review.userName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesRating = !this.ratingFilter || review.rating === parseInt(this.ratingFilter);
      
      const matchesVerified = !this.verifiedFilter || 
        (this.verifiedFilter === 'true' && review.verifiedPurchase) ||
        (this.verifiedFilter === 'false' && !review.verifiedPurchase);
      
      return matchesSearch && matchesRating && matchesVerified;
    });
  }

  onSearchChange() {
    this.filterReviews();
  }

  onRatingFilterChange() {
    this.filterReviews();
  }

  onVerifiedFilterChange() {
    this.filterReviews();
  }

  openReviewModal(review: Review) {
    this.selectedReview = review;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedReview = null;
  }

  async deleteReview(review: Review) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer l\'avis',
      message: `Êtes-vous sûr de vouloir supprimer cet avis de "${review.userName}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(
        this.api.delete(`reviews/${review.id}`)
      );

      this.toastService.success('Avis supprimé avec succès!');
      await this.loadReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      this.toastService.info('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  }

  async toggleVerifiedPurchase(review: Review) {
    try {
      await firstValueFrom(
        this.api.patch(`reviews/${review.id}`, {
          verified_purchase: !review.verifiedPurchase
        })
      );

      await this.loadReviews();
    } catch (error: any) {
      console.error('Error updating review:', error);
      this.toastService.info('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  }

  getRatingStars(rating: number): string[] {
    return Array(5).fill('').map((_, i) => i < rating ? 'full' : 'empty');
  }

  getRatingColor(rating: number): string {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  }

  getAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    return this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
  }

  getRatingDistribution(): { rating: number; count: number; percentage: number }[] {
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = this.reviews.filter(r => r.rating === rating).length;
      const percentage = this.reviews.length > 0 ? (count / this.reviews.length) * 100 : 0;
      return { rating, count, percentage };
    });
    return distribution;
  }

  getVerifiedPercentage(): number {
    if (this.reviews.length === 0) return 0;
    const verifiedCount = this.reviews.filter(r => r.verifiedPurchase).length;
    return (verifiedCount / this.reviews.length) * 100;
  }

  getFiveStarPercentage(): number {
    if (this.reviews.length === 0) return 0;
    const fiveStarCount = this.reviews.filter(r => r.rating === 5).length;
    return (fiveStarCount / this.reviews.length) * 100;
  }
}

