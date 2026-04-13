// SUPABASE DATABASE DISABLED - Using custom REST API backend instead
// This file is stubbed to prevent Supabase from being loaded by the bundler

console.log('⚠️ Supabase database service disabled - use custom API');

/**
 * Stubbed Supabase Database Service - DO NOT USE
 * Use the custom API services in src/services/api/ instead
 */

// Collections (database tables)
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

// Storage buckets
export const STORAGE_BUCKETS = {
  PROFILE_PHOTOS: 'profile-photos',
  DOCUMENTS: 'documents',
  PHOTOS: 'photos',
  THUMBNAILS: 'thumbnails',
  ENCRYPTED_FILES: 'encrypted-files',
} as const;

/**
 * Get current timestamp
 */
export const getTimestamp = () => new Date().toISOString();

/**
 * Document reference operations
 */
export class DocumentRef {
  constructor(
    private table: string,
    private id?: string
  ) {}

  async set(_data: any): Promise<void> {
    throw new Error('Supabase disabled - use custom API');
  }

  async get(): Promise<{ exists: boolean; id: string; data: () => any }> {
    return { exists: false, id: this.id || '', data: () => null };
  }

  async update(_updates: any): Promise<void> {
    throw new Error('Supabase disabled - use custom API');
  }

  onSnapshot(_callback: (doc: any) => void): () => void {
    return () => {}; // No-op unsubscribe
  }
}

/**
 * Query builder for collections
 */
export class QueryBuilder {
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  where(_field: string, _operator: string, _value: any): this {
    return this;
  }

  orderBy(_field: string, _direction: 'asc' | 'desc' = 'asc'): this {
    return this;
  }

  async get(): Promise<{ docs: any[] }> {
    return { docs: [] };
  }

  onSnapshot(_callback: (snapshot: { docs: any[] }) => void): () => void {
    return () => {}; // No-op unsubscribe
  }
}

/**
 * Collection reference operations
 */
export class CollectionRef {
  constructor(private table: string) {}

  doc(id: string): DocumentRef {
    return new DocumentRef(this.table, id);
  }

  async add(_data: any): Promise<{ id: string }> {
    throw new Error('Supabase disabled - use custom API');
  }

  where(field: string, operator: string, value: any): QueryBuilder {
    const query = new QueryBuilder(this.table);
    return query.where(field, operator, value);
  }
}

/**
 * Main database interface
 */
export class SupabaseDatabase {
  collection(name: string): CollectionRef {
    return new CollectionRef(name);
  }
}

export const database = new SupabaseDatabase();
