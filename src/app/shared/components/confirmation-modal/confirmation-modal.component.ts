import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmationOptions } from '../../../core/services/confirmation.service';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      (click)="cancel()"
    >
      <div 
        class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <!-- Icon -->
            <div 
              class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
              [ngClass]="{
                'bg-red-100 dark:bg-red-900/30': options?.type === 'danger',
                'bg-yellow-100 dark:bg-yellow-900/30': options?.type === 'warning',
                'bg-blue-100 dark:bg-blue-900/30': options?.type === 'info' || !options?.type
              }"
            >
              <svg 
                *ngIf="options?.type === 'danger'"
                class="w-6 h-6 text-red-600 dark:text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <svg 
                *ngIf="options?.type === 'warning'"
                class="w-6 h-6 text-yellow-600 dark:text-yellow-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <svg 
                *ngIf="options?.type === 'info' || !options?.type"
                class="w-6 h-6 text-blue-600 dark:text-blue-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            
            <!-- Title -->
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ options?.title || 'Confirmation' }}
            </h3>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6">
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ options?.message }}
          </p>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
          <button
            (click)="cancel()"
            class="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {{ options?.cancelText || 'Annuler' }}
          </button>
          <button
            (click)="confirm()"
            class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white transition-colors"
            [ngClass]="{
              'bg-red-600 hover:bg-red-700': options?.type === 'danger',
              'bg-yellow-600 hover:bg-yellow-700': options?.type === 'warning',
              'bg-blue-600 hover:bg-blue-700': options?.type === 'info' || !options?.type
            }"
          >
            {{ options?.confirmText || 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-scaleIn {
      animation: scaleIn 0.2s ease-out;
    }
  `]
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  options: ConfirmationOptions | null = null;
  private resultSubject: Subject<boolean> | null = null;
  private subscription: Subscription | null = null;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.subscription = this.confirmationService.confirmation$.subscribe(({ options, result }) => {
      this.options = options;
      this.resultSubject = result;
      this.isOpen = true;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  confirm() {
    if (this.resultSubject) {
      this.resultSubject.next(true);
      this.resultSubject.complete();
    }
    this.isOpen = false;
    this.options = null;
    this.resultSubject = null;
  }

  cancel() {
    if (this.resultSubject) {
      this.resultSubject.next(false);
      this.resultSubject.complete();
    }
    this.isOpen = false;
    this.options = null;
    this.resultSubject = null;
  }
}


