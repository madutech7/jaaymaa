import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private clientId: string = '';
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  private currentUserSubject = new BehaviorSubject<GoogleUser | null>(null);
  public currentUser$: Observable<GoogleUser | null> = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    // Le clientId sera chargé depuis l'environnement
  }

  /**
   * Initialise le service Google OAuth
   */
  async initialize(clientId: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.clientId = clientId;
    this.initializationPromise = this.loadGoogleScript();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  /**
   * Charge le script Google Identity Services
   */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Vérifier si le script est déjà chargé
      if (window.google && window.google.accounts) {
        resolve();
        return;
      }

      // Créer et charger le script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Lance le processus de connexion Google
   */
  async signIn(): Promise<{ success: boolean; user?: GoogleUser; error?: string }> {
    try {
      // S'assurer que le service est initialisé
      if (!this.isInitialized) {
        throw new Error('Google Auth service not initialized');
      }

      return new Promise((resolve) => {
        // Créer directement un modal avec le bouton de connexion
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'google-signin-temp';
        
        // Fonction pour fermer le modal
        const closeModal = () => {
          const container = document.getElementById('google-signin-temp');
          if (container && container.parentNode) {
            document.body.removeChild(container);
          }
        };
        
        // Initialiser Google Identity Services (sans FedCM pour éviter les erreurs CORS)
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            closeModal(); // Fermer le modal avant de traiter la réponse
            this.handleCredentialResponse(response, resolve);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false // Désactiver FedCM pour éviter les erreurs CORS
        });

        // Styles du container
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '0';
        buttonContainer.style.left = '0';
        buttonContainer.style.right = '0';
        buttonContainer.style.bottom = '0';
        buttonContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        buttonContainer.style.zIndex = '10000';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.backdropFilter = 'blur(4px)';
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '32px';
        modalContent.style.borderRadius = '16px';
        modalContent.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
        modalContent.style.maxWidth = '400px';
        modalContent.style.width = '90%';
        modalContent.style.position = 'relative';
        
        // Titre
        const title = document.createElement('h2');
        title.textContent = 'Connexion avec Google';
        title.style.margin = '0 0 16px 0';
        title.style.fontSize = '24px';
        title.style.fontWeight = 'bold';
        title.style.color = '#111';
        modalContent.appendChild(title);
        
        // Description
        const description = document.createElement('p');
        description.textContent = 'Cliquez sur le bouton ci-dessous pour vous connecter avec votre compte Google';
        description.style.margin = '0 0 24px 0';
        description.style.color = '#666';
        description.style.fontSize = '14px';
        modalContent.appendChild(description);
        
        // Container pour le bouton Google
        const buttonWrapper = document.createElement('div');
        buttonWrapper.id = 'google-button-wrapper';
        buttonWrapper.style.marginBottom = '16px';
        buttonWrapper.style.width = '100%';
        buttonWrapper.style.display = 'flex';
        buttonWrapper.style.justifyContent = 'center';
        modalContent.appendChild(buttonWrapper);
        
        // Bouton de fermeture
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '16px';
        closeButton.style.right = '16px';
        closeButton.style.border = 'none';
        closeButton.style.background = 'transparent';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '24px';
        closeButton.style.color = '#666';
        closeButton.style.width = '32px';
        closeButton.style.height = '32px';
        closeButton.style.display = 'flex';
        closeButton.style.alignItems = 'center';
        closeButton.style.justifyContent = 'center';
        closeButton.style.borderRadius = '50%';
        closeButton.onmouseover = () => {
          closeButton.style.backgroundColor = '#f0f0f0';
        };
        closeButton.onmouseout = () => {
          closeButton.style.backgroundColor = 'transparent';
        };
        
        closeButton.onclick = (e) => {
          e.stopPropagation();
          closeModal();
          resolve({ success: false, error: 'Connexion annulée' });
        };
        modalContent.appendChild(closeButton);
        
        buttonContainer.appendChild(modalContent);
        document.body.appendChild(buttonContainer);
        
        // Fermer en cliquant sur le backdrop
        buttonContainer.onclick = (e) => {
          if (e.target === buttonContainer) {
            closeModal();
            resolve({ success: false, error: 'Connexion annulée' });
          }
        };
        
        // Empêcher la propagation sur le contenu du modal
        modalContent.onclick = (e) => {
          e.stopPropagation();
        };

        // Rendre le bouton Google
        setTimeout(() => {
          try {
            window.google.accounts.id.renderButton(buttonWrapper, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          } catch (error) {
            console.error('Error rendering Google button:', error);
            closeModal();
            resolve({ success: false, error: 'Erreur lors de l\'affichage du bouton Google' });
          }
        }, 100);
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { success: false, error: error.message || 'Failed to sign in with Google' };
    }
  }

  /**
   * Gère la réponse de l'API Google
   */
  private async handleCredentialResponse(
    response: any,
    resolve: (value: { success: boolean; user?: GoogleUser; error?: string }) => void
  ): Promise<void> {
    try {
      // Nettoyer le modal s'il existe
      this.closeModal();

      // Décoder le JWT token
      const payload = this.decodeJWT(response.credential);
      
      if (!payload) {
        resolve({ success: false, error: 'Invalid token' });
        return;
      }

      const user: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name
      };

      // Stocker le token et les infos utilisateur
      this.storeAuthData(response.credential, user);
      
      // Mettre à jour le sujet
      this.currentUserSubject.next(user);
      
      resolve({ success: true, user });
    } catch (error: any) {
      console.error('Error handling credential response:', error);
      this.closeModal();
      resolve({ success: false, error: error.message });
    }
  }

  /**
   * Ferme le modal de connexion
   */
  private closeModal(): void {
    const tempContainer = document.getElementById('google-signin-temp');
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
  }

  /**
   * Décode un JWT token
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Stocke les données d'authentification
   */
  private storeAuthData(token: string, user: GoogleUser): void {
    localStorage.setItem('google_token', token);
    localStorage.setItem('google_user', JSON.stringify(user));
    localStorage.setItem('auth_provider', 'google');
  }

  /**
   * Récupère l'utilisateur actuel depuis le stockage local
   */
  getStoredUser(): GoogleUser | null {
    const stored = localStorage.getItem('google_user');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  /**
   * Récupère le token stocké
   */
  getStoredToken(): string | null {
    return localStorage.getItem('google_token');
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredUser();
  }

  /**
   * Déconnexion
   */
  signOut(): void {
    localStorage.removeItem('google_token');
    localStorage.removeItem('google_user');
    localStorage.removeItem('auth_provider');
    this.currentUserSubject.next(null);
    
    // Déconnexion Google
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  /**
   * Restaure la session depuis le stockage local
   */
  restoreSession(): void {
    const user = this.getStoredUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Rend un bouton de connexion Google
   */
  renderSignInButton(elementId: string = 'google-signin-button'): void {
    if (!this.isInitialized) {
      console.error('Google Auth service not initialized');
      return;
    }

    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    );
  }

  /**
   * Vérifie et valide le token avec Google
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      // Vérifier que le token n'est pas expiré
      const payload = this.decodeJWT(token);
      if (!payload) {
        return false;
      }

      // Vérifier l'expiration
      const exp = payload.exp * 1000; // Convertir en millisecondes
      if (Date.now() > exp) {
        // Token expiré, déconnecter
        this.signOut();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
}

