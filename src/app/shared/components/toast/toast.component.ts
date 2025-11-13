import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      <div
        *ngFor="let toast of toasts$ | async"
        class="flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105 animate-slide-in"
        [ngClass]="{
          'bg-green-500/90 text-white': toast.type === 'success',
          'bg-blue-500/90 text-white': toast.type === 'info',
          'bg-yellow-500/90 text-white': toast.type === 'warning',
          'bg-red-500/90 text-white': toast.type === 'error'
        }"
      >
        <!-- Icon -->
        <div class="flex-shrink-0 w-6 h-6">
          <!-- Success -->
          <svg *ngIf="toast.type === 'success'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <!-- Info -->
          <svg *ngIf="toast.type === 'info'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <!-- Warning -->
          <svg *ngIf="toast.type === 'warning'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <!-- Error -->
          <svg *ngIf="toast.type === 'error'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>

        <!-- Message -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm">{{ toast.message }}</p>
          <p *ngIf="toast.description" class="text-xs opacity-90 mt-1">{{ toast.description }}</p>
        </div>

        <!-- Close Button -->
        <button
          (click)="remove(toast.id)"
          class="flex-shrink-0 w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <!-- Progress bar -->
        <div class="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full overflow-hidden" 
             [style.width.%]="100"
             *ngIf="toast.duration">
          <div class="h-full bg-white animate-shrink-width" 
               [style.animation-duration.ms]="toast.duration"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes shrinkWidth {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }

    .animate-shrink-width {
      animation: shrinkWidth linear forwards;
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  get toasts$() {
    return this.toastService.toasts$;
  }

  remove(id: string): void {
    this.toastService.remove(id);
  }
}
