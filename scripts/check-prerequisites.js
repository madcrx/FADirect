#!/usr/bin/env node

/**
 * Check Prerequisites for FA Direct Build
 * Run this to verify your environment is ready
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking FA Direct Build Prerequisites...\n');

const checks = [];

// Check Node.js version
try {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (major >= 18) {
    checks.push({ name: 'Node.js', status: '✅', detail: nodeVersion });
  } else {
    checks.push({ name: 'Node.js', status: '❌', detail: `${nodeVersion} (need 18+)` });
  }
} catch (error) {
  checks.push({ name: 'Node.js', status: '❌', detail: 'Not found' });
}

// Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  const major = parseInt(npmVersion.split('.')[0]);
  if (major >= 9) {
    checks.push({ name: 'npm', status: '✅', detail: npmVersion });
  } else {
    checks.push({ name: 'npm', status: '❌', detail: `${npmVersion} (need 9+)` });
  }
} catch (error) {
  checks.push({ name: 'npm', status: '❌', detail: 'Not found' });
}

// Check if EAS CLI is installed
try {
  const easVersion = execSync('eas --version', { encoding: 'utf8' }).trim();
  checks.push({ name: 'EAS CLI', status: '✅', detail: easVersion });
} catch (error) {
  checks.push({ name: 'EAS CLI', status: '⚠️', detail: 'Not installed (will install)' });
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  checks.push({ name: 'Dependencies', status: '✅', detail: 'Installed' });
} else {
  checks.push({ name: 'Dependencies', status: '⚠️', detail: 'Need to run npm install' });
}

// Check for Firebase config files
const googleServicesJson = path.join(process.cwd(), 'google-services.json');
const googleServicesPlist = path.join(process.cwd(), 'GoogleService-Info.plist');

if (fs.existsSync(googleServicesJson)) {
  checks.push({ name: 'Android Firebase Config', status: '✅', detail: 'google-services.json found' });
} else {
  checks.push({ name: 'Android Firebase Config', status: '❌', detail: 'google-services.json missing' });
}

if (fs.existsSync(googleServicesPlist)) {
  checks.push({ name: 'iOS Firebase Config', status: '✅', detail: 'GoogleService-Info.plist found' });
} else {
  checks.push({ name: 'iOS Firebase Config', status: '❌', detail: 'GoogleService-Info.plist missing' });
}

// Check eas.json
const easJsonPath = path.join(process.cwd(), 'eas.json');
if (fs.existsSync(easJsonPath)) {
  checks.push({ name: 'EAS Configuration', status: '✅', detail: 'eas.json found' });
} else {
  checks.push({ name: 'EAS Configuration', status: '❌', detail: 'eas.json missing' });
}

// Display results
console.log('📊 Results:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name.padEnd(30)} ${check.detail}`);
});

// Summary and next steps
const hasErrors = checks.some(c => c.status === '❌');
const hasWarnings = checks.some(c => c.status === '⚠️');

console.log('\n' + '='.repeat(60) + '\n');

if (!hasErrors && !hasWarnings) {
  console.log('🎉 All prerequisites met! You\'re ready to build.\n');
  console.log('Next steps:');
  console.log('  1. eas login');
  console.log('  2. eas build:configure');
  console.log('  3. npm run build:preview\n');
} else if (hasErrors) {
  console.log('❌ Required items missing. Please fix the following:\n');

  checks.filter(c => c.status === '❌').forEach(check => {
    console.log(`\n${check.name}:`);

    if (check.name === 'Node.js') {
      console.log('  Install from: https://nodejs.org/');
      console.log('  Download the LTS version (18 or higher)');
    } else if (check.name === 'npm') {
      console.log('  Update npm: npm install -g npm@latest');
    } else if (check.name === 'Android Firebase Config') {
      console.log('  1. Go to Firebase Console: https://console.firebase.google.com');
      console.log('  2. Select your project → Project Settings');
      console.log('  3. Scroll to "Your apps" → Android app');
      console.log('  4. Download google-services.json');
      console.log('  5. Place in project root: FADirect/google-services.json');
    } else if (check.name === 'iOS Firebase Config') {
      console.log('  1. Go to Firebase Console: https://console.firebase.google.com');
      console.log('  2. Select your project → Project Settings');
      console.log('  3. Scroll to "Your apps" → iOS app');
      console.log('  4. Download GoogleService-Info.plist');
      console.log('  5. Place in project root: FADirect/GoogleService-Info.plist');
    }
  });

  console.log('\n📖 See WINDOWS_TESTING_GUIDE.md for detailed instructions\n');
} else if (hasWarnings) {
  console.log('⚠️  Some optional items need attention:\n');

  checks.filter(c => c.status === '⚠️').forEach(check => {
    console.log(`\n${check.name}:`);

    if (check.name === 'EAS CLI') {
      console.log('  Install: npm install -g eas-cli');
    } else if (check.name === 'Dependencies') {
      console.log('  Install: npm install');
    }
  });

  console.log('\n✅ You can fix these and continue\n');
}

console.log('📚 Full documentation:');
console.log('  • WINDOWS_TESTING_GUIDE.md - Complete setup guide');
console.log('  • QUICK_START_DISTRIBUTION.md - Quick reference');
console.log('');

process.exit(hasErrors ? 1 : 0);
