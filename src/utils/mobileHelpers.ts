import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

export const isMobile = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};

export const initializeMobile = async () => {
  if (isMobile()) {
    // Hide splash screen
    await SplashScreen.hide();

    // Set status bar style
    if (Capacitor.isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Dark });
    }

    // Handle keyboard on mobile
    if (Capacitor.isPluginAvailable('Keyboard')) {
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-open');
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
      });
    }
  }
};

// Mobile-specific styles helper
export const getMobileClasses = () => {
  if (!isMobile()) return '';
  
  const platform = getPlatform();
  return `mobile-app ${platform}-app`;
};