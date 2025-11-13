import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  transactionId: string;
  paymentProvider: 'stripe' | 'paypal' | 'wave' | 'orange_money' | 'cod';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  paymentMethodDetails?: any;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  
  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  /**
   * Créer une intention de paiement Stripe
   * Note: En production, cette fonction doit appeler un backend pour créer
   * l'intention de paiement côté serveur pour des raisons de sécurité.
   */
  async createStripePaymentIntent(amount: number, orderId: string): Promise<PaymentIntent | null> {
    try {
      // TODO: En production, remplacer par un appel à votre backend
      // const response = await fetch('/api/create-payment-intent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, orderId })
      // });
      // return await response.json();

      if (!environment.production) {
        this.toastService.warning('Mode simulation: Stripe Payment Intent (production: utiliser un backend)');
      }
      
      // Simulation pour développement
      return {
        clientSecret: `pi_simulation_${Date.now()}_secret`,
        amount: Math.round(amount * 100), // Stripe utilise les centimes
        currency: 'xof' // Franc CFA
      };
    } catch (error) {
      if (!environment.production) {
        console.error('Error creating payment intent:', error);
      }
      this.toastService.error('Erreur lors de la création de l\'intention de paiement');
      return null;
    }
  }

  /**
   * Traiter un paiement Wave Money (Sénégal)
   */
  async processWavePayment(amount: number, phoneNumber: string, orderId: string): Promise<boolean> {
    try {
      // Créer la transaction dans la base de données
      const transactionId = `wave_${Date.now()}`;
      
      await this.createPaymentTransaction(
        orderId,
        transactionId,
        'wave',
        amount,
        'XOF',
        'pending'
      );

      // Rediriger vers le lien de paiement Wave
      const wavePaymentUrl = environment.wave?.paymentUrl || 'https://pay.wave.com/m/M_sn_l1suFj7U33OF/c/sn/';
      
      // Ouvrir le lien Wave dans un nouvel onglet
      window.open(wavePaymentUrl, '_blank');

      return true;
    } catch (error) {
      if (!environment.production) {
        console.error('Error processing Wave payment:', error);
      }
      this.toastService.error('Erreur lors du traitement du paiement Wave');
      return false;
    }
  }

  /**
   * Traiter un paiement Orange Money (Sénégal)
   */
  async processOrangeMoneyPayment(amount: number, phoneNumber: string, orderId: string): Promise<boolean> {
    try {
      // TODO: Intégrer Orange Money API
      
      if (!environment.production) {
        this.toastService.warning('Mode simulation: Orange Money Payment');
      }
      
      const transactionId = `om_${Date.now()}`;
      
      await this.createPaymentTransaction(
        orderId,
        transactionId,
        'orange_money',
        amount,
        'XOF',
        'processing'
      );

      return true;
    } catch (error) {
      if (!environment.production) {
        console.error('Error processing Orange Money payment:', error);
      }
      this.toastService.error('Erreur lors du traitement du paiement Orange Money');
      return false;
    }
  }

  /**
   * Simuler un paiement carte bancaire (pour développement)
   */
  async simulateCardPayment(
    orderId: string,
    amount: number,
    cardNumber: string,
    expiryDate: string,
    cvv: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Simulation basique de validation
      if (cardNumber.length < 15 || cardNumber.length > 19) {
        return { success: false, error: 'Numéro de carte invalide' };
      }
      
      if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
        return { success: false, error: 'Date d\'expiration invalide' };
      }
      
      if (cvv.length < 3 || cvv.length > 4) {
        return { success: false, error: 'CVV invalide' };
      }

      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simuler un succès avec 95% de chance
      const success = Math.random() > 0.05;

      if (success) {
        const transactionId = `card_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.createPaymentTransaction(
          orderId,
          transactionId,
          'stripe',
          amount,
          'XOF',
          'succeeded',
          {
            cardLast4: cardNumber.slice(-4),
            cardType: this.detectCardType(cardNumber)
          }
        );

        return { success: true, transactionId };
      } else {
        return { success: false, error: 'Paiement refusé par la banque' };
      }
    } catch (error) {
      if (!environment.production) {
        console.error('Error simulating card payment:', error);
      }
      return { success: false, error: 'Erreur de traitement du paiement' };
    }
  }

  /**
   * Créer une transaction de paiement dans la base de données
   */
  async createPaymentTransaction(
    orderId: string,
    transactionId: string,
    provider: PaymentTransaction['paymentProvider'],
    amount: number,
    currency: string,
    status: PaymentTransaction['status'],
    paymentMethodDetails?: any,
    errorMessage?: string
  ): Promise<PaymentTransaction | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('payment_transactions')
        .insert({
          order_id: orderId,
          transaction_id: transactionId,
          payment_provider: provider,
          amount,
          currency,
          status,
          payment_method_details: paymentMethodDetails || null,
          error_message: errorMessage || null
        })
        .select()
        .single();

      if (error) {
        // Ne pas bloquer le processus si la transaction ne peut pas être enregistrée
        // L'erreur est silencieuse en production
        if (!environment.production) {
          console.warn('Warning: Could not create payment transaction record:', error.message);
        }
        return null;
      }

      return this.mapTransaction(data);
    } catch (error: any) {
      // Gérer les erreurs CSP et autres erreurs réseau gracieusement
      // Ne pas bloquer le processus de commande
      if (!environment.production) {
        const errorMsg = error?.message || 'Unknown error';
        if (errorMsg.includes('CSP') || errorMsg.includes('Content Security Policy')) {
          console.warn('Warning: Payment transaction logging blocked by CSP. This is non-critical.');
        } else {
          console.warn('Warning: Could not create payment transaction record:', errorMsg);
        }
      }
      return null;
    }
  }

  /**
   * Mettre à jour le statut d'une transaction
   */
  async updateTransactionStatus(
    transactionId: string,
    status: PaymentTransaction['status'],
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('payment_transactions')
        .update({
          status,
          error_message: errorMessage || null
        })
        .eq('transaction_id', transactionId);

      if (error) {
        if (!environment.production) {
          console.error('Error updating transaction status:', error);
        }
        return false;
      }

      return true;
    } catch (error) {
      if (!environment.production) {
        console.error('Error updating transaction status:', error);
      }
      return false;
    }
  }

  /**
   * Récupérer les transactions d'une commande
   */
  async getOrderTransactions(orderId: string): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        if (!environment.production) {
          console.error('Error fetching order transactions:', error);
        }
        return [];
      }

      return data ? data.map((t: any) => this.mapTransaction(t)) : [];
    } catch (error) {
      if (!environment.production) {
        console.error('Error fetching order transactions:', error);
      }
      return [];
    }
  }

  /**
   * Récupérer une transaction par ID
   */
  async getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        if (!environment.production) {
          console.error('Error fetching transaction:', error);
        }
        return null;
      }

      return data ? this.mapTransaction(data) : null;
    } catch (error) {
      if (!environment.production) {
        console.error('Error fetching transaction:', error);
      }
      return null;
    }
  }

  /**
   * Détecter le type de carte bancaire
   */
  private detectCardType(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanNumber.startsWith('4')) return 'Visa';
    if (cleanNumber.startsWith('5')) return 'Mastercard';
    if (cleanNumber.startsWith('3')) return 'American Express';
    if (cleanNumber.startsWith('6')) return 'Discover';
    
    return 'Unknown';
  }

  /**
   * Mapper les données Supabase vers le modèle PaymentTransaction
   */
  private mapTransaction(data: any): PaymentTransaction {
    return {
      id: data.id,
      orderId: data.order_id,
      transactionId: data.transaction_id,
      paymentProvider: data.payment_provider,
      amount: parseFloat(data.amount),
      currency: data.currency,
      status: data.status,
      paymentMethodDetails: data.payment_method_details,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Obtenir les méthodes de paiement disponibles au Sénégal
   */
  getAvailablePaymentMethods() {
    return [
      {
        id: 'cash_on_delivery',
        name: 'Paiement à la livraison',
        description: 'Payez en espèces à la réception',
        icon: '💵',
        icons: [],
        enabled: true,
        provider: 'cod'
      },
      {
        id: 'wave',
        name: 'Wave',
        description: 'Paiement mobile',
        icon: '',
        icons: ['/assets/wave.png'],
        enabled: true,
        provider: 'wave',
        countries: ['SN', 'CI']
      },
      {
        id: 'orange_money',
        name: 'Orange Money',
        description: 'Paiement mobile',
        icon: '',
        icons: ['/assets/OM.png'],
        enabled: true,
        provider: 'orange_money',
        countries: ['SN', 'CI', 'ML', 'BF']
      }
    ];
  }
}

