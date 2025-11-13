import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  image: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  isLoading = true;
  showModal = false;
  editMode = false;
  
  currentCategory = {
    id: '',
    name: '',
    slug: '',
    description: '',
    parent_id: null as string | null,
    image: '',
    order: 0,
    is_active: true
  };

  constructor(
    private productService: ProductService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    try {
      this.isLoading = true;
      const categories = await this.productService.getCategories();
      this.categories = categories.map((cat: any) => ({
        ...cat,
        createdAt: cat.createdAt || new Date()
      }));
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      this.isLoading = false;
    }
  }

  openCreateModal() {
    this.editMode = false;
    this.currentCategory = {
      id: '',
      name: '',
      slug: '',
      description: '',
      parent_id: null,
      image: '',
      order: 0,
      is_active: true
    };
    this.showModal = true;
  }

  openEditModal(category: Category) {
    this.editMode = true;
    this.currentCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent_id: category.parentId,
      image: category.image,
      order: category.order,
      is_active: category.isActive
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveCategory() {
    try {
      if (!this.currentCategory.name) {
        this.toastService.warning('Le nom est requis');
        return;
      }

      // Generate slug from name
      this.currentCategory.slug = this.currentCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (this.editMode) {
        await this.productService.updateCategory(this.currentCategory.id, this.currentCategory);
        this.toastService.success('Catégorie mise à jour avec succès!');
      } else {
        await this.productService.createCategory(this.currentCategory);
        this.toastService.success('Catégorie créée avec succès!');
      }

      this.closeModal();
      await this.loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  async deleteCategory(category: Category) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer la catégorie',
      message: `Êtes-vous sûr de vouloir supprimer "${category.name}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      await this.productService.deleteCategory(category.id);
      this.toastService.success('Catégorie supprimée avec succès!');
      await this.loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  async toggleCategoryStatus(category: Category) {
    try {
      await this.productService.updateCategory(category.id, { is_active: !category.isActive });
      await this.loadCategories();
    } catch (error: any) {
      console.error('Error updating status:', error);
      this.toastService.info('Erreur: ' + error.message);
    }
  }

  getParentCategoryName(parentId: string | null): string {
    if (!parentId) return '-';
    const parent = this.categories.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  }
}

