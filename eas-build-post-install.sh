#!/usr/bin/env bash

# EAS Build Post-Install Hook
# This runs after npm install. We use it to ensure the Podfile
# gets patched after expo prebuild generates it.

set -e

echo "🔧 Post-install hook: Setting up BoringSSL-GRPC Xcode 16 fix"

# Create a script that will patch the Podfile after it's generated
cat > patch-podfile.sh << 'PATCH_SCRIPT'
#!/usr/bin/env bash
set -e

PODFILE="ios/Podfile"

if [ ! -f "$PODFILE" ]; then
  echo "⚠️  Podfile not found, skipping patch"
  exit 0
fi

if grep -q "BoringSSL Xcode 16 Fix" "$PODFILE"; then
  echo "✓ Podfile already patched"
  exit 0
fi

echo "🔧 Patching Podfile for BoringSSL-GRPC Xcode 16 compatibility..."

# Add the fix before the final 'end' statement
cat >> "$PODFILE" << 'EOF'

# BoringSSL Xcode 16 Fix - Remove unsupported -G compiler flag
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if target.name.include?('BoringSSL-GRPC')
      puts "🔧 Patching #{target.name} for Xcode 16"
      target.build_configurations.each do |config|
        if config.build_settings['OTHER_CFLAGS']
          if config.build_settings['OTHER_CFLAGS'].is_a?(String)
            config.build_settings['OTHER_CFLAGS'] = config.build_settings['OTHER_CFLAGS'].gsub(/-G\s*/, '')
          elsif config.build_settings['OTHER_CFLAGS'].is_a?(Array)
            config.build_settings['OTHER_CFLAGS'].delete('-G')
          end
        end
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      end
      puts "✅ Patched #{target.name}"
    end
    target.build_configurations.each do |config|
      if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      end
    end
  end
end
EOF

echo "✅ Podfile patched successfully"
PATCH_SCRIPT

chmod +x patch-podfile.sh

# Run expo prebuild manually so we can control when patching happens
echo "📦 Running expo prebuild..."
npx expo prebuild --platform ios --clean

# Now patch the generated Podfile
echo "🔧 Patching generated Podfile..."
./patch-podfile.sh

echo "✅ Post-install setup completed"

