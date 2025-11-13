import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private sessionInitialized = false;
  private sessionInitPromise: Promise<void>;

  constructor() {
    // NOTE: Ce service n'est plus utilisé - conservé pour compatibilité temporaire
    // Désactivé pour éviter les erreurs de connexion
    // Les composants doivent être migrés vers ApiService
    const supabaseUrl = 'http://localhost:54321'; // URL locale par défaut (ne sera pas utilisée)
    const supabaseKey = 'placeholder-key';
    
    try {
    this.supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
            persistSession: false, // Désactivé
            autoRefreshToken: false, // Désactivé
            detectSessionInUrl: false, // Désactivé
          flowType: 'pkce'
        }
      }
    );

      // Ne pas initialiser la session pour éviter les appels réseau
      this.sessionInitPromise = Promise.resolve();
      this.sessionInitialized = true;

      // Ne pas écouter les changements d'auth
    } catch (error) {
      console.warn('SupabaseService is deprecated. Please migrate to ApiService.');
      // Initialiser avec un client vide en cas d'erreur
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.sessionInitPromise = Promise.resolve();
      this.sessionInitialized = true;
    }
  }

  private async initializeSession(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentUserSubject.next(session?.user ?? null);
    this.sessionInitialized = true;
  }

  async waitForSessionInit(): Promise<void> {
    if (!this.sessionInitialized) {
      await this.sessionInitPromise;
    }
  }

  get client(): SupabaseClient {
    // Avertissement: ce service est déprécié
    console.warn('SupabaseService is deprecated. Please use ApiService instead.');
    return this.supabase;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Auth methods
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }

  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file);
    if (error) throw error;
    return data;
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }
}

