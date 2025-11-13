import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Product, Category } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  deletingProductId: string | null = null;
  showModal = false;
  editMode = false;
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  
  // Sélection multiple
  selectedProducts: Set<string> = new Set();
  selectAll = false;

  currentProduct: any = this.getEmptyProduct();
  imageUrlsText = '';
  tagsText = '';
  specificationsText = '';

  constructor(
    private productService: ProductService,
    public currencyService: CurrencyService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadCategories();
    await this.loadProducts();
  }

  async loadCategories() {
    this.categories = await this.productService.getCategories();
  }

  async loadProducts() {
    try {
      this.isLoading = true;
      this.products = await this.productService.getProducts();
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get filteredProducts() {
    return this.products.filter(product => {
      const matchesSearch = !this.searchQuery || 
        product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || 
        product.categoryId === this.selectedCategory;
      
      const matchesStatus = !this.selectedStatus || 
        product.status === this.selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  openCreateModal() {
    this.editMode = false;
    this.currentProduct = this.getEmptyProduct();
    this.showModal = true;
  }

  openEditModal(product: Product) {
    this.editMode = true;
    
    // Convert arrays to text for editing
    // Extract URLs from image objects
    this.imageUrlsText = Array.isArray(product.images) 
      ? product.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean).join('\n')
      : '';
    this.tagsText = Array.isArray(product.tags) ? product.tags.join(', ') : '';
    this.specificationsText = product.specifications ? JSON.stringify(product.specifications, null, 2) : '{}';
    
    this.currentProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.shortDescription,
      price: product.price,
      compare_at_price: product.compareAtPrice,
      sku: product.sku,
      stock: product.stock,
      images: product.images,
      category_id: product.categoryId,
      brand: product.brand,
      tags: product.tags,
      variants: product.variants,
      specifications: product.specifications,
      is_featured: product.isFeatured,
      is_new_arrival: product.isNewArrival,
      is_best_seller: product.isBestSeller,
      status: product.status
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentProduct = this.getEmptyProduct();
    this.imageUrlsText = '';
    this.tagsText = '';
    this.specificationsText = '';
    this.editMode = false;
  }

  async saveProduct() {
    if (this.isSaving) return;
    
    try {
      if (!this.currentProduct.name || !this.currentProduct.sku || !this.currentProduct.category_id) {
        this.toastService.warning('Veuillez remplir tous les champs obligatoires');
        return;
      }

      this.isSaving = true;

      // Generate slug from name
      this.currentProduct.slug = this.currentProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Convert image URLs text to array of objects
      if (this.imageUrlsText.trim()) {
        const urls = this.imageUrlsText
          .split('\n')
          .map(url => url.trim())
          .filter(url => url.length > 0);
        
        this.currentProduct.images = urls.map((url, index) => ({
          id: String(index + 1),
          url: url,
          alt: this.currentProduct.name || 'Product image',
          isPrimary: index === 0,
          order: index + 1
        }));
      } else {
        this.currentProduct.images = [];
      }

      // Convert tags text to array
      if (this.tagsText.trim()) {
        this.currentProduct.tags = this.tagsText
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      } else {
        this.currentProduct.tags = [];
      }

      // Convert specifications text to JSON object
      try {
        if (this.specificationsText.trim()) {
          this.currentProduct.specifications = JSON.parse(this.specificationsText);
        } else {
          this.currentProduct.specifications = {};
        }
      } catch (error) {
        this.toastService.error('Erreur: Le format des spécifications JSON est invalide');
        this.isSaving = false;
        return;
      }

      if (this.editMode) {
        // Update existing product
        await this.productService.updateProduct(this.currentProduct.id, this.currentProduct);
        this.toastService.success('Produit mis à jour avec succès!');
      } else {
        // Create new product
        await this.productService.createProduct(this.currentProduct);
        this.toastService.success('Produit créé avec succès!');
      }

      this.closeModal();
      await this.loadProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      this.toastService.info('Erreur: ' + error.message);
    } finally {
      this.isSaving = false;
    }
  }

  async deleteProduct(product: Product) {
    if (this.isDeleting) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer le produit',
      message: `Êtes-vous sûr de vouloir supprimer "${product.name}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      this.isDeleting = true;
      this.deletingProductId = product.id;
      await this.productService.deleteProduct(product.id);

      this.toastService.success('Produit supprimé avec succès!');
      await this.loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      this.toastService.error('Erreur lors de la suppression: ' + error.message);
    } finally {
      this.isDeleting = false;
      this.deletingProductId = null;
    }
  }

  // Sélection multiple
  toggleProductSelection(productId: string) {
    if (this.selectedProducts.has(productId)) {
      this.selectedProducts.delete(productId);
    } else {
      this.selectedProducts.add(productId);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll() {
    if (this.selectAll) {
      // Sélectionner tous les produits filtrés
      this.filteredProducts.forEach(p => this.selectedProducts.add(p.id));
    } else {
      // Désélectionner tous
      this.selectedProducts.clear();
    }
  }

  updateSelectAllState() {
    const visibleIds = this.filteredProducts.map(p => p.id);
    this.selectAll = visibleIds.length > 0 && visibleIds.every(id => this.selectedProducts.has(id));
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProducts.has(productId);
  }

  async deleteSelectedProducts() {
    const count = this.selectedProducts.size;
    
    if (count === 0) {
      this.toastService.warning('Veuillez sélectionner au moins un produit');
      return;
    }

    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer les produits',
      message: `Êtes-vous sûr de vouloir supprimer ${count} produit(s) ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      const idsToDelete = Array.from(this.selectedProducts);
      
      // Delete products one by one (backend may not support bulk delete)
      for (const id of idsToDelete) {
        await this.productService.deleteProduct(id);
      }

      this.toastService.success(`${count} produit(s) supprimé(s) avec succès!`);
      this.selectedProducts.clear();
      this.selectAll = false;
      await this.loadProducts();
    } catch (error: any) {
      console.error('Error deleting products:', error);
      this.toastService.error('Erreur lors de la suppression: ' + error.message);
    }
  }

  async toggleProductStatus(product: Product) {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    
    try {
      await this.productService.updateProduct(product.id, { status: newStatus });

      await this.loadProducts();
    } catch (error: any) {
      console.error('Error updating status:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  private getEmptyProduct() {
    return {
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: 0,
      compare_at_price: null,
      sku: '',
      stock: 0,
      images: [],
      category_id: '',
      brand: '',
      tags: [],
      variants: [],
      specifications: {},
      is_featured: false,
      is_new_arrival: false,
      is_best_seller: false,
      status: 'draft'
    };
  }

  getStatusBadgeClass(status: string): string {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  getProductImage(product: Product): string {
    if (!product.images || product.images.length === 0) {
      return '/assets/logo.png';
    }
    
    const firstImage = product.images[0];
    
    // Handle both string URLs and objects with url property
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    
    return firstImage?.url || '/assets/logo.png';
  }

  // Export fonctionality
  exportToCSV() {
    const headers = ['ID', 'Nom', 'SKU', 'Catégorie', 'Prix', 'Prix comparaison', 'Stock', 'Marque', 'Statut', 'Créé le'];
    const data = this.filteredProducts.map(p => [
      p.id,
      p.name,
      p.sku,
      p.category?.name || 'N/A',
      p.price,
      p.compareAtPrice || '',
      p.stock,
      p.brand || '',
      p.status,
      p.createdAt?.toLocaleDateString() || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produits_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toastService.success('Export CSV terminé!');
  }

  exportSelectedToCSV() {
    if (this.selectedProducts.size === 0) {
      this.toastService.warning('Veuillez sélectionner au moins un produit');
      return;
    }

    const headers = ['ID', 'Nom', 'SKU', 'Catégorie', 'Prix', 'Prix comparaison', 'Stock', 'Marque', 'Statut'];
    const selectedProductsList = this.filteredProducts.filter(p => this.selectedProducts.has(p.id));
    const data = selectedProductsList.map(p => [
      p.id,
      p.name,
      p.sku,
      p.category?.name || 'N/A',
      p.price,
      p.compareAtPrice || '',
      p.stock,
      p.brand || '',
      p.status
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produits_selection_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toastService.success(`Export de ${this.selectedProducts.size} produit(s) terminé!`);
  }
}
