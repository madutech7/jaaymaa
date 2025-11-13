import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;
  isLoading = false;
  error = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ,
    private toastService: ToastService
  ) {}

  async onSubmit() {
    this.error = '';

    // Validation
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    if (!this.acceptTerms) {
      this.error = 'Veuillez accepter les conditions d\'utilisation';
      return;
    }

    try {
      this.isLoading = true;
      
      const result = await this.authService.signUp(this.email, this.password, {
        firstName: this.firstName,
        lastName: this.lastName
      });
      
      if (result.success) {
        this.toastService.success('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
        this.router.navigate(['/auth/login']);
      } else {
        this.error = result.error || 'Erreur lors de la création du compte';
      }
    } catch (error: any) {
      this.error = error.message || 'Erreur lors de la création du compte';
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      this.error = '';
      
      const result = await this.authService.signInWithGoogle();
      
      if (result.success) {
        // La redirection se fait automatiquement via Supabase OAuth
        // L'utilisateur sera redirigé vers /auth/callback puis vers /account/dashboard
      } else {
        this.error = result.error || 'Erreur de connexion Google';
      }
    } catch (error: any) {
      this.error = error.message || 'Erreur de connexion Google';
    } finally {
      this.isLoading = false;
    }
  }
}

