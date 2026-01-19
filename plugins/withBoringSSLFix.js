const {
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix BoringSSL-GRPC compilation with Xcode 16
 * Adds a post_install hook to remove the unsupported -G compiler flag
 */
const withBoringSSLFix = (config) => {
  console.log('🔧 withBoringSSLFix plugin is running...');

  return withDangerousMod(config, [
    'ios',
    async (config) => {
      console.log('🔍 Looking for Podfile to patch...');

      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn('⚠️  Podfile not found at:', podfilePath);
        console.warn('⚠️  Skipping BoringSSL-GRPC fix');
        return config;
      }

      console.log('✓ Found Podfile at:', podfilePath);
      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      // Check if our fix is already applied
      if (podfileContent.includes('# Fix BoringSSL-GRPC for Xcode 16')) {
        console.log('✓ BoringSSL-GRPC fix already applied');
        return config;
      }

      console.log('📝 Applying BoringSSL-GRPC Xcode 16 fix...');

      // Patch code to inject into existing post_install hook
      const patchCode = `
    # Fix BoringSSL-GRPC for Xcode 16 - Remove unsupported -G flag
    installer.pods_project.targets.each do |target|
      if target.name.include?('BoringSSL-GRPC')
        puts "🔧 Fixing BoringSSL-GRPC for Xcode 16: \#{target.name}"

        target.build_configurations.each do |config|
          # Only modify OTHER_CFLAGS if it exists
          if config.build_settings['OTHER_CFLAGS']
            other_cflags = config.build_settings['OTHER_CFLAGS']
            if other_cflags.is_a?(String)
              config.build_settings['OTHER_CFLAGS'] = other_cflags.gsub(/-G\\s+/, '').gsub(/\\s+-G$/, '').gsub(/^-G\\s+/, '')
            elsif other_cflags.is_a?(Array)
              config.build_settings['OTHER_CFLAGS'] = other_cflags.select { |flag| flag != '-G' }
            end
          end

          # Only modify OTHER_CPLUSPLUSFLAGS if it exists
          if config.build_settings['OTHER_CPLUSPLUSFLAGS']
            other_cxxflags = config.build_settings['OTHER_CPLUSPLUSFLAGS']
            if other_cxxflags.is_a?(String)
              config.build_settings['OTHER_CPLUSPLUSFLAGS'] = other_cxxflags.gsub(/-G\\s+/, '').gsub(/\\s+-G$/, '').gsub(/^-G\\s+/, '')
            elsif other_cxxflags.is_a?(Array)
              config.build_settings['OTHER_CPLUSPLUSFLAGS'] = other_cxxflags.select { |flag| flag != '-G' }
            end
          end
        end

        puts "✓ Fixed BoringSSL-GRPC compilation flags"
      end
    end
`;

      // Find existing post_install block and inject our code
      const lines = podfileContent.split('\n');
      let injected = false;

      // Look for post_install block
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('post_install do |installer|')) {
          // Find the end of this block
          let depth = 1;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim().startsWith('do ')) {
              depth++;
            } else if (lines[j].trim() === 'end') {
              depth--;
              if (depth === 0) {
                // Insert our patch before this 'end'
                lines.splice(j, 0, patchCode);
                injected = true;
                break;
              }
            }
          }
          if (injected) break;
        }
      }

      if (!injected) {
        // No post_install found, create one
        const newPostInstall = `
  post_install do |installer|
${patchCode}
  end
`;
        // Append before final end
        const lastEndIndex = lines.lastIndexOf('end');
        if (lastEndIndex > -1) {
          lines.splice(lastEndIndex, 0, newPostInstall);
        } else {
          lines.push(newPostInstall);
        }
      }

      podfileContent = lines.join('\n');
      fs.writeFileSync(podfilePath, podfileContent);
      console.log('✅ Applied BoringSSL-GRPC Xcode 16 fix to Podfile');

      return config;
    },
  ]);
};

module.exports = withBoringSSLFix;
