import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lazy-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lazy-image-container" [class.loaded]="isLoaded" [class.error]="hasError">
      <!-- Placeholder -->
      <div *ngIf="!isLoaded && !hasError" class="lazy-placeholder">
        <div class="skeleton-shimmer"></div>
      </div>
      
      <!-- Error State -->
      <div *ngIf="hasError" class="lazy-error">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span class="text-xs text-gray-500 mt-1">Image non disponible</span>
      </div>
      
      <!-- Actual Image -->
      <img 
        #imageElement
        *ngIf="isLoaded"
        [src]="src" 
        [alt]="alt"
        [class]="imageClass"
        (load)="onImageLoad()"
        (error)="onImageError()"
        loading="lazy"
      />
    </div>
  `,
  styles: [`
    .lazy-image-container {
      position: relative;
      overflow: hidden;
      background-color: #f3f4f6;
      width: 100%;
      height: 100%;
    }
    
    .lazy-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .skeleton-shimmer {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    
    .lazy-error {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f9fafb;
    }
    
    .loaded img {
      opacity: 0;
      animation: fadeIn 0.3s ease-in-out forwards;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `]
})
export class LazyImageComponent implements OnInit, OnDestroy {
  @Input() src: string = '';
  @Input() alt: string = '';
  @Input() imageClass: string = '';
  @Input() rootMargin: string = '50px';
  
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  
  isLoaded = false;
  hasError = false;
  private observer?: IntersectionObserver;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Charger l'image immédiatement pour le moment
    this.loadImage();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private createIntersectionObserver() {
    if ('IntersectionObserver' in window && this.elementRef.nativeElement) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage();
              this.observer?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: this.rootMargin
        }
      );
      
      this.observer.observe(this.elementRef.nativeElement);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage();
    }
  }

  private loadImage() {
    if (!this.src) {
      this.hasError = true;
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.isLoaded = true;
      this.hasError = false;
    };
    img.onerror = () => {
      this.hasError = true;
      this.isLoaded = false;
    };
    img.src = this.src;
  }

  onImageLoad() {
    this.isLoaded = true;
    this.hasError = false;
  }

  onImageError() {
    this.hasError = true;
    this.isLoaded = false;
  }
}