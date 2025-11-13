import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthLoadingService } from '../interceptors/auth-loading.interceptor';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Wait for session to be fully initialized
    const isAuthenticated = await authService.checkAuthStatus();

    if (isAuthenticated) {
      return true;
    }

    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  } catch (error) {
    console.error('Auth guard error:', error);
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Wait for session AND user profile to be fully initialized
    const isAuthenticated = await authService.checkAuthStatus();

    if (!isAuthenticated) {
      // User not authenticated, redirect to login with returnUrl
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Wait for user profile to be loaded with retry mechanism
    let retries = 0;
    const maxRetries = 20; // 2 secondes maximum
    while (!authService.currentUser && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    // Final check - if still no user after retries, something is wrong
    if (!authService.currentUser) {
      console.error('Admin guard: Could not load user profile after retries');
      router.navigate(['/auth/login']);
      return false;
    }

    // Check if user has admin role
    if (!authService.isAdmin) {
      // User is authenticated but not admin, redirect to account dashboard
      router.navigate(['/account/dashboard']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Admin guard error:', error);
    router.navigate(['/auth/login']);
    return false;
  }
};

