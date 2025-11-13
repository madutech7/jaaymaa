import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-scroll-tracker',
  standalone: true,
  template: '', // Pas de template visible
  styles: []
})
export class ScrollTrackerComponent implements OnInit, OnDestroy {
  private scrollDepths = [25, 50, 75, 90, 100];
  private trackedDepths: number[] = [];
  private startTime = Date.now();

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.startTime = Date.now();
  }

  ngOnDestroy() {
    // Track engagement time when leaving page
    const timeOnPage = Date.now() - this.startTime;
    this.analyticsService.trackEngagement(timeOnPage, document.title);
  }

  @HostListener('window:scroll')
  onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = Math.round((scrollTop / documentHeight) * 100);

    // Track scroll milestones
    this.scrollDepths.forEach(depth => {
      if (scrollPercentage >= depth && !this.trackedDepths.includes(depth)) {
        this.trackedDepths.push(depth);
        this.analyticsService.trackScroll(depth);
      }
    });
  }
}
