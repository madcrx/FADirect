import { firestore, COLLECTIONS, getTimestamp } from '@services/firebase/config';
import { Arrangement, FuneralType, WorkflowStep } from '@types/index';
import { WORKFLOW_TEMPLATES } from '@utils/constants';

/**
 * Arrangement Service
 * Handles funeral arrangement creation and management
 */

export class ArrangementService {
  /**
   * Create a new arrangement
   */
  static async createArrangement(data: {
    arrangerId: string;
    mournerId: string;
    deceasedName: string;
    funeralType: FuneralType;
  }): Promise<Arrangement> {
    try {
      // Get workflow template for this funeral type
      const workflowTemplate = WORKFLOW_TEMPLATES[data.funeralType] || WORKFLOW_TEMPLATES.traditional;

      const workflowSteps: WorkflowStep[] = workflowTemplate.map((step, index) => ({
        id: `step-${index}`,
        title: step.title,
        description: step.description,
        order: step.order,
        status: index === 0 ? 'in_progress' : 'pending',
        icon: step.icon,
      }));

      const arrangement: Omit<Arrangement, 'id'> = {
        arrangerId: data.arrangerId,
        mournerId: data.mournerId,
        deceasedName: data.deceasedName,
        funeralType: data.funeralType,
        status: 'initial_contact',
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowSteps,
        currentStepIndex: 0,
      };

      const docRef = await firestore()
        .collection(COLLECTIONS.ARRANGEMENTS)
        .add({
          ...arrangement,
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        });

      return {
        ...arrangement,
        id: docRef.id,
      };
    } catch (error: any) {
      console.error('Error creating arrangement:', error);
      throw new Error(error.message || 'Failed to create arrangement');
    }
  }

  /**
   * Get all arrangements for a user
   */
  static async getArrangements(userId: string, userRole: 'arranger' | 'mourner'): Promise<Arrangement[]> {
    try {
      const field = userRole === 'arranger' ? 'arrangerId' : 'mournerId';

      const snapshot = await firestore()
        .collection(COLLECTIONS.ARRANGEMENTS)
        .where(field, '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          scheduledDate: data.scheduledDate?.toDate(),
        } as Arrangement;
      });
    } catch (error: any) {
      console.error('Error getting arrangements:', error);
      throw new Error(error.message || 'Failed to get arrangements');
    }
  }

  /**
   * Get a single arrangement by ID
   */
  static async getArrangement(arrangementId: string): Promise<Arrangement | null> {
    try {
      const doc = await firestore()
        .collection(COLLECTIONS.ARRANGEMENTS)
        .doc(arrangementId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        scheduledDate: data.scheduledDate?.toDate(),
      } as Arrangement;
    } catch (error: any) {
      console.error('Error getting arrangement:', error);
      throw new Error(error.message || 'Failed to get arrangement');
    }
  }

  /**
   * Update an arrangement
   */
  static async updateArrangement(
    arrangementId: string,
    updates: Partial<Arrangement>,
  ): Promise<void> {
    try {
      await firestore()
        .collection(COLLECTIONS.ARRANGEMENTS)
        .doc(arrangementId)
        .update({
          ...updates,
          updatedAt: getTimestamp(),
        });
    } catch (error: any) {
      console.error('Error updating arrangement:', error);
      throw new Error(error.message || 'Failed to update arrangement');
    }
  }

  /**
   * Update workflow step status
   */
  static async updateWorkflowStep(
    arrangementId: string,
    stepId: string,
    status: WorkflowStep['status'],
  ): Promise<void> {
    try {
      const arrangement = await this.getArrangement(arrangementId);
      if (!arrangement) {
        throw new Error('Arrangement not found');
      }

      const updatedSteps = arrangement.workflowSteps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            status,
            completedAt: status === 'completed' ? new Date() : undefined,
          };
        }
        return step;
      });

      // Update current step index if needed
      const currentStepIndex = updatedSteps.findIndex(
        step => step.status === 'in_progress' || step.status === 'pending',
      );

      await firestore()
        .collection(COLLECTIONS.ARRANGEMENTS)
        .doc(arrangementId)
        .update({
          workflowSteps: updatedSteps,
          currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : updatedSteps.length - 1,
          updatedAt: getTimestamp(),
        });
    } catch (error: any) {
      console.error('Error updating workflow step:', error);
      throw new Error(error.message || 'Failed to update workflow step');
    }
  }

  /**
   * Listen to arrangement changes
   */
  static onArrangementChanged(
    arrangementId: string,
    callback: (arrangement: Arrangement | null) => void,
  ) {
    return firestore()
      .collection(COLLECTIONS.ARRANGEMENTS)
      .doc(arrangementId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            const data = doc.data()!;
            callback({
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              scheduledDate: data.scheduledDate?.toDate(),
            } as Arrangement);
          } else {
            callback(null);
          }
        },
        error => {
          console.error('Error listening to arrangement:', error);
        },
      );
  }
}
