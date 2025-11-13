import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface ConfirmationResult {
  confirmed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new Subject<{ options: ConfirmationOptions; result: Subject<boolean> }>();
  public confirmation$: Observable<{ options: ConfirmationOptions; result: Subject<boolean> }> = 
    this.confirmationSubject.asObservable();

  confirm(options: ConfirmationOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const result = new Subject<boolean>();
      
      result.subscribe((confirmed) => {
        resolve(confirmed);
      });

      this.confirmationSubject.next({ options, result });
    });
  }
}


