const {
  withDangerousMod,
  withPlugins,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix BoringSSL-GRPC compilation with Xcode 16
 * Adds a post_install hook to remove the unsupported -G compiler flag
 */
const withBoringSSLFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn('⚠️  Podfile not found, skipping BoringSSL-GRPC fix');
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      // Check if our fix is already applied
      if (podfileContent.includes('# Fix BoringSSL-GRPC for Xcode 16')) {
        console.log('✓ BoringSSL-GRPC fix already applied');
        return config;
      }

      // Find the last post_install block or add one
      const postInstallFix = `
  # Fix BoringSSL-GRPC for Xcode 16 - Remove unsupported -G flag
  post_install do |installer|
    installer.pods_project.targets.each do |target|
      if target.name.include?('BoringSSL-GRPC')
        puts "🔧 Fixing BoringSSL-GRPC for Xcode 16: \#{target.name}"

        # Remove -G flag from all build phases
        target.build_phases.each do |phase|
          if phase.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
            phase.files.each do |file|
              if file.settings && file.settings['COMPILER_FLAGS']
                original_flags = file.settings['COMPILER_FLAGS']
                file.settings['COMPILER_FLAGS'] = original_flags.gsub(/-G\\s*/, '')
              end
            end
          end
        end

        # Remove -G from build settings
        target.build_configurations.each do |config|
          config.build_settings.each do |key, value|
            if key.include?('FLAGS') && value.is_a?(String)
              config.build_settings[key] = value.gsub(/-G\\s*/, '')
            elsif key.include?('FLAGS') && value.is_a?(Array)
              config.build_settings[key] = value.reject { |flag| flag == '-G' }
            end
          end
        end

        puts "✓ Fixed BoringSSL-GRPC compilation flags"
      end
    end

    # Safety: Remove -G from all targets
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        if config.build_settings['OTHER_CFLAGS'].is_a?(String)
          config.build_settings['OTHER_CFLAGS'] = config.build_settings['OTHER_CFLAGS'].gsub(/-G\\s*/, '')
        elsif config.build_settings['OTHER_CFLAGS'].is_a?(Array)
          config.build_settings['OTHER_CFLAGS'] = config.build_settings['OTHER_CFLAGS'].reject { |flag| flag == '-G' }
        end
      end
    end
  end
`;

      // Insert before the final 'end' of the file
      const lines = podfileContent.split('\n');
      const lastEndIndex = lines.lastIndexOf('end');

      if (lastEndIndex > -1) {
        lines.splice(lastEndIndex, 0, postInstallFix);
        podfileContent = lines.join('\n');
      } else {
        // Just append if we can't find the end
        podfileContent += '\n' + postInstallFix + '\nend\n';
      }

      fs.writeFileSync(podfilePath, podfileContent);
      console.log('✅ Applied BoringSSL-GRPC Xcode 16 fix to Podfile');

      return config;
    },
  ]);
};

module.exports = withBoringSSLFix;
