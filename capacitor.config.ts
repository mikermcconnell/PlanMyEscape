import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ca.planmyescape.app',
  appName: 'PlanMyEscape',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: '#10B981',
    showSpinner: false,
    androidScaleType: 'CENTER_CROP',
    splashFullScreen: true,
    launchAutoHide: true,
  },
  StatusBar: {
    style: 'dark',
    overlaysWebView: false,
  }
  ios: {
    contentInset: 'always'
  }
};

export default config;
