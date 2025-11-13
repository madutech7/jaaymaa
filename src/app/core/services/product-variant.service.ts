import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price?: number;
  stock: number;
  attributes: { [key: string]: string }; // {color: "rouge", size: "L"}
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProductVariantService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Récupérer toutes les variantes d'un produit
   */
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching product variants:', error);
        return [];
      }

      return data ? data.map(v => this.mapVariant(v)) : [];
    } catch (error) {
      console.error('Error fetching product variants:', error);
      return [];
    }
  }

  /**
   * Récupérer une variante par SKU
   */
  async getVariantBySku(sku: string): Promise<ProductVariant | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('product_variants')
        .select('*')
        .eq('sku', sku)
        .single();

      if (error) {
        console.error('Error fetching variant by SKU:', error);
        return null;
      }

      return data ? this.mapVariant(data) : null;
    } catch (error) {
      console.error('Error fetching variant by SKU:', error);
      return null;
    }
  }

  /**
   * Créer une nouvelle variante (admin)
   */
  async createVariant(variant: Partial<ProductVariant>): Promise<ProductVariant | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('product_variants')
        .insert({
          product_id: variant.productId,
          sku: variant.sku,
          name: variant.name,
          price: variant.price || null,
          stock: variant.stock || 0,
          attributes: variant.attributes || {},
          is_active: variant.isActive ?? true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating variant:', error);
        return null;
      }

      return this.mapVariant(data);
    } catch (error) {
      console.error('Error creating variant:', error);
      return null;
    }
  }

  /**
   * Mettre à jour une variante (admin)
   */
  async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.attributes !== undefined) updateData.attributes = updates.attributes;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await this.supabase.client
        .from('product_variants')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating variant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating variant:', error);
      return false;
    }
  }

  /**
   * Supprimer une variante (admin)
   */
  async deleteVariant(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting variant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting variant:', error);
      return false;
    }
  }

  /**
   * Mettre à jour le stock d'une variante
   */
  async updateVariantStock(id: string, quantity: number): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('product_variants')
        .update({ stock: quantity })
        .eq('id', id);

      if (error) {
        console.error('Error updating variant stock:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating variant stock:', error);
      return false;
    }
  }

  /**
   * Obtenir toutes les combinaisons d'attributs uniques pour un produit
   */
  async getProductAttributes(productId: string): Promise<{ [key: string]: string[] }> {
    try {
      const variants = await this.getProductVariants(productId);
      
      const attributes: { [key: string]: Set<string> } = {};

      variants.forEach(variant => {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!attributes[key]) {
            attributes[key] = new Set();
          }
          attributes[key].add(value);
        });
      });

      // Convertir les Sets en tableaux
      const result: { [key: string]: string[] } = {};
      Object.entries(attributes).forEach(([key, valueSet]) => {
        result[key] = Array.from(valueSet);
      });

      return result;
    } catch (error) {
      console.error('Error getting product attributes:', error);
      return {};
    }
  }

  /**
   * Trouver une variante par attributs
   */
  async findVariantByAttributes(
    productId: string,
    attributes: { [key: string]: string }
  ): Promise<ProductVariant | null> {
    try {
      const variants = await this.getProductVariants(productId);
      
      // Chercher une variante qui correspond à tous les attributs
      const found = variants.find(variant => {
        return Object.entries(attributes).every(([key, value]) => {
          return variant.attributes[key] === value;
        });
      });

      return found || null;
    } catch (error) {
      console.error('Error finding variant by attributes:', error);
      return null;
    }
  }

  /**
   * Mapper les données Supabase vers le modèle ProductVariant
   */
  private mapVariant(data: any): ProductVariant {
    return {
      id: data.id,
      productId: data.product_id,
      sku: data.sku,
      name: data.name,
      price: data.price ? parseFloat(data.price) : undefined,
      stock: data.stock,
      attributes: data.attributes || {},
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

