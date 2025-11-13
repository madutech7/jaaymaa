import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmationModalComponent } from './shared/components/confirmation-modal/confirmation-modal.component';
import { ScrollTrackerComponent } from './shared/components/scroll-tracker/scroll-tracker.component';
import { ErrorTrackerComponent } from './shared/components/error-tracker/error-tracker.component';
import { ScrollService } from './core/services/scroll.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, ConfirmationModalComponent, ScrollTrackerComponent, ErrorTrackerComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'JAAYMAA';
  isAdminRoute = false;

  constructor(
    private router: Router,
    private scrollService: ScrollService // Initialize scroll service
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAdminRoute = event.url.startsWith('/admin');
      });
  }
}
