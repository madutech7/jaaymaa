import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Install Prompt -->
    <div *ngIf="showInstallPrompt" class="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-slideInUp">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-gray-900">Installer JAAYMAA</h3>
            <p class="text-xs text-gray-600 mt-1">Ajoutez JAAYMAA à votre écran d'accueil pour un accès rapide</p>
            <div class="flex space-x-2 mt-3">
              <button (click)="installPwa()" 
                      class="flex-1 bg-gradient-primary text-white text-xs font-medium py-2 px-3 rounded-lg hover:opacity-90 transition-opacity">
                Installer
              </button>
              <button (click)="dismissInstall()" 
                      class="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                Plus tard
              </button>
            </div>
          </div>
          <button (click)="dismissInstall()" 
                  class="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Update Available -->
    <div *ngIf="showUpdatePrompt" class="fixed top-4 right-4 z-50 max-w-sm">
      <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 animate-slideInRight">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-gray-900">Mise à jour disponible</h3>
            <p class="text-xs text-gray-600 mt-1">Une nouvelle version de JAAYMAA est disponible</p>
            <div class="flex space-x-2 mt-3">
              <button (click)="updateApp()" 
                      class="flex-1 bg-green-500 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-green-600 transition-colors">
                Mettre à jour
              </button>
              <button (click)="dismissUpdate()" 
                      class="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-slideInUp {
      animation: slideInUp 0.3s ease-out;
    }
    
    .animate-slideInRight {
      animation: slideInRight 0.3s ease-out;
    }
    
    @keyframes slideInUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class PwaInstallComponent implements OnInit, OnDestroy {
  showInstallPrompt = false;
  showUpdatePrompt = false;
  private deferredPrompt: any;
  private updateAvailable = false;

  constructor(
    private swUpdate: SwUpdate,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Check for install prompt
    this.checkInstallPrompt();
    
    // Check for updates
    this.checkForUpdates();
  }

  ngOnDestroy() {
    // Clean up event listeners
    window.removeEventListener('beforeinstallprompt', this.checkInstallPrompt);
  }

  private checkInstallPrompt() {
    // Check if already installed
    if (this.isInstalled()) {
      return;
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt = true;
    });

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = new Date(dismissed).getTime();
      const now = new Date().getTime();
      const daysSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        this.showInstallPrompt = false;
      }
    }
  }

  private checkForUpdates() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map(evt => evt.latestVersion)
        )
        .subscribe(() => {
          this.updateAvailable = true;
          this.showUpdatePrompt = true;
        });
    }
  }

  private isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  installPwa() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          this.toastService.success('Application installée avec succès !');
        }
        this.deferredPrompt = null;
        this.showInstallPrompt = false;
      });
    }
  }

  dismissInstall() {
    this.showInstallPrompt = false;
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  }

  updateApp() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.activateUpdate().then(() => {
        window.location.reload();
      });
    }
  }

  dismissUpdate() {
    this.showUpdatePrompt = false;
  }
}
