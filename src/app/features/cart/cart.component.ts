import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { CurrencyService } from '../../core/services/currency.service';
import { Cart, CartItem } from '../../core/models/cart.model';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  couponCode = '';
  isApplyingCoupon = false;

  constructor(
    private cartService: CartService,
    public currencyService: CurrencyService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }

  async updateQuantity(itemId: string, quantity: number) {
    await this.cartService.updateQuantity(itemId, quantity);
  }

  async removeItem(itemId: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Retirer l\'article',
      message: 'Êtes-vous sûr de vouloir retirer cet article ?',
      confirmText: 'Retirer',
      cancelText: 'Annuler',
      type: 'warning'
    });
    
    if (confirmed) {
      await this.cartService.removeFromCart(itemId);
    }
  }

  async applyCoupon() {
    if (this.isApplyingCoupon || !this.couponCode) return;
    
    try {
      this.isApplyingCoupon = true;
      const result = await this.cartService.applyCoupon(this.couponCode);
      if (result.success) {
        this.couponCode = '';
      }
    } finally {
      this.isApplyingCoupon = false;
    }
  }

  async removeCoupon() {
    await this.cartService.removeCoupon();
  }
}

