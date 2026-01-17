import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';
import functions from '@react-native-firebase/functions';

/**
 * Firebase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Add iOS and Android apps to your Firebase project
 * 3. Download google-services.json (Android) and GoogleService-Info.plist (iOS)
 * 4. Place them in android/app and ios/ directories respectively
 * 5. Enable Authentication > Phone in Firebase Console
 * 6. Enable Firestore Database
 * 7. Enable Storage
 * 8. Enable Cloud Messaging
 * 9. Set up Firestore Security Rules (see firestore.rules file)
 * 10. Set up Storage Security Rules (see storage.rules file)
 */

// Firestore collections
export const COLLECTIONS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  ARRANGEMENTS: 'arrangements',
  MESSAGES: 'messages',
  DOCUMENTS: 'documents',
  PHOTOS: 'photos',
  FORM_TEMPLATES: 'formTemplates',
  FORM_SUBMISSIONS: 'formSubmissions',
  NOTIFICATIONS: 'notifications',
  ENCRYPTION_KEYS: 'encryptionKeys', // Encrypted storage for Signal Protocol keys
} as const;

// Storage paths
export const STORAGE_PATHS = {
  PROFILE_PHOTOS: 'profile-photos',
  DOCUMENTS: 'documents',
  PHOTOS: 'photos',
  THUMBNAILS: 'thumbnails',
  ENCRYPTED_FILES: 'encrypted-files',
} as const;

// Cloud Functions
export const CLOUD_FUNCTIONS = {
  CREATE_ARRANGEMENT: 'createArrangement',
  SEND_ENCRYPTED_MESSAGE: 'sendEncryptedMessage',
  UPLOAD_ENCRYPTED_FILE: 'uploadEncryptedFile',
  SEND_NOTIFICATION: 'sendNotification',
  GENERATE_FORM_PDF: 'generateFormPdf',
} as const;

export const initializeFirebase = () => {
  try {
    // Configure Firestore settings
    firestore().settings({
      persistence: true,
      cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
    });

    // Enable offline persistence
    firestore()
      .enablePersistence()
      .catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed: multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence not available');
        } else {
          console.warn('Firestore persistence error:', err.message);
        }
      });

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    console.warn('App will run with limited functionality. Please check Firebase configuration.');
  }
};

// Helper to get Firestore timestamp
export const getTimestamp = () => firestore.FieldValue.serverTimestamp();

// Helper to get current user
export const getCurrentUser = () => auth().currentUser;

// Export Firebase services
export { auth, firestore, storage, messaging, functions };
