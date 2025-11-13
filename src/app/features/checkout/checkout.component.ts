import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ShippingService, ShippingMethod } from '../../core/services/shipping.service';
import { CurrencyService } from '../../core/services/currency.service';
import { PaymentService } from '../../core/services/payment.service';
import { EmailService } from '../../core/services/email.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { CartItem } from '../../core/models/cart.model';
import { Address } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon?: string;
  icons?: string[];
  provider?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, AfterViewChecked {
  currentStep = 1;
  private shouldScrollToTop = false;
  cartItems: CartItem[] = [];
  cart: any = null;
  isProcessing = false;
  sameAsShipping = true;
  acceptTerms = false;
  saveShippingAddress = false;
  saveBillingAddress = false;
  couponCode = '';
  appliedCoupon: any = null;

  checkoutForm = {
    email: '',
    subscribeNewsletter: false,
    shippingAddress: {
      type: 'shipping' as 'shipping' | 'billing',
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sénégal',
      phone: ''
    },
    billingAddress: {
      type: 'billing' as 'shipping' | 'billing',
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sénégal',
      phone: ''
    },
    shippingMethod: '',
    paymentMethod: '',
    notes: ''
  };

  paymentForm = {
    mobileNumber: '' // Pour Wave et Orange Money
  };

  shippingMethods: ShippingMethod[] = [];
  isLoadingShipping = true;
  paymentMethods: PaymentMethod[] = [];
  selectedShippingMethod: ShippingMethod | null = null;
  selectedPaymentMethod: PaymentMethod | null = null;
  paymentError = '';
  paymentSuccess = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private shippingService: ShippingService,
    public currencyService: CurrencyService,
    private router: Router,
    private paymentService: PaymentService,
    private emailService: EmailService,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private viewportScroller: ViewportScroller
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadCartItems();
    await this.loadUserInfo();
    await this.loadShippingMethods();
    this.loadPaymentMethods(); // Charger les méthodes de paiement
  }

  async loadShippingMethods(): Promise<void> {
    try {
      this.isLoadingShipping = true;
      const country = this.checkoutForm.shippingAddress.country || 'Sénégal';
      // Map country name to code
      const countryCode = country === 'Sénégal' ? 'SN' : 'SN';
      const allMethods = await this.shippingService.loadShippingMethods(countryCode);
      
      // Filter shipping methods based on cart total
      const subtotal = this.getSubtotal();
      this.shippingMethods = allMethods.filter((method: any) => {
        // If method has a free shipping threshold, only show if subtotal meets it
        if (method.freeShippingThreshold && method.price === 0) {
          return subtotal >= method.freeShippingThreshold;
        }
        // Always show paid methods
        return true;
      });
      
      // Set default shipping method
      if (this.shippingMethods.length > 0) {
        this.selectedShippingMethod = this.shippingMethods[0];
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error);
    } finally {
      this.isLoadingShipping = false;
    }
  }

  loadPaymentMethods(): void {
    this.paymentMethods = this.paymentService.getAvailablePaymentMethods();
  }

  private loadCartItems(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cartItems = cart.items;
      
      // Redirect to cart if empty
      if (this.cartItems.length === 0) {
        this.router.navigate(['/cart']);
      }
    });
  }

  private async loadUserInfo(): Promise<void> {
    const user = this.authService.currentUser;
    
    if (user) {
      this.checkoutForm.email = user.email;
      
      // Load default shipping address first (this will fill all address fields if available)
      await this.loadDefaultAddresses();
      
      // Fill user info only if address fields are still empty after loading default address
      if (!this.checkoutForm.shippingAddress.firstName && user.firstName) {
        this.checkoutForm.shippingAddress.firstName = user.firstName;
      }
      if (!this.checkoutForm.shippingAddress.lastName && user.lastName) {
        this.checkoutForm.shippingAddress.lastName = user.lastName;
      }
      if (!this.checkoutForm.shippingAddress.phone && user.phone) {
        this.checkoutForm.shippingAddress.phone = user.phone;
      }
    } else {
      // If no user, subscribe to wait for user to be loaded
      return new Promise<void>((resolve) => {
        const subscription = this.authService.currentUser$.subscribe(async (user) => {
          if (user) {
            this.checkoutForm.email = user.email;
            
            // Load default shipping address first
            await this.loadDefaultAddresses();
            
            // Fill user info only if address fields are still empty
            if (!this.checkoutForm.shippingAddress.firstName && user.firstName) {
              this.checkoutForm.shippingAddress.firstName = user.firstName;
            }
            if (!this.checkoutForm.shippingAddress.lastName && user.lastName) {
              this.checkoutForm.shippingAddress.lastName = user.lastName;
            }
            if (!this.checkoutForm.shippingAddress.phone && user.phone) {
              this.checkoutForm.shippingAddress.phone = user.phone;
            }
            
            subscription.unsubscribe();
            resolve();
          }
        });
      });
    }
  }

  private async loadDefaultAddresses(): Promise<void> {
    try {
      const user = this.authService.currentUser;
      if (!user) {
        if (!environment.production) {
          console.log('No user found, cannot load default addresses');
        }
        return;
      }

      // Load default shipping address
      let shippingAddress = await this.authService.getDefaultAddress('shipping');
      
      // If no default address, try to load any shipping address
      if (!shippingAddress) {
        const addresses = await this.authService.getUserAddresses('shipping');
        if (addresses && addresses.length > 0) {
          shippingAddress = addresses[0]; // Use the first one
        }
      }

      if (shippingAddress) {
        if (!environment.production) {
          console.log('Loading shipping address:', shippingAddress);
        }
        this.checkoutForm.shippingAddress = {
          type: 'shipping',
          firstName: shippingAddress.first_name || '',
          lastName: shippingAddress.last_name || '',
          street: shippingAddress.street || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          zipCode: shippingAddress.zip_code || '',
          country: shippingAddress.country || 'Sénégal',
          phone: shippingAddress.phone || ''
        };
      } else {
        if (!environment.production) {
          console.log('No shipping address found for user');
        }
      }

      // Load default billing address
      let billingAddress = await this.authService.getDefaultAddress('billing');
      
      // If no default billing address, try to load any billing address
      if (!billingAddress) {
        const addresses = await this.authService.getUserAddresses('billing');
        if (addresses && addresses.length > 0) {
          billingAddress = addresses[0]; // Use the first one
        }
      }

      if (billingAddress) {
        if (!environment.production) {
          console.log('Loading billing address:', billingAddress);
        }
        this.checkoutForm.billingAddress = {
          type: 'billing',
          firstName: billingAddress.first_name || '',
          lastName: billingAddress.last_name || '',
          street: billingAddress.street || '',
          city: billingAddress.city || '',
          state: billingAddress.state || '',
          zipCode: billingAddress.zip_code || '',
          country: billingAddress.country || 'Sénégal',
          phone: billingAddress.phone || ''
        };
        this.sameAsShipping = false;
      } else if (shippingAddress) {
        // If no billing address, use shipping as billing by default
        this.sameAsShipping = true;
        this.toggleBillingAddress();
      }
    } catch (error) {
      if (!environment.production) {
        console.error('Error loading default addresses:', error);
      }
    }
  }

  toggleBillingAddress(): void {
    if (this.sameAsShipping) {
      this.checkoutForm.billingAddress = { ...this.checkoutForm.shippingAddress };
      this.checkoutForm.billingAddress.type = 'billing';
    }
  }

  selectShippingMethod(method: ShippingMethod): void {
    this.selectedShippingMethod = method;
    this.checkoutForm.shippingMethod = method.id;
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
    this.checkoutForm.paymentMethod = method.id;
    // Clear mobile number when switching payment methods
    if (method.id !== 'wave' && method.id !== 'orange_money') {
      this.paymentForm.mobileNumber = '';
    }
  }

  isStep1Valid(): boolean {
    const shipping = this.checkoutForm.shippingAddress;
    return !!(this.checkoutForm.email && 
              shipping.firstName && 
              shipping.lastName && 
              shipping.street && 
              shipping.city && 
              shipping.zipCode && 
              shipping.phone);
  }

  prevStep(): void {
    this.previousStep();
  }

  getSelectedShippingPrice(): number {
    return this.selectedShippingMethod?.price || 0;
  }

  calculateTotal(): number {
    return this.getFinalTotal();
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep < 3) {
        this.currentStep++;
        this.scrollToTop();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    // Marquer qu'on doit scroller après la mise à jour de la vue
    this.shouldScrollToTop = true;
    
    // Utiliser requestAnimationFrame pour s'assurer que le DOM est mis à jour
    requestAnimationFrame(() => {
      // Utiliser ViewportScroller d'Angular pour un scroll plus fiable
      this.viewportScroller.scrollToPosition([0, 0]);
      
      // Fallback avec window.scrollTo pour une meilleure compatibilité
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  ngAfterViewChecked(): void {
    // Si on doit scroller et que la vue est mise à jour
    if (this.shouldScrollToTop) {
      // Utiliser setTimeout pour s'assurer que le contenu est complètement rendu
      setTimeout(() => {
        this.viewportScroller.scrollToPosition([0, 0]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.shouldScrollToTop = false;
      }, 150);
    }
  }

  private validateCurrentStep(): boolean {
    if (this.currentStep === 1) {
      // Validate contact and shipping address
      if (!this.checkoutForm.email) {
        return false;
      }
      
      const shipping = this.checkoutForm.shippingAddress;
      if (!shipping.firstName || !shipping.lastName || !shipping.street || 
          !shipping.city || !shipping.zipCode || !shipping.state || !shipping.phone) {
        return false;
      }
      
      // Copy to billing if same as shipping
      if (this.sameAsShipping) {
        this.checkoutForm.billingAddress = { ...shipping };
        this.checkoutForm.billingAddress.type = 'billing';
      } else {
        const billing = this.checkoutForm.billingAddress;
        if (!billing.firstName || !billing.lastName || !billing.street || 
            !billing.city || !billing.zipCode || !billing.state || !billing.phone) {
          return false;
        }
      }
    }
    
    if (this.currentStep === 2) {
      // Validate shipping method
      if (!this.selectedShippingMethod) {
        return false;
      }
    }
    
    return true;
  }

  applyCoupon(): void {
    if (!this.couponCode) return;
    
    // Simple mock coupon validation
    const validCoupons: any = {
      'BIENVENUE10': { code: 'BIENVENUE10', discount: 10, type: 'percentage' },
      'PROMO20': { code: 'PROMO20', discount: 20, type: 'percentage' },
      'FIXE5': { code: 'FIXE5', discount: 5, type: 'fixed' }
    };
    
    const coupon = validCoupons[this.couponCode.toUpperCase()];
    
    if (coupon) {
      this.appliedCoupon = coupon;
    }
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getDiscount(): number {
    if (!this.appliedCoupon) return 0;
    
    const subtotal = this.getSubtotal();
    
    if (this.appliedCoupon.type === 'percentage') {
      return (subtotal * this.appliedCoupon.discount) / 100;
    } else {
      return this.appliedCoupon.discount;
    }
  }

  getTax(): number {
    return 0; // No tax
  }

  getShipping(): number {
    // Simply return the price of the selected shipping method
    return this.selectedShippingMethod?.price || 0;
  }

  getFinalTotal(): number {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscount();
    const shipping = this.getShipping();
    
    return Number((subtotal - discount + shipping).toFixed(2));
  }

  async placeOrder(): Promise<void> {
    if (!this.validateCurrentStep()) {
      this.paymentError = 'Veuillez remplir tous les champs obligatoires';
      return;
    }
    
    if (!this.selectedPaymentMethod) {
      this.paymentError = 'Veuillez sélectionner une méthode de paiement';
      return;
    }
    
    if (!this.acceptTerms) {
      this.paymentError = 'Veuillez accepter les conditions générales de vente';
      return;
    }
    
    // Validate payment method specific fields
    if (this.selectedPaymentMethod.id === 'wave' || this.selectedPaymentMethod.id === 'orange_money') {
      if (!this.paymentForm.mobileNumber) {
        this.paymentError = 'Veuillez saisir votre numéro de téléphone';
        return;
      }
    }
    
    this.isProcessing = true;
    this.paymentError = '';
    
    try {
      // Convert form addresses to Address type
      const shippingAddress: Address = {
        id: '',
        userId: '',
        type: 'shipping',
        firstName: this.checkoutForm.shippingAddress.firstName,
        lastName: this.checkoutForm.shippingAddress.lastName,
        street: this.checkoutForm.shippingAddress.street,
        city: this.checkoutForm.shippingAddress.city,
        state: this.checkoutForm.shippingAddress.state,
        zipCode: this.checkoutForm.shippingAddress.zipCode,
        country: this.checkoutForm.shippingAddress.country,
        phone: this.checkoutForm.shippingAddress.phone,
        isDefault: false
      };
      
      const billingAddress: Address = {
        id: '',
        userId: '',
        type: 'billing',
        firstName: this.checkoutForm.billingAddress.firstName,
        lastName: this.checkoutForm.billingAddress.lastName,
        street: this.checkoutForm.billingAddress.street,
        city: this.checkoutForm.billingAddress.city,
        state: this.checkoutForm.billingAddress.state,
        zipCode: this.checkoutForm.billingAddress.zipCode,
        country: this.checkoutForm.billingAddress.country,
        phone: this.checkoutForm.billingAddress.phone,
        isDefault: false
      };
      
      // Create order
      const result = await this.orderService.createOrder(
        shippingAddress,
        billingAddress,
        this.selectedPaymentMethod.name,
        this.checkoutForm.notes
      );
      
      if (result.success && result.orderId) {
        // Traiter le paiement selon la méthode choisie
        const paymentResult = await this.processPayment(result.orderId, this.getFinalTotal());

        // Pour Wave et Orange Money, le paiement est en attente
        if (paymentResult.requiresExternalAction) {
          const user = this.authService.currentUser;
          if (user) {
            // Notification pour paiement en attente
            await this.notificationService.createNotification({
              type: 'order',
              title: 'Commande en attente de paiement ⏳',
              message: `Veuillez compléter le paiement de ${this.getFinalTotal().toFixed(0)} FCFA pour finaliser votre commande.`,
              link: `/account/orders/${result.orderId}`
            });
          }

          // Save addresses if requested
          if (this.saveShippingAddress) {
            await this.authService.saveAddress({
              type: 'shipping',
              firstName: this.checkoutForm.shippingAddress.firstName,
              lastName: this.checkoutForm.shippingAddress.lastName,
              street: this.checkoutForm.shippingAddress.street,
              city: this.checkoutForm.shippingAddress.city,
              state: this.checkoutForm.shippingAddress.state,
              zipCode: this.checkoutForm.shippingAddress.zipCode,
              country: this.checkoutForm.shippingAddress.country,
              phone: this.checkoutForm.shippingAddress.phone,
              isDefault: true
            });
          }

          if (this.saveBillingAddress && !this.sameAsShipping) {
            await this.authService.saveAddress({
              type: 'billing',
              firstName: this.checkoutForm.billingAddress.firstName,
              lastName: this.checkoutForm.billingAddress.lastName,
              street: this.checkoutForm.billingAddress.street,
              city: this.checkoutForm.billingAddress.city,
              state: this.checkoutForm.billingAddress.state,
              zipCode: this.checkoutForm.billingAddress.zipCode,
              country: this.checkoutForm.billingAddress.country,
              phone: this.checkoutForm.billingAddress.phone,
              isDefault: true
            });
          }

          // NE PAS vider le panier - l'utilisateur n'a pas encore payé
          
          // Rediriger vers la page de la commande (pas de confirmation)
          this.router.navigate(['/account/orders', result.orderId]);
        } else if (paymentResult.success) {
          // Paiement en espèces - en attente de validation admin
          const user = this.authService.currentUser;
          if (user) {
            const orderNumber = result.orderId.substring(0, 8).toUpperCase();
            
            // Créer une notification pour informer que la commande est en attente de validation
            await this.notificationService.createNotification({
              type: 'order',
              title: 'Commande en attente de validation ⏳',
              message: `Votre commande a été créée. Le paiement en espèces sera validé par l'admin. Montant: ${this.getFinalTotal().toFixed(0)} FCFA`,
              link: `/account/orders/${result.orderId}`
            });
          }

          // Save addresses if requested
          if (this.saveShippingAddress) {
            await this.authService.saveAddress({
              type: 'shipping',
              firstName: this.checkoutForm.shippingAddress.firstName,
              lastName: this.checkoutForm.shippingAddress.lastName,
              street: this.checkoutForm.shippingAddress.street,
              city: this.checkoutForm.shippingAddress.city,
              state: this.checkoutForm.shippingAddress.state,
              zipCode: this.checkoutForm.shippingAddress.zipCode,
              country: this.checkoutForm.shippingAddress.country,
              phone: this.checkoutForm.shippingAddress.phone,
              isDefault: true
            });
          }

          if (this.saveBillingAddress && !this.sameAsShipping) {
            await this.authService.saveAddress({
              type: 'billing',
              firstName: this.checkoutForm.billingAddress.firstName,
              lastName: this.checkoutForm.billingAddress.lastName,
              street: this.checkoutForm.billingAddress.street,
              city: this.checkoutForm.billingAddress.city,
              state: this.checkoutForm.billingAddress.state,
              zipCode: this.checkoutForm.billingAddress.zipCode,
              country: this.checkoutForm.billingAddress.country,
              phone: this.checkoutForm.billingAddress.phone,
              isDefault: true
            });
          }

          // Vider le panier car la commande est créée
          // Le paiement sera validé par l'admin plus tard
          await this.cartService.clearCart();

          // Redirect to order page
          this.paymentSuccess = true;
          this.router.navigate(['/account/orders', result.orderId]);
        } else {
          // Paiement échoué
          this.paymentError = 'Le paiement a échoué. Veuillez réessayer.';
        }
      } else {
        this.paymentError = result.error || 'Erreur lors de la création de la commande';
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      this.paymentError = error.message || 'Erreur inconnue';
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Traiter le paiement selon la méthode choisie
   */
  private async processPayment(orderId: string, amount: number): Promise<{ success: boolean; requiresExternalAction: boolean }> {
    try {
      const method = this.selectedPaymentMethod;
      if (!method) return { success: false, requiresExternalAction: false };

      switch (method.id) {
        case 'wave':
          // Paiement Wave Money - nécessite une action externe
          const waveSuccess = await this.paymentService.processWavePayment(
            amount,
            this.paymentForm.mobileNumber,
            orderId
          );
          return { success: waveSuccess, requiresExternalAction: true };

        case 'orange_money':
          // Paiement Orange Money - nécessite une action externe
          const omSuccess = await this.paymentService.processOrangeMoneyPayment(
            amount,
            this.paymentForm.mobileNumber,
            orderId
          );
          return { success: omSuccess, requiresExternalAction: true };

        case 'cash_on_delivery':
          // Paiement à la livraison - en attente de validation admin
          await this.paymentService.createPaymentTransaction(
            orderId,
            `cod_${Date.now()}`,
            'cod', // Provider Cash on Delivery
            amount,
            'XOF',
            'pending'
          );
          // Le paiement reste en "pending" jusqu'à validation admin
          return { success: true, requiresExternalAction: false };

        default:
          console.error('Unknown payment method:', method.id);
          return { success: false, requiresExternalAction: false };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, requiresExternalAction: false };
    }
  }
}
