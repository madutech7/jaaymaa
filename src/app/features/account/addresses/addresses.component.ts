import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddressService } from '../../../core/services/address.service';
import { Address } from '../../../core/models/user.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss']
})
export class AddressesComponent implements OnInit {
  addresses: Address[] = [];
  isLoading = true;
  showModal = false;
  isEditMode = false;
  currentAddress: Partial<Address> = this.getEmptyAddress();

  constructor(
    private addressService: AddressService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadAddresses();
  }

  async loadAddresses() {
    try {
      this.isLoading = true;
      this.addresses = await this.addressService.loadAddresses();
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getShippingAddresses(): Address[] {
    return this.addresses.filter(a => a.type === 'shipping');
  }

  getBillingAddresses(): Address[] {
    return this.addresses.filter(a => a.type === 'billing');
  }

  openAddModal(type: 'shipping' | 'billing') {
    this.isEditMode = false;
    this.currentAddress = this.getEmptyAddress();
    this.currentAddress.type = type;
    this.showModal = true;
  }

  openEditModal(address: Address) {
    this.isEditMode = true;
    this.currentAddress = { ...address };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentAddress = this.getEmptyAddress();
  }

  async saveAddress() {
    if (!this.isValidAddress()) {
      this.toastService.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      let result;
      if (this.isEditMode && this.currentAddress.id) {
        result = await this.addressService.updateAddress(this.currentAddress.id, this.currentAddress);
      } else {
        result = await this.addressService.createAddress(this.currentAddress as Omit<Address, 'id' | 'userId'>);
      }

      if (result.success) {
        this.closeModal();
        await this.loadAddresses();
      } else {
        this.toastService.info('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      this.toastService.info('Une erreur est survenue');
    }
  }

  async deleteAddress(address: Address) {
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
      const result = await this.addressService.deleteAddress(address.id);
      if (result.success) {
        await this.loadAddresses();
      } else {
        this.toastService.info('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      this.toastService.info('Une erreur est survenue');
    }
  }

  async setDefault(address: Address) {
    try {
      const result = await this.addressService.setDefaultAddress(address.id, address.type);
      if (result.success) {
        await this.loadAddresses();
      } else {
        this.toastService.info('Erreur: ' + result.error);
      }
    } catch (error) {
      console.error('Error setting default:', error);
      this.toastService.info('Une erreur est survenue');
    }
  }

  private isValidAddress(): boolean {
    return !!(
      this.currentAddress.type &&
      this.currentAddress.firstName &&
      this.currentAddress.lastName &&
      this.currentAddress.street &&
      this.currentAddress.city &&
      this.currentAddress.state &&
      this.currentAddress.zipCode &&
      this.currentAddress.country &&
      this.currentAddress.phone
    );
  }

  private getEmptyAddress(): Partial<Address> {
    return {
      type: 'shipping',
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sénégal',
      phone: '',
      isDefault: false
    };
  }
}

