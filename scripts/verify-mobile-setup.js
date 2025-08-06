#!/usr/bin/env node

// Mobile setup verification script
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying PlanMyEscape Mobile Setup...\n');

const checks = [
  {
    name: 'Capacitor Config',
    check: () => fs.existsSync('capacitor.config.ts'),
    message: 'capacitor.config.ts exists ✅'
  },
  {
    name: 'iOS Platform',
    check: () => fs.existsSync('ios/App/App.xcodeproj'),
    message: 'iOS platform added ✅'
  },
  {
    name: 'Android Platform',
    check: () => fs.existsSync('android/app/build.gradle'),
    message: 'Android platform added ✅'
  },
  {
    name: 'Mobile Utilities',
    check: () => fs.existsSync('src/utils/mobileHelpers.ts'),
    message: 'Mobile helper utilities created ✅'
  },
  {
    name: 'Mobile Styles',
    check: () => fs.existsSync('src/styles/mobile.css'),
    message: 'Mobile-specific styles added ✅'
  },
  {
    name: 'Build Directory',
    check: () => fs.existsSync('build'),
    message: 'Build directory exists ✅'
  }
];

let allPassed = true;

checks.forEach(({ name, check, message }) => {
  if (check()) {
    console.log(`✅ ${message}`);
  } else {
    console.log(`❌ ${name} - MISSING`);
    allPassed = false;
  }
});

console.log('\n📱 Next Steps:');

if (allPassed) {
  console.log('✅ Mobile setup is complete!');
  console.log('\n🚀 Ready to run:');
  console.log('   npm run mobile:ios      # Open iOS in Xcode');
  console.log('   npm run mobile:android  # Open Android Studio');
  console.log('\n📖 See MOBILE_DEPLOYMENT_GUIDE.md for detailed instructions');
} else {
  console.log('❌ Setup incomplete. Please run the setup steps again.');
}

console.log('\n📋 Available Commands:');
console.log('   npm run mobile:build     # Build and sync mobile platforms');
console.log('   npm run mobile:ios       # Open iOS project');
console.log('   npm run mobile:android   # Open Android project');
console.log('   npm run deploy:web       # Deploy to web');
console.log('   npm run deploy:mobile    # Prepare mobile deployment');