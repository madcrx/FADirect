// ARRANGEMENT SERVICE DISABLED - Using custom REST API backend instead
// This file is stubbed to prevent Supabase imports from being bundled

console.log('⚠️ ArrangementService disabled - use arrangementsApi from @services/api');

import { Arrangement, FuneralType, WorkflowStep } from '@types/index';

/**
 * Stubbed Arrangement Service - DO NOT USE
 * Use arrangementsApi from src/services/api/arrangements.ts instead
 */

export class ArrangementService {
  static async createArrangement(_data: any): Promise<Arrangement> {
    throw new Error('ArrangementService disabled - use arrangementsApi.createArrangement()');
  }

  static async getArrangements(): Promise<Arrangement[]> {
    return [];
  }

  static async getArrangement(_id: string): Promise<Arrangement | null> {
    return null;
  }

  static async updateArrangement(_id: string, _updates: any): Promise<void> {
    throw new Error('ArrangementService disabled - use arrangementsApi.updateArrangement()');
  }

  static async deleteArrangement(_id: string): Promise<void> {
    throw new Error('ArrangementService disabled - use arrangementsApi');
  }

  static async getUserArrangements(_userId: string): Promise<Arrangement[]> {
    return [];
  }

  static getWorkflowTemplate(_funeralType: FuneralType): WorkflowStep[] {
    return [];
  }

  static async updateWorkflowStep(_arrangementId: string, _stepId: string, _updates: any): Promise<void> {
    throw new Error('ArrangementService disabled - use custom API');
  }

  static listenToArrangementChanges(_arrangementId: string, _callback: (arrangement: Arrangement) => void): () => void {
    return () => {}; // No-op unsubscribe
  }

  static listenToUserArrangements(_userId: string, _callback: (arrangements: Arrangement[]) => void): () => void {
    return () => {}; // No-op unsubscribe
  }
}
