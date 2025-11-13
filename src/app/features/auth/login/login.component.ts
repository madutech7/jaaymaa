import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  isLoading = false;
  error = '';
  showPassword = false;
  returnUrl: string = '/account/dashboard'; // Default redirect

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
    // Get returnUrl from query params, default to dashboard
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/account/dashboard';
      
      // Show error if present
      if (params['error']) {
        this.error = decodeURIComponent(params['error']);
      }
    });
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }

    try {
      this.isLoading = true;
      this.error = '';
      
      const result = await this.authService.signIn(this.email, this.password);
      
      if (result.success) {
        // Redirect to returnUrl or default to dashboard
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.error = result.error || 'Email ou mot de passe incorrect';
      }
    } catch (error: any) {
      this.error = error?.error?.message || error?.message || 'Erreur de connexion';
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
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      this.error = error?.message || 'Erreur lors de la connexion Google';
      this.isLoading = false;
    }
  }

}

