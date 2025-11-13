import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AddressService } from '../../../core/services/address.service';
import { User, Address } from '../../../core/models/user.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  activeTab: 'profile' | 'addresses' | 'security' = 'profile';
  currentUser: User | null = null;
  isSaving = false;
  showAddressForm = false;
  isUploadingAvatar = false;
  avatarUrl: string | null = null;

  tabs = [
    { id: 'profile' as const, label: 'Profil' },
    { id: 'addresses' as const, label: 'Adresses' },
    { id: 'security' as const, label: 'Sécurité' }
  ];

  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  addressForm = {
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'France',
    type: 'shipping' as 'billing' | 'shipping',
    isDefault: false
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  addresses: Address[] = [];

  constructor(
    private authService: AuthService,
    private addressService: AddressService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.profileForm = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          phone: user.phone || ''
        };
        this.avatarUrl = user.avatar || null;
      }
    });

    this.loadAddresses();
  }

  private async loadAddresses(): Promise<void> {
    try {
      this.addresses = await this.addressService.loadAddresses();
    } catch (error) {
      console.error('Erreur lors du chargement des adresses:', error);
    }
  }

  async updateProfile(): Promise<void> {
    this.isSaving = true;
    try {
      if (!this.currentUser) return;

      const result = await this.authService.updateProfile({
        firstName: this.profileForm.firstName,
        lastName: this.profileForm.lastName,
        phone: this.profileForm.phone
      });

      if (result.success) {
        this.toastService.success('Profil mis à jour avec succès !');
      } else {
        this.toastService.info('Erreur lors de la mise à jour: ' + result.error);
      }
    } catch (error: any) {
      this.toastService.info('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  async addAddress(): Promise<void> {
    try {
      if (!this.currentUser) return;

      const result = await this.addressService.createAddress({
        type: this.addressForm.type,
        firstName: this.addressForm.firstName,
        lastName: this.addressForm.lastName,
        phone: this.addressForm.phone,
        street: this.addressForm.street,
        city: this.addressForm.city,
        state: this.addressForm.state,
        zipCode: this.addressForm.zipCode,
        country: this.addressForm.country,
        isDefault: this.addressForm.isDefault
      });

      if (result.success) {
        // Reset form
        this.addressForm = {
          firstName: '',
          lastName: '',
          phone: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'France',
          type: 'shipping',
          isDefault: false
        };
        this.showAddressForm = false;

        // Recharger les adresses
        await this.loadAddresses();

        this.toastService.success('Adresse ajoutée avec succès !');
      } else {
        this.toastService.info('Erreur lors de l\'ajout de l\'adresse: ' + result.error);
      }
    } catch (error: any) {
      this.toastService.info('Erreur lors de l\'ajout de l\'adresse: ' + error.message);
    }
  }

  async updatePassword(): Promise<void> {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toastService.warning('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.toastService.warning('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    this.isSaving = true;
    try {
      const result = await this.authService.changePassword(
        this.passwordForm.currentPassword,
        this.passwordForm.newPassword
      );

      if (result.success) {
        // Reset form
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };

        this.toastService.success('Mot de passe mis à jour avec succès !');
      } else {
        this.toastService.info('Erreur lors de la mise à jour du mot de passe: ' + result.error);
      }
    } catch (error: any) {
      this.toastService.info('Erreur lors de la mise à jour du mot de passe: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  async uploadAvatar(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file || !this.currentUser) {
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      this.toastService.warning('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.info('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    this.isUploadingAvatar = true;

    try {
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // TODO: Implement avatar upload via backend API
      // For now, we'll use a data URL as a temporary solution
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const dataUrl = e.target.result;
        
        // Update user profile with data URL (temporary solution)
        const result = await this.authService.updateProfile({
          avatar: dataUrl
        });

        if (result.success) {
          this.avatarUrl = dataUrl;
          this.toastService.success('Photo de profil mise à jour avec succès !');
        } else {
          this.toastService.info('Erreur lors de l\'upload: ' + result.error);
        }
      };
      reader.readAsDataURL(file);
      
      // Wait for file to be read
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });
    } catch (error: any) {
      console.error('Erreur upload avatar:', error);
      this.toastService.info('Erreur lors de l\'upload: ' + error.message);
    } finally {
      this.isUploadingAvatar = false;
      // Reset input
      target.value = '';
    }
  }

  triggerAvatarUpload(): void {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    fileInput?.click();
  }
}
