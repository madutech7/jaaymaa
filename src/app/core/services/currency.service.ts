import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly currency = 'FCFA';
  private readonly locale = 'fr-SN';

  /**
   * Formate un prix en FCFA
   * @param price Prix en FCFA
   * @param showCurrency Afficher la devise (défaut: true)
   * @returns Prix formaté (ex: "45 000 FCFA")
   */
  formatPrice(price: number, showCurrency: boolean = true): string {
    if (price === null || price === undefined || isNaN(price)) {
      return showCurrency ? '0 FCFA' : '0';
    }

    // Formatage avec espaces comme séparateurs de milliers
    const formattedPrice = new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);

    return showCurrency ? `${formattedPrice} ${this.currency}` : formattedPrice;
  }

  /**
   * Formate un prix avec devise courte
   * @param price Prix en FCFA
   * @returns Prix formaté court (ex: "45 000 F")
   */
  formatPriceShort(price: number): string {
    if (price === null || price === undefined || isNaN(price)) {
      return '0 F';
    }

    const formattedPrice = new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);

    return `${formattedPrice} F`;
  }

  /**
   * Convertit un prix en euros vers FCFA
   * @param euroPrice Prix en euros
   * @param exchangeRate Taux de change (défaut: 655.96)
   * @returns Prix en FCFA
   */
  convertEuroToFCFA(euroPrice: number, exchangeRate: number = 655.96): number {
    return Math.round(euroPrice * exchangeRate);
  }

  /**
   * Convertit un prix en FCFA vers euros
   * @param fcfaPrice Prix en FCFA
   * @param exchangeRate Taux de change (défaut: 655.96)
   * @returns Prix en euros
   */
  convertFCFAToEuro(fcfaPrice: number, exchangeRate: number = 655.96): number {
    return Math.round((fcfaPrice / exchangeRate) * 100) / 100;
  }

  /**
   * Retourne la devise utilisée
   */
  getCurrency(): string {
    return this.currency;
  }

  /**
   * Retourne la locale utilisée
   */
  getLocale(): string {
    return this.locale;
  }

  /**
   * Formate un prix pour l'affichage dans les cartes produit
   * @param price Prix en FCFA
   * @param compareAtPrice Prix de comparaison (optionnel)
   * @returns Objet avec prix formaté et réduction
   */
  formatProductPrice(price: number, compareAtPrice?: number) {
    const formattedPrice = this.formatPrice(price);
    const formattedComparePrice = compareAtPrice ? this.formatPrice(compareAtPrice) : null;
    
    let discount = 0;
    if (compareAtPrice && compareAtPrice > price) {
      discount = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
    }

    return {
      price: formattedPrice,
      comparePrice: formattedComparePrice,
      discount: discount > 0 ? discount : null
    };
  }
}
