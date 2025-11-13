import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

interface Coupon {
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

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.scss']
})
export class AdminCouponsComponent implements OnInit {
  coupons: Coupon[] = [];
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  deletingCouponId: string | null = null;
  showModal = false;
  editMode = false;
  
  currentCoupon = {
    id: '',
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    min_purchase: null as number | null,
    max_discount: null as number | null,
    expires_at: null as string | null,
    usage_limit: null as number | null,
    is_active: true
  };

  constructor(
    private couponService: CouponService,
    public currencyService: CurrencyService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadCoupons();
  }

  async loadCoupons() {
    try {
      this.isLoading = true;
      this.coupons = await this.couponService.getCoupons();
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      this.isLoading = false;
    }
  }

  openCreateModal() {
    this.editMode = false;
    this.currentCoupon = {
      id: '',
      code: '',
      type: 'percentage',
      value: 0,
      min_purchase: null,
      max_discount: null,
      expires_at: null,
      usage_limit: null,
      is_active: true
    };
    this.showModal = true;
  }

  openEditModal(coupon: Coupon) {
    this.editMode = true;
    this.currentCoupon = {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_purchase: coupon.minPurchase || null,
      max_discount: coupon.maxDiscount || null,
      expires_at: coupon.expiresAt ? coupon.expiresAt.toISOString().split('T')[0] : null,
      usage_limit: coupon.usageLimit || null,
      is_active: coupon.isActive
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveCoupon() {
    if (this.isSaving) return;
    
    try {
      if (!this.currentCoupon.code || this.currentCoupon.value <= 0) {
        this.toastService.warning('Le code et la valeur sont requis');
        return;
      }

      this.isSaving = true;

      // Convert code to uppercase
      this.currentCoupon.code = this.currentCoupon.code.toUpperCase();

      const couponData = {
        code: this.currentCoupon.code,
        type: this.currentCoupon.type,
        value: this.currentCoupon.value,
        min_purchase: this.currentCoupon.min_purchase || null,
        max_discount: this.currentCoupon.max_discount || null,
        expires_at: this.currentCoupon.expires_at || null,
        usage_limit: this.currentCoupon.usage_limit || null,
        is_active: this.currentCoupon.is_active
      };

      if (this.editMode) {
        await this.couponService.updateCoupon(this.currentCoupon.id, couponData);
        this.toastService.success('Coupon mis à jour avec succès!');
      } else {
        await this.couponService.createCoupon(couponData);
        this.toastService.success('Coupon créé avec succès!');
      }

      this.closeModal();
      await this.loadCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      this.toastService.info('Erreur: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteCoupon(coupon: Coupon) {
    if (this.isDeleting) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer le coupon',
      message: `Êtes-vous sûr de vouloir supprimer le coupon "${coupon.code}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      this.isDeleting = true;
      this.deletingCouponId = coupon.id;
      await this.couponService.deleteCoupon(coupon.id);
      this.toastService.success('Coupon supprimé avec succès!');
      await this.loadCoupons();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      this.toastService.info('Erreur: ' + error.message);
    } finally {
      this.isDeleting = false;
      this.deletingCouponId = null;
    }
  }

  async toggleCouponStatus(coupon: Coupon) {
    if (this.isSaving) return;
    
    try {
      this.isSaving = true;
      await this.couponService.updateCoupon(coupon.id, { is_active: !coupon.isActive });
      await this.loadCoupons();
    } catch (error: any) {
      console.error('Error updating status:', error);
      this.toastService.info('Erreur: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  getDiscountDisplay(coupon: Coupon): string {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    } else {
      return this.currencyService.formatPrice(coupon.value);
    }
  }

  isExpired(coupon: Coupon): boolean {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  }

  isLimitReached(coupon: Coupon): boolean {
    if (!coupon.usageLimit) return false;
    return (coupon.usageCount || 0) >= coupon.usageLimit;
  }
}

