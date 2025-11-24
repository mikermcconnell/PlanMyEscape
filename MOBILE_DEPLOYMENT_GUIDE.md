# PlanMyEscape Mobile Deployment Guide

## Overview
This guide explains how to maintain both your web app (planmyescape.ca) and mobile apps (iOS/Android) from a single codebase.

## Project Structure
```
PlanMyEscape/
├── src/                    # Shared React code
├── build/                  # Web build output
├── ios/                    # iOS native project
├── android/                # Android native project
├── capacitor.config.ts     # Mobile configuration
└── package.json           # Unified dependencies
```

## Development Workflow

### 1. **Making Changes**
All changes are made in the `src/` directory. The same code serves both web and mobile.

### 2. **Testing Locally**
```bash
# Test web version
npm start

# Test mobile version (after changes)
npm run mobile:build
npm run mobile:ios      # Opens iOS in Xcode
npm run mobile:android  # Opens Android in Android Studio
```

## Deployment Strategies

### **Web Deployment (planmyescape.ca)**
Your current Vercel setup remains unchanged:

1. **Automatic Deployment:**
   - Push to GitHub → Vercel auto-deploys
   - Environment variables already configured

2. **Manual Deployment:**
   ```bash
   npm run deploy:web
   # Then push to GitHub or deploy to Vercel manually
   ```

### **Mobile App Deployment**

#### **Initial App Store Setup (One-time)**

**iOS App Store:**
1. Apple Developer Account ($99/year)
2. Create app in App Store Connect
3. Configure app details:
   - Name: PlanMyEscape
   - Bundle ID: ca.planmyescape.app
   - Category: Travel

**Google Play Store:**
1. Google Play Developer Account ($25 one-time)
2. Create app in Google Play Console
3. Configure app details:
   - Name: PlanMyEscape
   - Package: ca.planmyescape.app
   - Category: Travel & Local

#### **Building for Production**

**iOS Release Build:**
```bash
npm run mobile:build
npx cap open ios

# In Xcode:
# 1. Set scheme to "Release"
# 2. Product → Archive
# 3. Upload to App Store Connect
```

**Android Release Build:**
```bash
npm run mobile:build
npx cap open android

# In Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Upload to Google Play Console
```

**Secure Android Signing (required before release submission):**
1. Create your release keystore outside of the repository (for example, `../secrets/planmyescape-release.jks`).
2. Add a `keystore.properties` file (kept out of git) alongside `android/` with the following keys:
   ```properties
   storeFile=../secrets/planmyescape-release.jks
   storePassword=your-store-password
   keyAlias=your-key-alias
   keyPassword=your-key-password
   ```
3. Alternatively, configure CI environment variables (`ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_STORE_PASSWORD`, `ANDROID_KEYSTORE_KEY_ALIAS`, `ANDROID_KEYSTORE_KEY_PASSWORD`).
4. Never commit the keystore or `keystore.properties`; both are ignored via `.gitignore`.
5. Verify a release build signs correctly before uploading to Play.

## Update Workflow

### **For Both Web and Mobile Updates:**

1. **Make Changes** in `src/` directory
2. **Test Locally**:
   ```bash
   npm start                    # Test web
   npm run mobile:ios          # Test iOS
   npm run mobile:android      # Test Android
   ```
3. **Deploy Web**:
   ```bash
   git add .
   git commit -m "Feature: Your update description"
   git push origin master      # Auto-deploys to Vercel
   ```
4. **Deploy Mobile**:
   ```bash
   npm run mobile:build        # Sync changes to mobile
   # Then build and upload using Xcode/Android Studio
   ```

### **Update Frequency Recommendations**

**Web Updates:** 
- Can be deployed instantly
- Push updates as frequently as needed
- Users get updates immediately

**Mobile Updates:**
- Bundle multiple features
- Deploy monthly or bi-weekly
- App store review process takes 1-7 days

## Environment Variables

### **Web (Vercel)**
Already configured:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

### **Mobile**
Environment variables are embedded during build, so they work the same way.

## Version Management

### **Web Versioning**
- Automatic via Vercel deployments
- Version based on Git commits

### **Mobile Versioning**
Update version numbers before App Store releases:

**iOS (ios/App/App.xcodeproj):**
- Version: 1.0.0, 1.1.0, 1.2.0 (user-facing)
- Build: 1, 2, 3, 4 (internal, increment each upload)

**Android (android/app/build.gradle):**
```gradle
versionName "1.0.0"    // User-facing version
versionCode 1          // Internal version (increment each upload)
```

## Testing Strategy

### **Pre-deployment Checklist**

**Web Testing:**
- [ ] Authentication works
- [ ] All features function correctly
- [ ] Responsive design works
- [ ] No console errors

**Mobile Testing:**
- [ ] App launches correctly
- [ ] Touch interactions work
- [ ] Navigation flows properly
- [ ] Offline functionality (if applicable)
- [ ] iOS and Android both tested

## Common Commands Reference

```bash
# Development
npm start                    # Web dev server
npm run mobile:ios          # Open iOS in Xcode
npm run mobile:android      # Open Android Studio (sync first)

# Android Studio helpers
npm run android:studio      # Launch Android Studio using Capacitor
npm run android:assembleDebug  # Gradle assembleDebug via helper script
npm run android:bundleRelease  # Gradle bundleRelease via helper script
npm run android:clean          # Gradle clean via helper script

# Building
npm run build               # Web production build
npm run mobile:build        # Mobile production build

# Deployment
npm run deploy:web          # Prepare web deployment
npm run deploy:mobile       # Prepare mobile deployment

# Testing
npm run mobile:run:ios      # Run on iOS simulator
npm run mobile:run:android  # Run on Android emulator
```

## Troubleshooting

### **Common Issues:**

1. **Mobile build fails:**
   ```bash
   rm -rf node_modules
   npm install
   npm run mobile:build
   ```

2. **iOS build issues:**
   - Check Xcode version compatibility
   - Clean build folder in Xcode

3. **Android build issues:**
   - Check Android SDK versions
   - Clean and rebuild in Android Studio

### **Getting Help:**
- Capacitor Documentation: https://capacitorjs.com/docs
- iOS Development: https://developer.apple.com
- Android Development: https://developer.android.com

## Next Steps

1. **Complete mobile setup** (Xcode/Android Studio)
2. **Test on physical devices**
3. **Set up App Store accounts**
4. **Create app store listings**
5. **Submit for review**

Your codebase is now ready for both web and mobile deployment! 🚀