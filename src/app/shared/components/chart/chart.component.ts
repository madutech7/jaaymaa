import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  @Input() config!: ChartConfiguration;
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private chart?: Chart;

  ngAfterViewInit() {
    if (this.config && this.canvasRef) {
      this.createChart();
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart() {
    if (!this.canvasRef?.nativeElement) return;

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, this.config);
  }

  updateChart(config: ChartConfiguration) {
    if (this.chart) {
      this.chart.destroy();
    }
    this.config = config;
    this.createChart();
  }
}

