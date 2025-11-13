import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  newsletterEmail = '';
  currentYear = new Date().getFullYear();

  constructor(private toastService: ToastService) {}

  subscribeNewsletter() {
    if (this.newsletterEmail) {
      // TODO: Implement newsletter subscription
      this.newsletterEmail = '';
      this.toastService.info('Merci pour votre inscription!');
    }
  }
}

