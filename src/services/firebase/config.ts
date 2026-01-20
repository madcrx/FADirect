/**
 * Firebase Compatibility Layer (Stub)
 *
 * This file provides stub implementations of Firebase services to allow
 * the codebase to compile after migrating to Supabase.
 *
 * TODO: Migrate all services to use Supabase directly instead of this compatibility layer
 */

// Type definitions for Firebase-compatible authentication types
export type FirebaseUser = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
};

export type FirebaseConfirmationResult = {
  confirm: (code: string) => Promise<FirebaseUserCredential>;
};

export type FirebaseUserCredential = {
  user: FirebaseUser;
};

// Namespace export for backwards compatibility with existing code
export namespace FirebaseAuthTypes {
  export type User = FirebaseUser;
  export type ConfirmationResult = FirebaseConfirmationResult;
  export type UserCredential = FirebaseUserCredential;
}

// Collections - these will need to be created as Supabase tables
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
  ENCRYPTION_KEYS: 'encryptionKeys',
} as const;

// Storage paths - these will map to Supabase Storage buckets
export const STORAGE_PATHS = {
  PROFILE_PHOTOS: 'profile-photos',
  DOCUMENTS: 'documents',
  PHOTOS: 'photos',
  THUMBNAILS: 'thumbnails',
  ENCRYPTED_FILES: 'encrypted-files',
} as const;

// Cloud Functions - these will need to be implemented as Supabase Edge Functions
export const CLOUD_FUNCTIONS = {
  CREATE_ARRANGEMENT: 'createArrangement',
  SEND_ENCRYPTED_MESSAGE: 'sendEncryptedMessage',
  UPLOAD_ENCRYPTED_FILE: 'uploadEncryptedFile',
  SEND_NOTIFICATION: 'sendNotification',
  GENERATE_FORM_PDF: 'generateFormPdf',
} as const;

// Stub implementations to prevent import errors
// These provide minimal mock objects to allow compilation
// TODO: Replace with actual Supabase implementations

export const auth = () => ({
  currentUser: null,
  signInWithPhoneNumber: async () => {
    throw new Error('Firebase Auth not available - migrate to Supabase Auth');
  },
  signOut: async () => {
    throw new Error('Firebase Auth not available - migrate to Supabase Auth');
  },
  onAuthStateChanged: () => {
    throw new Error('Firebase Auth not available - migrate to Supabase Auth');
  },
});

export const firestore = () => ({
  collection: () => ({
    doc: () => ({
      set: async () => {
        throw new Error('Firestore not available - migrate to Supabase Database');
      },
      get: async () => {
        throw new Error('Firestore not available - migrate to Supabase Database');
      },
      update: async () => {
        throw new Error('Firestore not available - migrate to Supabase Database');
      },
      onSnapshot: () => {
        throw new Error('Firestore not available - migrate to Supabase Database');
      },
    }),
    add: async () => {
      throw new Error('Firestore not available - migrate to Supabase Database');
    },
    where: () => ({
      orderBy: () => ({
        get: async () => {
          throw new Error('Firestore not available - migrate to Supabase Database');
        },
        onSnapshot: () => {
          throw new Error('Firestore not available - migrate to Supabase Database');
        },
      }),
    }),
  }),
  settings: () => {},
  enablePersistence: async () => {},
  CACHE_SIZE_UNLIMITED: -1,
  FieldValue: {
    serverTimestamp: () => new Date().toISOString(),
  },
});

export const storage = () => ({
  ref: () => {
    throw new Error('Firebase Storage not available - migrate to Supabase Storage');
  },
});

export const messaging = () => ({
  requestPermission: async () => {
    throw new Error('Firebase Messaging not available - migrate to Supabase Realtime');
  },
});

export const functions = () => ({
  httpsCallable: () => {
    throw new Error('Firebase Functions not available - migrate to Supabase Edge Functions');
  },
});

export const getTimestamp = () => {
  console.warn('getTimestamp() called - this should be migrated to use new Date().toISOString()');
  return new Date().toISOString();
};

export const getCurrentUser = () => {
  console.warn('getCurrentUser() called - migrate to use Supabase auth.getUser()');
  return null;
};

export const initializeFirebase = () => {
  console.warn('Firebase compatibility layer loaded - services not fully functional');
  console.warn('Please migrate to Supabase: https://supabase.com/docs/guides/auth');
};
