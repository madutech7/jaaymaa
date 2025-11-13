import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Connexion en cours...</h2>
        <p class="text-gray-600">Veuillez patienter pendant que nous vous connectons.</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    try {
      // Get token and user from query params (from Google OAuth callback)
      const token = this.route.snapshot.queryParams['token'];
      const userStr = this.route.snapshot.queryParams['user'];
      const errorParam = this.route.snapshot.queryParams['error'];
      
      // Check for error first
      if (errorParam) {
        this.router.navigate(['/auth/login'], { 
          queryParams: { error: decodeURIComponent(errorParam) } 
        });
        return;
      }
      
      if (token && userStr) {
        try {
          // Handle Google OAuth callback
          const user = JSON.parse(decodeURIComponent(userStr));
          
          // Use AuthService to handle the response
          this.authService['handleAuthResponse']({
            user,
            access_token: token
          });
          
          // Get returnUrl from query params, localStorage, or default to dashboard
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] 
            || localStorage.getItem('google_oauth_return_url') 
            || '/account/dashboard';
          
          // Clear stored returnUrl
          localStorage.removeItem('google_oauth_return_url');
          
          this.router.navigateByUrl(returnUrl);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          this.router.navigate(['/auth/login'], { 
            queryParams: { error: 'Erreur lors du traitement des données' } 
          });
        }
      } else {
        // No token found, redirect to login
        this.router.navigate(['/auth/login'], { 
          queryParams: { error: 'Authentification échouée' } 
        });
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      this.router.navigate(['/auth/login'], { 
        queryParams: { error: 'Erreur lors de l\'authentification' } 
      });
    }
  }
}
