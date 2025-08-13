import { BehaviorMetrics } from './types';

export class BehaviorAnalysis {
  private metrics: BehaviorMetrics = {
    mouseMovements: 0,
    clicks: 0,
    scrolls: 0,
    keystrokes: 0,
    focusEvents: 0,
    timeOnPage: 0,
    mouseEntropy: 0,
    scrollEntropy: 0
  };

  private startTime = Date.now();
  private mousePositions: { x: number; y: number; time: number }[] = [];
  private scrollPositions: { y: number; time: number }[] = [];

  startTracking(): void {
    this.startTime = Date.now();
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Mouse movement tracking
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('click', this.handleClick.bind(this));
    
    // Scroll tracking
    document.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Keyboard tracking
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Focus events
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleFocus.bind(this));
  }

  private handleMouseMove(event: MouseEvent): void {
    this.metrics.mouseMovements++;
    this.mousePositions.push({
      x: event.clientX,
      y: event.clientY,
      time: Date.now()
    });

    // Keep only last 100 positions for entropy calculation
    if (this.mousePositions.length > 100) {
      this.mousePositions.shift();
    }

    this.updateMouseEntropy();
  }

  private handleClick(): void {
    this.metrics.clicks++;
  }

  private handleScroll(): void {
    this.metrics.scrolls++;
    this.scrollPositions.push({
      y: window.scrollY,
      time: Date.now()
    });

    if (this.scrollPositions.length > 50) {
      this.scrollPositions.shift();
    }

    this.updateScrollEntropy();
  }

  private handleKeydown(): void {
    this.metrics.keystrokes++;
  }

  private handleFocus(): void {
    this.metrics.focusEvents++;
  }

  private updateMouseEntropy(): void {
    if (this.mousePositions.length < 10) return;

    // Calculate entropy based on mouse movement patterns
    const distances = [];
    for (let i = 1; i < this.mousePositions.length; i++) {
      const prev = this.mousePositions[i - 1];
      const curr = this.mousePositions[i];
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      distances.push(distance);
    }

    // Calculate variance as entropy measure
    const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / distances.length;
    this.metrics.mouseEntropy = variance;
  }

  private updateScrollEntropy(): void {
    if (this.scrollPositions.length < 5) return;

    const speeds = [];
    for (let i = 1; i < this.scrollPositions.length; i++) {
      const prev = this.scrollPositions[i - 1];
      const curr = this.scrollPositions[i];
      const timeDiff = curr.time - prev.time;
      const scrollDiff = Math.abs(curr.y - prev.y);
      speeds.push(timeDiff > 0 ? scrollDiff / timeDiff : 0);
    }

    const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / speeds.length;
    this.metrics.scrollEntropy = variance;
  }

  getMetrics(): BehaviorMetrics {
    this.metrics.timeOnPage = Date.now() - this.startTime;
    return { ...this.metrics };
  }

  calculateBehaviorScore(): number {
    const metrics = this.getMetrics();
    let botScore = 0;

    // Time-based analysis
    if (metrics.timeOnPage < 500) {
      botScore += 30; // Too fast
    } else if (metrics.timeOnPage > 60000 && metrics.mouseMovements === 0) {
      botScore += 25; // Long time with no interaction
    }

    // Movement analysis
    if (metrics.mouseMovements === 0 && metrics.timeOnPage > 2000) {
      botScore += 40; // No mouse movement after 2 seconds
    }

    if (metrics.mouseEntropy < 10 && metrics.mouseMovements > 10) {
      botScore += 35; // Too uniform mouse movement
    }

    // Click patterns
    if (metrics.clicks > 10 && metrics.mouseMovements < 5) {
      botScore += 30; // Clicking without moving mouse
    }

    // Scroll patterns
    if (metrics.scrolls > 5 && metrics.scrollEntropy < 5) {
      botScore += 25; // Too uniform scrolling
    }

    // Interaction combinations
    if (metrics.keystrokes === 0 && metrics.clicks === 0 && metrics.scrolls === 0 && metrics.timeOnPage > 3000) {
      botScore += 50; // No interaction at all
    }

    return Math.min(botScore, 100);
  }

  cleanup(): void {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('click', this.handleClick.bind(this));
    document.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
    window.removeEventListener('focus', this.handleFocus.bind(this));
    window.removeEventListener('blur', this.handleFocus.bind(this));
  }
}
