#!/usr/bin/env bash

# EAS Build Pre-Install Hook
# This script runs before dependencies are installed
# It creates Firebase config files from EAS Secrets if they're available

set -e

echo "🔧 Running EAS Build pre-install hook..."

# Check if GOOGLE_SERVICES_JSON secret exists and create the file
if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "✓ Found GOOGLE_SERVICES_JSON secret, creating google-services.json..."
  echo "$GOOGLE_SERVICES_JSON" | base64 -d > google-services.json
  echo "✓ Created google-services.json"
else
  echo "⚠ GOOGLE_SERVICES_JSON secret not found"
  if [ -f "google-services.json" ]; then
    echo "  Using existing google-services.json from repository"
  else
    echo "  ⚠ Warning: google-services.json not found - Android build may fail"
  fi
fi

# Check if GOOGLE_SERVICE_INFO_PLIST secret exists and create the file
if [ -n "$GOOGLE_SERVICE_INFO_PLIST" ]; then
  echo "✓ Found GOOGLE_SERVICE_INFO_PLIST secret, creating GoogleService-Info.plist..."
  mkdir -p ios
  echo "$GOOGLE_SERVICE_INFO_PLIST" | base64 -d > ios/GoogleService-Info.plist
  echo "✓ Created ios/GoogleService-Info.plist"
else
  echo "⚠ GOOGLE_SERVICE_INFO_PLIST secret not found"
  if [ -f "ios/GoogleService-Info.plist" ]; then
    echo "  Using existing GoogleService-Info.plist from repository"
  else
    echo "  ⚠ Warning: GoogleService-Info.plist not found - iOS build may fail"
  fi
fi

echo "✓ Pre-install hook completed"
