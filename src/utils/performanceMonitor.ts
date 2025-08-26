/**
 * Performance monitoring utilities for tracking app performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start timing an operation
   */
  startTimer(name: string): void {
    if (!this.enabled) return;
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and record the metric
   */
  endTimer(name: string, metadata?: Record<string, any>): number {
    if (!this.enabled) return 0;
    
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }

    return duration;
  }

  /**
   * Measure a function's execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      const duration = this.endTimer(name, metadata);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      this.endTimer(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const summary: Record<string, number[]> = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = [];
      }
      summary[metric.name]!.push(metric.duration);
    });

    return Object.entries(summary).reduce((acc, [name, durations]) => {
      acc[name] = {
        count: durations.length,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations)
      };
      return acc;
    }, {} as Record<string, { count: number; avg: number; min: number; max: number }>);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    if (!this.enabled) return;
    
    const summary = this.getSummary();
    console.table(summary);
  }

  /**
   * Check if a metric exceeds threshold
   */
  checkThreshold(name: string, threshold: number): boolean {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    return relevantMetrics.some(m => m.duration > threshold);
  }

  /**
   * Get performance report
   */
  getReport(): string {
    const summary = this.getSummary();
    let report = '📊 Performance Report\n';
    report += '=' .repeat(50) + '\n\n';
    
    Object.entries(summary).forEach(([name, stats]) => {
      report += `📈 ${name}\n`;
      report += `  Count: ${stats.count}\n`;
      report += `  Avg: ${stats.avg.toFixed(2)}ms\n`;
      report += `  Min: ${stats.min.toFixed(2)}ms\n`;
      report += `  Max: ${stats.max.toFixed(2)}ms\n\n`;
    });
    
    return report;
  }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const measure = async <T,>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return perfMonitor.measure(`${componentName}.${operation}`, fn);
  };

  return { measure };
};