import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account-layout.component.html',
  styleUrls: ['./account-layout.component.scss']
})
export class AccountLayoutComponent implements OnInit {
  currentUser: User | null = null;
  isMobileMenuOpen = false;

  navigationItems = [
    { path: '/account/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/account/orders', label: 'Mes commandes', icon: 'shopping_bag' },
    { path: '/account/wishlist', label: 'Ma wishlist', icon: 'favorite' },
    { path: '/account/settings', label: 'Paramètres', icon: 'settings' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  onNavigationClick(): void {
    // Fermer le menu mobile si ouvert lors de la navigation
    this.closeMobileMenu();
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/']);
    this.closeMobileMenu();
  }
}

