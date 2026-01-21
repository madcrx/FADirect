import { supabase } from '@config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Supabase Database Service
 * Provides database operations and real-time subscriptions
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

  async set(data: any): Promise<void> {
    if (!this.id) {
      throw new Error('Document ID required for set operation');
    }

    const { error } = await supabase
      .from(this.table)
      .upsert({ id: this.id, ...data });

    if (error) throw error;
  }

  async get(): Promise<{ exists: boolean; id: string; data: () => any }> {
    if (!this.id) {
      throw new Error('Document ID required for get operation');
    }

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', this.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    return {
      exists: !!data,
      id: this.id,
      data: () => data,
    };
  }

  async update(updates: any): Promise<void> {
    if (!this.id) {
      throw new Error('Document ID required for update operation');
    }

    const { error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', this.id);

    if (error) throw error;
  }

  onSnapshot(callback: (doc: any) => void): () => void {
    if (!this.id) {
      throw new Error('Document ID required for snapshot listener');
    }

    const channel = supabase
      .channel(`${this.table}:${this.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.table,
          filter: `id=eq.${this.id}`,
        },
        async () => {
          // Fetch updated document
          const result = await this.get();
          callback(result);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
    };
  }
}

/**
 * Query builder for collections
 */
export class QueryBuilder {
  private query: any;
  private table: string;

  constructor(table: string) {
    this.table = table;
    this.query = supabase.from(table).select('*');
  }

  where(field: string, operator: string, value: any): this {
    if (operator === '==') {
      this.query = this.query.eq(field, value);
    } else if (operator === '>') {
      this.query = this.query.gt(field, value);
    } else if (operator === '<') {
      this.query = this.query.lt(field, value);
    } else if (operator === '>=') {
      this.query = this.query.gte(field, value);
    } else if (operator === '<=') {
      this.query = this.query.lte(field, value);
    } else if (operator === '!=') {
      this.query = this.query.neq(field, value);
    }
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query = this.query.order(field, { ascending: direction === 'asc' });
    return this;
  }

  async get(): Promise<{ docs: any[] }> {
    const { data, error } = await this.query;
    if (error) throw error;

    return {
      docs: (data || []).map((item: any) => ({
        id: item.id,
        exists: true,
        data: () => item,
      })),
    };
  }

  onSnapshot(callback: (snapshot: { docs: any[] }) => void): () => void {
    // Subscribe to real-time changes
    const channel = supabase
      .channel(`${this.table}:query`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.table,
        },
        async () => {
          // Re-fetch query results
          const result = await this.get();
          callback(result);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
    };
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

  async add(data: any): Promise<{ id: string }> {
    const { data: result, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { id: result.id };
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
