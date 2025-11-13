import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { firstValueFrom } from 'rxjs';

interface AddressWithUser {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss']
})
export class AdminAddressesComponent implements OnInit {
  addresses: AddressWithUser[] = [];
  filteredAddresses: AddressWithUser[] = [];
  isLoading = true;
  searchQuery = '';
  filterType: 'all' | 'shipping' | 'billing' = 'all';

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadAddresses();
  }

  async loadAddresses() {
    try {
      this.isLoading = true;
      // Note: The current API endpoint only returns addresses for the current user
      // For admin view of all addresses, you may need an admin-specific endpoint
      const data = await firstValueFrom(
        this.api.get<any[]>('addresses')
      );

      this.addresses = (data || []).map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        userEmail: a.user?.email || 'N/A',
        userName: a.user ? `${a.user.first_name || ''} ${a.user.last_name || ''}`.trim() : 'N/A',
        type: a.type,
        firstName: a.first_name,
        lastName: a.last_name,
        street: a.street,
        city: a.city,
        state: a.state,
        zipCode: a.zip_code,
        country: a.country,
        phone: a.phone,
        isDefault: a.is_default || false,
        createdAt: new Date(a.created_at)
      }));

      this.applyFilters();
    } catch (error: any) {
      console.error('Error loading addresses:', error);
      this.toastService.info('Erreur lors du chargement des adresses: ' + (error.message || 'Erreur inconnue'));
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.addresses];

    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(a => a.type === this.filterType);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.userEmail.toLowerCase().includes(query) ||
        a.userName.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      );
    }

    this.filteredAddresses = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  async deleteAddress(id: string) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer l\'adresse',
      message: 'Êtes-vous sûr de vouloir supprimer cette adresse ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(
        this.api.delete(`addresses/${id}`)
      );

      await this.loadAddresses();
      this.toastService.success('Adresse supprimée avec succès');
    } catch (error: any) {
      console.error('Error deleting address:', error);
      this.toastService.info('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
    }
  }

  getTypeLabel(type: string): string {
    return type === 'shipping' ? 'Livraison' : 'Facturation';
  }

  getTypeBadgeClass(type: string): string {
    return type === 'shipping' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  }
}

