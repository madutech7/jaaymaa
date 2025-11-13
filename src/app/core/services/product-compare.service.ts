import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductCompareService {
  private readonly MAX_COMPARE = 4;
  private readonly STORAGE_KEY = 'shoplux-compare-products';
  
  private compareProductsSubject = new BehaviorSubject<Product[]>([]);
  public compareProducts$ = this.compareProductsSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  getProducts(): Product[] {
    return this.compareProductsSubject.value;
  }

  addProduct(product: Product): boolean {
    const currentProducts = this.compareProductsSubject.value;
    
    // Check if already exists
    if (currentProducts.some(p => p.id === product.id)) {
      return false;
    }
    
    // Check if max reached
    if (currentProducts.length >= this.MAX_COMPARE) {
      return false;
    }
    
    const updatedProducts = [...currentProducts, product];
    this.compareProductsSubject.next(updatedProducts);
    this.saveToStorage(updatedProducts);
    return true;
  }

  removeProduct(productId: string): void {
    const currentProducts = this.compareProductsSubject.value;
    const updatedProducts = currentProducts.filter(p => p.id !== productId);
    this.compareProductsSubject.next(updatedProducts);
    this.saveToStorage(updatedProducts);
  }

  clearAll(): void {
    this.compareProductsSubject.next([]);
    this.saveToStorage([]);
  }

  isInComparison(productId: string): boolean {
    return this.compareProductsSubject.value.some(p => p.id === productId);
  }

  canAddMore(): boolean {
    return this.compareProductsSubject.value.length < this.MAX_COMPARE;
  }

  getCount(): number {
    return this.compareProductsSubject.value.length;
  }

  private saveToStorage(products: Product[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving compare products to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const products = JSON.parse(stored);
        this.compareProductsSubject.next(products);
      }
    } catch (error) {
      console.error('Error loading compare products from storage:', error);
    }
  }
}

