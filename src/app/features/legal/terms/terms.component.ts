import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent implements OnInit {
  lastUpdate = new Date('2024-10-06');

  constructor(private viewportScroller: ViewportScroller) {}

  ngOnInit() {
    // Force scroll to top when component loads
    this.viewportScroller.scrollToPosition([0, 0]);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 0);
  }
}

