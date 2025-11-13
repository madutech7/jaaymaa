import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class AdminCustomersComponent implements OnInit {
  customers: any[] = [];
  isLoading = true;
  searchQuery = '';

  constructor(
    private userService: UserService,
    public currencyService: CurrencyService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadCustomers();
  }

  async loadCustomers() {
    try {
      this.isLoading = true;
      const users = await this.userService.getAllUsers();
      
      // Filter customers only
      this.customers = users
        .filter(user => user.role === 'customer')
        .map(user => ({
          ...user,
          first_name: user.firstName,
          last_name: user.lastName,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          orderCount: user.orderCount || 0
        }));
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get filteredCustomers() {
    return this.customers.filter(customer => {
      const searchLower = this.searchQuery.toLowerCase();
      return !this.searchQuery || 
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.first_name && customer.first_name.toLowerCase().includes(searchLower)) ||
        (customer.last_name && customer.last_name.toLowerCase().includes(searchLower));
    });
  }

  async toggleCustomerRole(customer: any) {
    const newRole = customer.role === 'customer' ? 'admin' : 'customer';
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Changer le rôle',
      message: `Voulez-vous vraiment changer le rôle de ${customer.email} en ${newRole} ?`,
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      type: 'warning'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      await this.userService.updateUser(customer.id, { role: newRole });
      await this.loadCustomers();
      this.toastService.success('Rôle mis à jour avec succès!');
    } catch (error: any) {
      console.error('Error updating role:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }
}
