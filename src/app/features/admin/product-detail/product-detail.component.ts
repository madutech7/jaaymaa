import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class AdminProductDetailComponent implements OnInit {
  product: any = null;
  isLoading = true;
  productId: string = '';
  
  // Pour utiliser dans le template
  Object = Object;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public currencyService: CurrencyService,
    private toastService: ToastService
  ) {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      if (this.productId) {
        this.loadProduct();
      }
    });
  }

  async ngOnInit() {
    // L'ID est déjà récupéré dans le constructor
  }

  async loadProduct() {
    try {
      this.isLoading = true;

      const product = await firstValueFrom(
        this.api.get<any>(`products/${this.productId}`)
      );

      if (!product) {
        throw new Error('Produit introuvable');
      }

      this.product = product;
    } catch (error: any) {
      console.error('Error loading product:', error);
      this.toastService.info('Erreur lors du chargement du produit: ' + (error.message || 'Erreur inconnue'));
    } finally {
      this.isLoading = false;
    }
  }

  getProductImage(index: number = 0): string {
    if (!this.product?.images || this.product.images.length === 0) {
      return '/assets/logo.png';
    }

    if (index >= this.product.images.length) {
      return '/assets/logo.png';
    }

    const image = this.product.images[index];

    if (typeof image === 'string') {
      return image;
    }

    return image?.url || '/assets/logo.png';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'draft':
        return 'Brouillon';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  }

  goBack() {
    this.router.navigate(['/admin/products']);
  }

  editProduct() {
    this.router.navigate(['/admin/products'], { 
      queryParams: { edit: this.productId } 
    });
  }
}

