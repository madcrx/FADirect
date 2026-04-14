const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Add network security config to AndroidManifest.xml
 * This allows HTTP cleartext traffic to specified domains
 */
const withAndroidNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add networkSecurityConfig attribute to application tag
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return config;
  });
};

module.exports = withAndroidNetworkSecurityConfig;
