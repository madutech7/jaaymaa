import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { firstValueFrom } from 'rxjs';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  freeShippingThreshold: number | null;
  countries: string[];
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-shipping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.scss']
})
export class AdminShippingComponent implements OnInit {
  shippingMethods: ShippingMethod[] = [];
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  deletingMethodId: string | null = null;
  showModal = false;
  editMode = false;
  
  currentMethod = {
    id: '',
    name: '',
    description: '',
    price: 0,
    estimated_days_min: 1,
    estimated_days_max: 3,
    free_shipping_threshold: null as number | null,
    countries: ['SN'] as string[],
    is_active: true
  };

  availableCountries = [
    { code: 'SN', name: 'Sénégal' },
    { code: 'ML', name: 'Mali' },
    { code: 'CI', name: 'Côte d\'Ivoire' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'GN', name: 'Guinée' },
    { code: 'BJ', name: 'Bénin' },
    { code: 'TG', name: 'Togo' },
    { code: 'NE', name: 'Niger' }
  ];

  constructor(
    private api: ApiService,
    public currencyService: CurrencyService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadShippingMethods();
  }

  async loadShippingMethods() {
    try {
      this.isLoading = true;
      const data = await firstValueFrom(
        this.api.get<any[]>('shipping/admin')
      );

      this.shippingMethods = (data || []).map(method => ({
        id: method.id,
        name: method.name,
        description: method.description || '',
        price: parseFloat(method.price) || 0,
        estimatedDaysMin: method.estimated_days_min || 1,
        estimatedDaysMax: method.estimated_days_max || 3,
        freeShippingThreshold: method.free_shipping_threshold || null,
        countries: method.countries || [],
        isActive: method.is_active !== false,
        createdAt: new Date(method.created_at || Date.now())
      }));
    } catch (error) {
      console.error('Error loading shipping methods:', error);
    } finally {
      this.isLoading = false;
    }
  }

  openCreateModal() {
    this.editMode = false;
    this.currentMethod = {
      id: '',
      name: '',
      description: '',
      price: 0,
      estimated_days_min: 1,
      estimated_days_max: 3,
      free_shipping_threshold: null,
      countries: ['SN'],
      is_active: true
    };
    this.showModal = true;
  }

  openEditModal(method: ShippingMethod) {
    this.editMode = true;
    this.currentMethod = {
      id: method.id,
      name: method.name,
      description: method.description,
      price: method.price,
      estimated_days_min: method.estimatedDaysMin,
      estimated_days_max: method.estimatedDaysMax,
      free_shipping_threshold: method.freeShippingThreshold,
      countries: method.countries,
      is_active: method.isActive
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveShippingMethod() {
    if (this.isSaving) return;
    
    try {
      if (!this.currentMethod.name || this.currentMethod.price < 0) {
        this.toastService.warning('Le nom et un prix valide sont requis');
        return;
      }

      this.isSaving = true;

      const methodData = {
        name: this.currentMethod.name,
        description: this.currentMethod.description,
        price: this.currentMethod.price,
        estimated_days_min: this.currentMethod.estimated_days_min,
        estimated_days_max: this.currentMethod.estimated_days_max,
        free_shipping_threshold: this.currentMethod.free_shipping_threshold,
        countries: this.currentMethod.countries,
        is_active: this.currentMethod.is_active
      };

      if (this.editMode) {
        await firstValueFrom(
          this.api.patch<any>(`shipping/${this.currentMethod.id}`, methodData)
        );
        this.toastService.success('Méthode de livraison mise à jour avec succès!');
      } else {
        await firstValueFrom(
          this.api.post<any>('shipping', methodData)
        );
        this.toastService.success('Méthode de livraison créée avec succès!');
      }

      this.closeModal();
      await this.loadShippingMethods();
    } catch (error: any) {
      console.error('Error saving shipping method:', error);
      this.toastService.info('Erreur: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteShippingMethod(method: ShippingMethod) {
    if (this.isDeleting) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer la méthode de livraison',
      message: `Êtes-vous sûr de vouloir supprimer "${method.name}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      this.isDeleting = true;
      this.deletingMethodId = method.id;
      await firstValueFrom(
        this.api.delete<any>(`shipping/${method.id}`)
      );

      this.toastService.success('Méthode de livraison supprimée avec succès!');
      await this.loadShippingMethods();
    } catch (error: any) {
      console.error('Error deleting shipping method:', error);
      this.toastService.info('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      this.isDeleting = false;
      this.deletingMethodId = null;
    }
  }

  async toggleMethodStatus(method: ShippingMethod) {
    if (this.isSaving) return;
    
    try {
      this.isSaving = true;
      await firstValueFrom(
        this.api.patch<any>(`shipping/${method.id}`, { is_active: !method.isActive })
      );

      await this.loadShippingMethods();
    } catch (error: any) {
      console.error('Error updating status:', error);
      this.toastService.info('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      this.isSaving = false;
    }
  }

  toggleCountry(countryCode: string) {
    const index = this.currentMethod.countries.indexOf(countryCode);
    if (index > -1) {
      this.currentMethod.countries.splice(index, 1);
    } else {
      this.currentMethod.countries.push(countryCode);
    }
  }

  isCountrySelected(countryCode: string): boolean {
    return this.currentMethod.countries.includes(countryCode);
  }

  getCountryNames(countryCodes: string[]): string {
    return countryCodes
      .map(code => this.availableCountries.find(c => c.code === code)?.name || code)
      .join(', ');
  }
}

