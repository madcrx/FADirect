const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Add network security config to AndroidManifest.xml and create the XML file
 * This allows HTTP cleartext traffic to specified domains for development
 */
const withAndroidNetworkSecurityConfig = (config) => {
  // Step 1: Add the reference to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add networkSecurityConfig attribute to application tag
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return config;
  });

  // Step 2: Create the actual network_security_config.xml file during build
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      // Path where the XML file should be created
      const resXmlDir = path.join(platformProjectRoot, 'app/src/main/res/xml');
      const xmlFilePath = path.join(resXmlDir, 'network_security_config.xml');

      // Ensure the xml directory exists
      if (!fs.existsSync(resXmlDir)) {
        fs.mkdirSync(resXmlDir, { recursive: true });
      }

      // Create the network security config XML content
      const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow cleartext HTTP traffic for development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.101.128</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>`;

      // Write the file
      fs.writeFileSync(xmlFilePath, networkSecurityConfig, 'utf-8');
      console.log('✅ Created network_security_config.xml at:', xmlFilePath);

      return config;
    },
  ]);

  return config;
};

module.exports = withAndroidNetworkSecurityConfig;
