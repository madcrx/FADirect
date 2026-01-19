#!/usr/bin/env bash

# This script runs after the dependencies are installed but before the build starts
# It patches the Podfile to fix BoringSSL-GRPC compilation with Xcode 16

set -e

echo "🔧 EAS Build Hook: Patching BoringSSL-GRPC for Xcode 16 compatibility"

PODFILE_PATH="$EAS_BUILD_WORKINGDIR/ios/Podfile"

if [ ! -f "$PODFILE_PATH" ]; then
  echo "⚠️  Podfile not found at $PODFILE_PATH"
  echo "⚠️  Skipping BoringSSL-GRPC patch"
  exit 0
fi

echo "✓ Found Podfile at $PODFILE_PATH"

# Check if patch already applied
if grep -q "# Fix BoringSSL-GRPC for Xcode 16" "$PODFILE_PATH"; then
  echo "✓ BoringSSL-GRPC patch already applied"
  exit 0
fi

echo "📝 Applying BoringSSL-GRPC Xcode 16 compatibility patch..."

# Create patch content
PATCH_CONTENT='
    # Fix BoringSSL-GRPC for Xcode 16 - Remove unsupported -G flag
    installer.pods_project.targets.each do |target|
      if target.name.include?("BoringSSL-GRPC")
        puts "🔧 Fixing BoringSSL-GRPC for Xcode 16: #{target.name}"

        target.build_configurations.each do |config|
          # Only modify OTHER_CFLAGS if it exists
          if config.build_settings["OTHER_CFLAGS"]
            other_cflags = config.build_settings["OTHER_CFLAGS"]
            if other_cflags.is_a?(String)
              config.build_settings["OTHER_CFLAGS"] = other_cflags.gsub(/-G\s+/, "").gsub(/\s+-G$/, "").gsub(/^-G\s+/, "")
            elsif other_cflags.is_a?(Array)
              config.build_settings["OTHER_CFLAGS"] = other_cflags.select { |flag| flag != "-G" }
            end
          end

          # Only modify OTHER_CPLUSPLUSFLAGS if it exists
          if config.build_settings["OTHER_CPLUSPLUSFLAGS"]
            other_cxxflags = config.build_settings["OTHER_CPLUSPLUSFLAGS"]
            if other_cxxflags.is_a?(String)
              config.build_settings["OTHER_CPLUSPLUSFLAGS"] = other_cxxflags.gsub(/-G\s+/, "").gsub(/\s+-G$/, "").gsub(/^-G\s+/, "")
            elsif other_cxxflags.is_a?(Array)
              config.build_settings["OTHER_CPLUSPLUSFLAGS"] = other_cxxflags.select { |flag| flag != "-G" }
            end
          end
        end

        puts "✓ Fixed BoringSSL-GRPC compilation flags"
      end
    end
'

# Find the post_install block and inject our patch
if grep -q "post_install do |installer|" "$PODFILE_PATH"; then
  echo "✓ Found existing post_install block"

  # Use awk to inject the patch before the last 'end' of the post_install block
  awk -v patch="$PATCH_CONTENT" '
    /post_install do \|installer\|/ { in_post_install=1; depth=1; print; next }
    in_post_install && /^\s*end\s*$/ {
      depth--
      if (depth == 0) {
        print patch
        in_post_install=0
      }
      print
      next
    }
    in_post_install && /do\s*$/ { depth++; print; next }
    { print }
  ' "$PODFILE_PATH" > "$PODFILE_PATH.tmp" && mv "$PODFILE_PATH.tmp" "$PODFILE_PATH"

  echo "✅ Successfully patched Podfile"
else
  echo "⚠️  No post_install block found in Podfile"
  echo "⚠️  Patch not applied"
fi

echo "✓ BoringSSL-GRPC Xcode 16 patch completed"
