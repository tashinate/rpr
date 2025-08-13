class HumanActivityTracker {
  private mouseTimer: NodeJS.Timeout | null = null;
  private isTracking = false;

  startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    // Clear previous activity indicators
    localStorage.removeItem('mouseActivity');
    localStorage.removeItem('keyboardActivity');
    localStorage.removeItem('scrollActivity');
    localStorage.removeItem('clickActivity');
    localStorage.removeItem('touchActivity');

    // Track mouse movement
    document.addEventListener('mousemove', () => {
      if (this.mouseTimer) clearTimeout(this.mouseTimer);
      this.mouseTimer = setTimeout(() => {
        localStorage.setItem('mouseActivity', 'true');
      }, 100);
    });

    // Track keyboard activity
    document.addEventListener('keydown', () => {
      localStorage.setItem('keyboardActivity', 'true');
    });

    // Track scroll activity
    let scrollTimer: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        localStorage.setItem('scrollActivity', 'true');
      }, 100);
    });

    // Track click activity
    document.addEventListener('click', () => {
      localStorage.setItem('clickActivity', 'true');
    });

    // Track touch activity (mobile)
    document.addEventListener('touchstart', () => {
      localStorage.setItem('touchActivity', 'true');
    });
  }

  hasHumanActivity(): boolean {
    return !!(
      localStorage.getItem('mouseActivity') ||
      localStorage.getItem('keyboardActivity') ||
      localStorage.getItem('scrollActivity') ||
      localStorage.getItem('clickActivity') ||
      localStorage.getItem('touchActivity')
    );
  }

  hasAnyActivity(): boolean {
    return this.hasHumanActivity();
  }

  getActivityScore(): number {
    let score = 0;
    if (localStorage.getItem('mouseActivity')) score += 2;
    if (localStorage.getItem('keyboardActivity')) score += 2;
    if (localStorage.getItem('scrollActivity')) score += 1;
    if (localStorage.getItem('clickActivity')) score += 2;
    if (localStorage.getItem('touchActivity')) score += 1;
    return score;
  }

  incrementVisitCount(): number {
    const visits = parseInt(localStorage.getItem('total_visits') || '0') + 1;
    localStorage.setItem('total_visits', visits.toString());
    return visits;
  }

  getVisitCount(): number {
    return parseInt(localStorage.getItem('total_visits') || '0');
  }

  reset() {
    localStorage.removeItem('mouseActivity');
    localStorage.removeItem('keyboardActivity');
    localStorage.removeItem('scrollActivity');
    localStorage.removeItem('clickActivity');
    localStorage.removeItem('touchActivity');
    localStorage.removeItem('total_visits');
  }
}

export const humanActivityTracker = new HumanActivityTracker();