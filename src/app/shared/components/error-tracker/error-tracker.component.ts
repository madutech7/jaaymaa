import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-error-tracker',
  standalone: true,
  template: '', // Pas de template visible
  styles: []
})
export class ErrorTrackerComponent implements OnInit {

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.setupErrorTracking();
  }

  private setupErrorTracking() {
    // Fonction pour vérifier si une erreur doit être ignorée
    const shouldIgnoreError = (error: any): boolean => {
      const errorMessage = error?.message || error?.toString() || '';
      const errorName = error?.name || '';
      
      // Ignorer les erreurs NavigatorLock de Supabase (non critiques)
      if (errorName === 'NavigatorLockAcquireTimeoutError' || 
          errorMessage.includes('NavigatorLockAcquireTimeoutError') ||
          errorMessage.includes('Navigator LockManager lock') ||
          errorMessage.includes('lock:sb-')) {
        return true;
      }
      
      // Ignorer les erreurs FedCM (gérées par Google Auth)
      if (errorMessage.includes('FedCM') || 
          errorMessage.includes('IdentityCredentialError') ||
          errorMessage.includes('id assertion endpoint')) {
        return true;
      }
      
      // Ignorer les erreurs CSP pour Google (gérées par la configuration)
      if (errorMessage.includes('Content Security Policy') && 
          errorMessage.includes('accounts.google.com')) {
        return true;
      }
      
      return false;
    };

    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      if (!shouldIgnoreError(event.error)) {
      this.analyticsService.trackError(
        event.message,
        `${event.filename}:${event.lineno}:${event.colno}`
      );
      }
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (!shouldIgnoreError(event.reason)) {
      this.analyticsService.trackError(
        event.reason?.message || 'Unhandled Promise Rejection',
        'Promise'
      );
      }
    });

    // Track console errors (filtrer les erreurs non critiques)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      // Ne pas logger les erreurs non critiques dans la console
      if (!errorMessage.includes('NavigatorLockAcquireTimeoutError') &&
          !errorMessage.includes('FedCM') &&
          !errorMessage.includes('IdentityCredentialError') &&
          !errorMessage.includes('lock:sb-') &&
          !errorMessage.includes('Navigator LockManager')) {
      originalConsoleError.apply(console, args);
      }
      
      // Track seulement les erreurs importantes
      if (!shouldIgnoreError({ message: errorMessage })) {
      this.analyticsService.trackError(
          errorMessage,
        'Console'
      );
      }
    };
  }
}
