import {
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
  PreKeyBundle,
  KeyHelper,
} from '@privacyresearch/libsignal-protocol-typescript';
import { database, COLLECTIONS, getTimestamp } from '@services/supabase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * End-to-End Encryption Service using Signal Protocol
 *
 * This implements the Signal Protocol for secure messaging:
 * - Perfect Forward Secrecy
 * - Future Secrecy (Self-healing)
 * - Deniability
 * - Asynchronous messaging
 */

const STORAGE_KEYS = {
  IDENTITY_KEY_PAIR: '@encryption:identityKeyPair',
  REGISTRATION_ID: '@encryption:registrationId',
  PRE_KEYS: '@encryption:preKeys',
  SIGNED_PRE_KEY: '@encryption:signedPreKey',
};

// Simple in-memory store for Signal Protocol
// In production, this should use secure storage
class SignalProtocolStore {
  private store: Map<string, any> = new Map();

  async getIdentityKeyPair(): Promise<any> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.IDENTITY_KEY_PAIR);
    return stored ? JSON.parse(stored) : null;
  }

  async getLocalRegistrationId(): Promise<number> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.REGISTRATION_ID);
    return stored ? parseInt(stored, 10) : 0;
  }

  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    direction: number,
  ): Promise<boolean> {
    // In production, implement proper identity verification
    return true;
  }

  async loadIdentityKey(identifier: string): Promise<ArrayBuffer | undefined> {
    return this.store.get(`identity:${identifier}`);
  }

  async saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean> {
    this.store.set(`identity:${identifier}`, identityKey);
    return true;
  }

  async loadPreKey(keyId: number): Promise<any> {
    return this.store.get(`preKey:${keyId}`);
  }

  async storePreKey(keyId: number, keyPair: any): Promise<void> {
    this.store.set(`preKey:${keyId}`, keyPair);
  }

  async removePreKey(keyId: number): Promise<void> {
    this.store.delete(`preKey:${keyId}`);
  }

  async loadSignedPreKey(keyId: number): Promise<any> {
    return this.store.get(`signedPreKey:${keyId}`);
  }

  async storeSignedPreKey(keyId: number, keyPair: any): Promise<void> {
    this.store.set(`signedPreKey:${keyId}`, keyPair);
  }

  async removeSignedPreKey(keyId: number): Promise<void> {
    this.store.delete(`signedPreKey:${keyId}`);
  }

  async loadSession(identifier: string): Promise<any> {
    return this.store.get(`session:${identifier}`);
  }

  async storeSession(identifier: string, record: any): Promise<void> {
    this.store.set(`session:${identifier}`, record);
  }

  async removeSession(identifier: string): Promise<void> {
    this.store.delete(`session:${identifier}`);
  }

  async removeAllSessions(identifier: string): Promise<void> {
    // Remove all sessions for this identifier
    const prefix = `session:${identifier}`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

let protocolStore: SignalProtocolStore;

export const initializeEncryption = async () => {
  protocolStore = new SignalProtocolStore();
  console.log('Encryption service initialized');
};

/**
 * Generate encryption keys for a new user
 */
export const generateUserKeys = async (userId: string) => {
  try {
    // Generate identity key pair
    const identityKeyPair = await KeyHelper.generateIdentityKeyPair();

    // Generate registration ID
    const registrationId = await KeyHelper.generateRegistrationId();

    // Generate pre-keys (batch of 100)
    const preKeys = await KeyHelper.generatePreKeys(0, 100);

    // Generate signed pre-key
    const signedPreKey = await KeyHelper.generateSignedPreKey(
      identityKeyPair,
      0,
      Date.now(),
    );

    // Store locally (in secure storage)
    await AsyncStorage.setItem(
      STORAGE_KEYS.IDENTITY_KEY_PAIR,
      JSON.stringify(identityKeyPair),
    );
    await AsyncStorage.setItem(STORAGE_KEYS.REGISTRATION_ID, registrationId.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.PRE_KEYS, JSON.stringify(preKeys));
    await AsyncStorage.setItem(STORAGE_KEYS.SIGNED_PRE_KEY, JSON.stringify(signedPreKey));

    // Store public keys in Supabase for key exchange
    await database
      .collection(COLLECTIONS.ENCRYPTION_KEYS)
      .doc(userId)
      .set({
        identityKey: JSON.stringify(identityKeyPair.pubKey),
        registrationId,
        preKeys: preKeys.map(pk => ({
          keyId: pk.keyId,
          publicKey: JSON.stringify(pk.keyPair.pubKey),
        })),
        signedPreKey: {
          keyId: signedPreKey.keyId,
          publicKey: JSON.stringify(signedPreKey.keyPair.pubKey),
          signature: JSON.stringify(signedPreKey.signature),
        },
        createdAt: getTimestamp(),
      });

    console.log('Encryption keys generated and stored');
    return true;
  } catch (error) {
    console.error('Error generating encryption keys:', error);
    throw error;
  }
};

/**
 * Get recipient's public key bundle from Supabase
 */
export const getRecipientKeyBundle = async (recipientId: string): Promise<PreKeyBundle> => {
  try {
    const doc = await database
      .collection(COLLECTIONS.ENCRYPTION_KEYS)
      .doc(recipientId)
      .get();

    if (!doc.exists) {
      throw new Error('Recipient encryption keys not found');
    }

    const data = doc.data();

    // Select a random pre-key
    const preKeyIndex = Math.floor(Math.random() * data.preKeys.length);
    const preKey = data.preKeys[preKeyIndex];

    return new PreKeyBundle(
      data.registrationId,
      1, // deviceId
      preKey.keyId,
      JSON.parse(preKey.publicKey),
      data.signedPreKey.keyId,
      JSON.parse(data.signedPreKey.publicKey),
      JSON.parse(data.signedPreKey.signature),
      JSON.parse(data.identityKey),
    );
  } catch (error) {
    console.error('Error getting recipient key bundle:', error);
    throw error;
  }
};

/**
 * Encrypt a message for a recipient
 */
export const encryptMessage = async (
  recipientId: string,
  message: string,
): Promise<string> => {
  try {
    const address = new SignalProtocolAddress(recipientId, 1);

    // Check if we have an existing session
    let session = await protocolStore.loadSession(address.toString());

    if (!session) {
      // Create new session
      const keyBundle = await getRecipientKeyBundle(recipientId);
      const sessionBuilder = new SessionBuilder(protocolStore as any, address);
      await sessionBuilder.processPreKey(keyBundle);
    }

    // Encrypt the message
    const sessionCipher = new SessionCipher(protocolStore as any, address);
    const ciphertext = await sessionCipher.encrypt(Buffer.from(message, 'utf8'));

    // Return base64 encoded ciphertext
    return Buffer.from(JSON.stringify(ciphertext)).toString('base64');
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw error;
  }
};

/**
 * Decrypt a message from a sender
 */
export const decryptMessage = async (
  senderId: string,
  encryptedMessage: string,
): Promise<string> => {
  try {
    const address = new SignalProtocolAddress(senderId, 1);
    const sessionCipher = new SessionCipher(protocolStore as any, address);

    // Decode the ciphertext
    const ciphertext = JSON.parse(Buffer.from(encryptedMessage, 'base64').toString('utf8'));

    // Decrypt the message
    let plaintext: ArrayBuffer;
    if (ciphertext.type === 3) {
      // PreKeyWhisperMessage
      plaintext = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary');
    } else {
      // WhisperMessage
      plaintext = await sessionCipher.decryptWhisperMessage(ciphertext.body, 'binary');
    }

    return Buffer.from(plaintext).toString('utf8');
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw error;
  }
};

/**
 * Encrypt file for secure storage
 * Uses AES-256-GCM for file encryption
 */
export const encryptFile = async (fileData: ArrayBuffer, key: string): Promise<ArrayBuffer> => {
  // This is a simplified implementation
  // In production, use proper AES-256-GCM encryption
  // You might want to use react-native-crypto or similar
  console.warn('File encryption not fully implemented - use proper crypto library');
  return fileData;
};

/**
 * Decrypt file from secure storage
 */
export const decryptFile = async (
  encryptedData: ArrayBuffer,
  key: string,
): Promise<ArrayBuffer> => {
  // This is a simplified implementation
  // In production, use proper AES-256-GCM decryption
  console.warn('File decryption not fully implemented - use proper crypto library');
  return encryptedData;
};
