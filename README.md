# FA Direct (Funeral Arranger Direct)

A secure, end-to-end encrypted communication platform for funeral arrangers and families, built with React Native, Firebase, and the Signal Protocol.

## 🌟 Features

### Core Functionality
- **Secure Communication**: End-to-end encrypted messaging using the Signal Protocol
- **Phone Number Authentication**: Simple, secure authentication via SMS verification
- **Workflow Management**: Step-by-step guidance through funeral arrangement process
- **Document Sharing**: Secure upload and sharing of death certificates, contracts, and other documents
- **Photo Gallery**: Upload and share photos related to the service
- **Form Management**: Dynamic forms for collecting necessary information
- **Real-time Updates**: Live synchronization of messages and workflow progress
- **Push Notifications**: Stay informed about important updates

### Security & Privacy
- **End-to-End Encryption (E2EE)**: Messages encrypted with Signal Protocol
- **Secure File Storage**: Documents and photos stored securely in Firebase Storage
- **Role-Based Access**: Funeral arrangers and mourners have appropriate permissions
- **Australian Privacy Compliance**: Built with Australian privacy standards in mind

### User Experience
- **Australian Localisation**: AU date formats, timezones, and phone numbers
- **Offline Support**: Access previous messages and data when offline
- **Professional Design**: Calm, respectful color scheme appropriate for funeral services
- **Visual Progress Tracking**: Clear visualization of arrangement progress

## 📱 Funeral Types Supported

Different workflow templates for various service types:
- **Traditional Funeral**: Full service with burial
- **Cremation**: Cremation with memorial service
- **Burial**: Direct burial service
- **Repatriation**: International transport of deceased
- **Memorial Service**: Service without burial/cremation
- **Direct Cremation**: Cremation without service

## 🚀 Getting Started

See [SETUP.md](SETUP.md) for detailed setup instructions.

### Quick Start

```bash
# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

### Firebase Setup Required

1. Create a Firebase project
2. Add iOS and Android apps
3. Download config files (GoogleService-Info.plist, google-services.json)
4. Enable Authentication (Phone), Firestore, and Storage
5. Deploy security rules

See [SETUP.md](SETUP.md) for complete instructions.

## 📋 Documentation

- [Quick Setup Guide](SETUP.md) - Get started in 30 minutes
- [Architecture](#-project-structure) - Understand the codebase
- [Security](#-security-architecture) - Learn about E2EE implementation
- [Customization](#-customization) - Adapt for your needs

## 🏗️ Project Structure

```
FADirect/
├── src/
│   ├── components/          # Reusable UI components
│   ├── navigation/          # App navigation
│   ├── screens/             # Screen components
│   │   ├── auth/            # Authentication
│   │   ├── arrangements/    # Arrangement management
│   │   ├── messages/        # Secure messaging
│   │   ├── documents/       # Document sharing
│   │   └── profile/         # User profile
│   ├── services/            # Business logic
│   │   ├── firebase/        # Firebase config
│   │   ├── encryption/      # Signal Protocol E2EE
│   │   ├── auth/            # Authentication
│   │   ├── arrangements/    # Arrangements
│   │   └── messaging/       # Messages
│   ├── store/               # Redux state
│   ├── types/               # TypeScript types
│   └── utils/               # Utilities & constants
├── firestore.rules          # Firestore security
├── storage.rules            # Storage security
└── firebase.json            # Firebase config
```

## 🔐 Security Architecture

### End-to-End Encryption

FA Direct uses the Signal Protocol for message encryption:

- **Perfect Forward Secrecy**: Compromised keys don't decrypt past messages
- **Future Secrecy**: Self-healing from key compromises
- **Deniability**: Cryptographic deniability of message authorship
- **Asynchronous**: Works even when recipient is offline

### Implementation

1. Each user generates identity keys and pre-keys on signup
2. Public keys stored in Firestore for key exchange
3. Messages encrypted on sender device
4. Messages decrypted on recipient device
5. Private keys never leave the device

## 🌏 Australian Localisation

- **Timezone**: Australia/Sydney (configurable)
- **Date Format**: DD/MM/YYYY
- **Phone Format**: +61 4XX XXX XXX
- **Compliance**: Privacy Act 1988 framework

## 🧪 Testing

```bash
# Run unit tests
npm test

# Start Firebase emulators
firebase emulators:start

# E2E tests (coming soon)
npm run e2e:ios
npm run e2e:android
```

## 📦 Building for Production

### iOS
```bash
npx react-native run-ios --configuration Release
```

### Android
```bash
cd android
./gradlew assembleRelease
```

See [SETUP.md](SETUP.md) for detailed build instructions.

## 🎨 Customization

### Theme

Update `src/utils/theme.ts` to customize colors:

```typescript
export const theme = {
  colors: {
    primary: '#1A3A52',    // Your brand color
    secondary: '#B8956A',   // Accent color
    // ...
  }
}
```

### Workflows

Add custom workflows in `src/utils/constants.ts`.

## 📄 License

Copyright © 2024 FA Direct. All rights reserved.

## 🤝 Support

For support:
- Create an issue in this repository
- Email: support@fadirect.com.au

## 🗺️ Roadmap

- [x] Core messaging with E2EE
- [x] Phone authentication
- [x] Workflow management
- [x] Document/photo sharing (basic)
- [ ] Advanced form builder
- [ ] Payment integration
- [ ] Video calling
- [ ] Multi-organization support
- [ ] Web portal

## 🙏 Acknowledgments

Built with:
- React Native
- Firebase
- Signal Protocol
- React Native Paper
- Redux Toolkit

---

**Built with ❤️ for the Australian funeral services community**