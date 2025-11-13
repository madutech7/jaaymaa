import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [class]="containerClass">
      <div *ngFor="let item of skeletonItems" 
           class="skeleton-item" 
           [style.width]="item.width"
           [style.height]="item.height"
           [class]="item.class">
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .skeleton-item {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 0.375rem;
    }
    
    .skeleton-circle {
      border-radius: 50%;
    }
    
    .skeleton-rounded {
      border-radius: 0.75rem;
    }
    
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() type: 'product-card' | 'product-list' | 'text' | 'avatar' | 'custom' = 'text';
  @Input() containerClass: string = '';
  @Input() customItems: Array<{width: string, height: string, class?: string}> = [];

  get skeletonItems() {
    if (this.customItems.length > 0) {
      return this.customItems;
    }

    switch (this.type) {
      case 'product-card':
        return [
          { width: '100%', height: '200px', class: 'skeleton-rounded' },
          { width: '80%', height: '20px' },
          { width: '60%', height: '16px' },
          { width: '100%', height: '40px', class: 'skeleton-rounded' }
        ];
      
      case 'product-list':
        return [
          { width: '100%', height: '120px', class: 'skeleton-rounded' },
          { width: '70%', height: '18px' },
          { width: '50%', height: '14px' },
          { width: '100%', height: '32px', class: 'skeleton-rounded' }
        ];
      
      case 'avatar':
        return [
          { width: '48px', height: '48px', class: 'skeleton-circle' }
        ];
      
      case 'text':
        return [
          { width: '100%', height: '16px' },
          { width: '80%', height: '16px' },
          { width: '60%', height: '16px' }
        ];
      
      default:
        return [
          { width: '100%', height: '20px' }
        ];
    }
  }
}
