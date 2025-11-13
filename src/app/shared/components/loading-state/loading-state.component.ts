import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Spinner Loader -->
    <div *ngIf="type === 'spinner'" class="flex items-center justify-center" [class]="containerClass">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
        <div *ngIf="message" class="mt-4 text-center text-gray-600 dark:text-gray-400 font-medium">
          {{ message }}
        </div>
      </div>
    </div>

    <!-- Dots Loader -->
    <div *ngIf="type === 'dots'" class="flex items-center justify-center gap-2" [class]="containerClass">
      <div class="w-3 h-3 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
      <div class="w-3 h-3 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
      <div class="w-3 h-3 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      <p *ngIf="message" class="ml-3 text-gray-600 dark:text-gray-400 font-medium">{{ message }}</p>
    </div>

    <!-- Pulse Loader -->
    <div *ngIf="type === 'pulse'" class="flex items-center justify-center" [class]="containerClass">
      <div class="relative">
        <div class="w-16 h-16 bg-purple-600 dark:bg-purple-400 rounded-full animate-ping absolute opacity-75"></div>
        <div class="w-16 h-16 bg-purple-600 dark:bg-purple-400 rounded-full relative flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
      </div>
      <p *ngIf="message" class="mt-4 text-center text-gray-600 dark:text-gray-400 font-medium">{{ message }}</p>
    </div>

    <!-- Bar Loader -->
    <div *ngIf="type === 'bar'" class="w-full" [class]="containerClass">
      <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" [style.width]="progress ? progress + '%' : '100%'"></div>
      </div>
      <p *ngIf="message" class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{{ message }}</p>
    </div>

    <!-- Skeleton Card (Product) -->
    <div *ngIf="type === 'product-skeleton'" class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg" [class]="containerClass">
      <div class="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"></div>
      <div class="p-4 space-y-3">
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-1/2"></div>
        <div class="flex items-center justify-between pt-2">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-1/3"></div>
          <div class="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Skeleton List Item -->
    <div *ngIf="type === 'list-skeleton'" class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl" [class]="containerClass">
      <div class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-1/2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-2/3"></div>
      </div>
    </div>

    <!-- Skeleton Text Block -->
    <div *ngIf="type === 'text-skeleton'" class="space-y-2" [class]="containerClass">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6"></div>
    </div>

    <!-- Grid Skeleton (Multiple Products) -->
    <div *ngIf="type === 'product-grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" [class]="containerClass">
      <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"></div>
        <div class="p-4 space-y-3">
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-3/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-1/2"></div>
          <div class="flex items-center justify-between pt-2">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-1/3"></div>
            <div class="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shimmer Card -->
    <div *ngIf="type === 'shimmer'" class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg" [class]="containerClass">
      <div class="space-y-4">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
      <div class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-gray-500/10 to-transparent"></div>
    </div>

    <!-- Custom Full Page Loader -->
    <div *ngIf="type === 'fullpage'" class="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-[9999] flex items-center justify-center" [class]="containerClass">
      <div class="text-center">
        <div class="relative mb-6">
          <div class="w-20 h-20 border-4 border-purple-200 dark:border-purple-900 border-t-transparent rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="w-10 h-10 text-purple-600 dark:text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ message || 'Chargement...' }}</h3>
        <p class="text-gray-600 dark:text-gray-400">Veuillez patienter</p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shimmer-slide {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .animate-shimmer {
      animation: shimmer-slide 2s infinite;
    }
  `]
})
export class LoadingStateComponent {
  @Input() type: 'spinner' | 'dots' | 'pulse' | 'bar' | 'product-skeleton' | 'list-skeleton' | 'text-skeleton' | 'product-grid' | 'shimmer' | 'fullpage' = 'spinner';
  @Input() message?: string;
  @Input() containerClass?: string;
  @Input() progress?: number; // For bar loader (0-100)
}

