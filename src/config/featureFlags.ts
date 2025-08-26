/**
 * Feature flags configuration for gradual feature rollout
 */

export interface FeatureFlags {
  // Core features
  MEAL_TEMPLATES: boolean;
  PACKING_TEMPLATES: boolean;
  EXPENSE_TRACKING: boolean;
  WEATHER_INTEGRATION: boolean;
  
  // Advanced features
  OFFLINE_MODE: boolean;
  COMMUNITY_TEMPLATES: boolean;
  AI_SUGGESTIONS: boolean;
  TRIP_SHARING: boolean;
  
  // Experimental features
  VOICE_COMMANDS: boolean;
  AR_PACKING: boolean;
  SMART_NOTIFICATIONS: boolean;
  
  // Performance features
  PERFORMANCE_MONITORING: boolean;
  ERROR_TRACKING: boolean;
  ANALYTICS: boolean;
}

// Default feature flags
const defaultFlags: FeatureFlags = {
  // Core features (enabled by default)
  MEAL_TEMPLATES: true,
  PACKING_TEMPLATES: true,
  EXPENSE_TRACKING: true,
  WEATHER_INTEGRATION: false, // Requires API key
  
  // Advanced features (disabled by default)
  OFFLINE_MODE: false,
  COMMUNITY_TEMPLATES: false,
  AI_SUGGESTIONS: false,
  TRIP_SHARING: false,
  
  // Experimental features (disabled by default)
  VOICE_COMMANDS: false,
  AR_PACKING: false,
  SMART_NOTIFICATIONS: false,
  
  // Performance features
  PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  ERROR_TRACKING: process.env.NODE_ENV === 'production',
  ANALYTICS: false
};

// Override with environment variables
const envFlags: Partial<FeatureFlags> = {
  MEAL_TEMPLATES: process.env.REACT_APP_FEATURE_MEAL_TEMPLATES === 'true',
  PACKING_TEMPLATES: process.env.REACT_APP_FEATURE_PACKING_TEMPLATES === 'true',
  EXPENSE_TRACKING: process.env.REACT_APP_FEATURE_EXPENSE_TRACKING === 'true',
  WEATHER_INTEGRATION: process.env.REACT_APP_FEATURE_WEATHER === 'true',
  OFFLINE_MODE: process.env.REACT_APP_FEATURE_OFFLINE === 'true',
  COMMUNITY_TEMPLATES: process.env.REACT_APP_FEATURE_COMMUNITY === 'true',
  AI_SUGGESTIONS: process.env.REACT_APP_FEATURE_AI === 'true',
  TRIP_SHARING: process.env.REACT_APP_FEATURE_SHARING === 'true',
  PERFORMANCE_MONITORING: process.env.REACT_APP_FEATURE_PERF_MONITORING === 'true',
  ERROR_TRACKING: process.env.REACT_APP_FEATURE_ERROR_TRACKING === 'true',
  ANALYTICS: process.env.REACT_APP_FEATURE_ANALYTICS === 'true'
};

// Merge default with environment overrides
const mergedFlags: FeatureFlags = {
  ...defaultFlags,
  ...Object.fromEntries(
    Object.entries(envFlags).filter(([_, value]) => value !== undefined)
  ) as Partial<FeatureFlags>
};

// Feature flag manager class
class FeatureFlagManager {
  private flags: FeatureFlags;
  private overrides: Partial<FeatureFlags> = {};

  constructor(initialFlags: FeatureFlags) {
    this.flags = { ...initialFlags };
    this.loadOverrides();
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    // Check overrides first
    if (feature in this.overrides) {
      return this.overrides[feature]!;
    }
    
    return this.flags[feature] || false;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags, ...this.overrides };
  }

  /**
   * Override a feature flag (for testing)
   */
  override(feature: keyof FeatureFlags, enabled: boolean): void {
    this.overrides[feature] = enabled;
    this.saveOverrides();
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides = {};
    localStorage.removeItem('featureFlagOverrides');
  }

  /**
   * Load overrides from localStorage (for testing)
   */
  private loadOverrides(): void {
    if (process.env.NODE_ENV === 'development') {
      try {
        const stored = localStorage.getItem('featureFlagOverrides');
        if (stored) {
          this.overrides = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load feature flag overrides:', error);
      }
    }
  }

  /**
   * Save overrides to localStorage
   */
  private saveOverrides(): void {
    if (process.env.NODE_ENV === 'development') {
      try {
        localStorage.setItem('featureFlagOverrides', JSON.stringify(this.overrides));
      } catch (error) {
        console.error('Failed to save feature flag overrides:', error);
      }
    }
  }

  /**
   * Check multiple features at once
   */
  areEnabled(...features: Array<keyof FeatureFlags>): boolean {
    return features.every(feature => this.isEnabled(feature));
  }

  /**
   * Check if any of the features are enabled
   */
  anyEnabled(...features: Array<keyof FeatureFlags>): boolean {
    return features.some(feature => this.isEnabled(feature));
  }

  /**
   * Get feature status report
   */
  getStatusReport(): string {
    const flags = this.getAllFlags();
    let report = '🚩 Feature Flags Status\n';
    report += '=' .repeat(50) + '\n\n';
    
    Object.entries(flags).forEach(([feature, enabled]) => {
      const status = enabled ? '✅' : '❌';
      const override = feature in this.overrides ? ' (overridden)' : '';
      report += `${status} ${feature}${override}\n`;
    });
    
    return report;
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager(mergedFlags);

// React hook for feature flags
import { useMemo } from 'react';

export const useFeatureFlag = (feature: keyof FeatureFlags): boolean => {
  return useMemo(() => featureFlags.isEnabled(feature), [feature]);
};

export const useFeatureFlags = (...features: Array<keyof FeatureFlags>): boolean[] => {
  return useMemo(
    () => features.map(feature => featureFlags.isEnabled(feature)),
    [features]
  );
};

// Development-only: Add to window for debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).featureFlags = featureFlags;
  console.log('Feature flags available at window.featureFlags');
  console.log('Use featureFlags.override("FEATURE_NAME", true/false) to test features');
}