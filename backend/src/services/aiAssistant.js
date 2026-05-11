const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

// System context for the AI assistant
const SYSTEM_CONTEXT = `You are CarePortal Assistant, a helpful and empathetic assistant for a funeral home management system.

Your role is to:
1. Help users navigate the portal and mobile app
2. Guide them through workflows (arrangements, bookings, forms, invoicing)
3. Provide step-by-step instructions for tasks
4. Answer questions about features and functionality
5. Help create forms, reports, and documents when requested
6. Offer suggestions for next steps in workflows

IMPORTANT GUIDELINES:
- Be empathetic and professional - users work in funeral services
- Keep responses concise and actionable
- Provide step-by-step instructions when needed
- If you don't know something, say so and suggest contacting support
- Never make up information about specific arrangements or deceased individuals
- Focus on how-to guidance and navigation help
- When asked to create forms or reports, acknowledge the request and provide guidance

SYSTEM FEATURES YOU CAN HELP WITH:
- Arrangements: Create, view, edit, manage funeral arrangements
- Bookings/Jobs: Schedule services, assign staff, manage resources
- Forms: Pre-arrangement forms, incident reports, expense claims, maintenance requests
- Documents & Photos: Upload, manage, send to families
- Quotes & Invoices: Create quotes, convert to jobs, generate invoices
- Staff Management: Rostering, leave requests, training logs
- Vehicles & Equipment: Track, inspect, maintain
- Calendar: View schedules, manage events
- Audit History: Track changes and workflow progress

WORKFLOW GUIDANCE:
1. Arrangement → Quote → Accept → Job → Resources → Invoice → Payment → Complete
2. Pre-Arrangement Form → Send to Family → Complete → Auto-populate Arrangement
3. Maintenance Request → Assign → Complete → Log
4. Expense Claim → Submit → Approve → Reimburse
5. Incident Report → Document → Investigate → Corrective Action

Always consider the user's current context (which page they're on) when providing help.`;

// Function definitions for action execution
const AVAILABLE_FUNCTIONS = [
  {
    name: 'navigate_to_page',
    description: 'Navigate user to a specific page in the portal',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          description: 'The page to navigate to',
          enum: ['dashboard', 'arrangements', 'bookings', 'calendar', 'forms', 'documents', 'invoices', 'staff', 'vehicles', 'equipment', 'reports', 'settings']
        },
        id: {
          type: 'string',
          description: 'Optional ID for specific item (e.g., arrangement ID)'
        }
      },
      required: ['page']
    }
  },
  {
    name: 'create_form',
    description: 'Guide user to create a new form',
    parameters: {
      type: 'object',
      properties: {
        formType: {
          type: 'string',
          description: 'Type of form to create',
          enum: ['pre_arrangement', 'incident_report', 'expense_claim', 'maintenance_request', 'customer_feedback', 'first_call_report', 'vehicle_inspection', 'equipment_maintenance', 'staff_training', 'health_safety_checklist', 'embalming_report']
        }
      },
      required: ['formType']
    }
  },
  {
    name: 'search_knowledge',
    description: 'Search for specific help topics or documentation',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for help topics'
        }
      },
      required: ['query']
    }
  }
];

class AIAssistant {
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      systemInstruction: SYSTEM_CONTEXT,
    });

    this.conversations = new Map(); // Store conversation history by session ID
  }

  /**
   * Get or create conversation history for a session
   */
  getConversation(sessionId) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, []);
    }
    return this.conversations.get(sessionId);
  }

  /**
   * Add message to conversation history
   */
  addToHistory(sessionId, role, content) {
    const conversation = this.getConversation(sessionId);
    conversation.push({ role, content });

    // Keep only last 20 messages to manage memory
    if (conversation.length > 20) {
      this.conversations.set(sessionId, conversation.slice(-20));
    }
  }

  /**
   * Clear conversation history for a session
   */
  clearConversation(sessionId) {
    this.conversations.delete(sessionId);
  }

  /**
   * Build context from user's current page and state
   */
  buildContextPrompt(context) {
    let contextPrompt = '\n\nCURRENT USER CONTEXT:\n';

    if (context.page) {
      contextPrompt += `- Current page: ${context.page}\n`;
    }

    if (context.arrangementId) {
      contextPrompt += `- Viewing arrangement: ${context.arrangementId}\n`;
    }

    if (context.jobId) {
      contextPrompt += `- Viewing job: ${context.jobId}\n`;
    }

    if (context.userRole) {
      contextPrompt += `- User role: ${context.userRole}\n`;
    }

    if (context.workflowStep) {
      contextPrompt += `- Current workflow step: ${context.workflowStep}\n`;
    }

    if (context.recentAction) {
      contextPrompt += `- Recent action: ${context.recentAction}\n`;
    }

    return contextPrompt;
  }

  /**
   * Get AI response to user message
   */
  async chat(sessionId, userMessage, context = {}) {
    try {
      // Add user message to history
      this.addToHistory(sessionId, 'user', userMessage);

      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(context);
      const fullMessage = contextPrompt + '\n\nUser message: ' + userMessage;

      // Get conversation history
      const history = this.getConversation(sessionId);
      const chatHistory = history.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Start chat with history
      const chat = this.model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      // Send message
      const result = await chat.sendMessage(fullMessage);
      const response = result.response.text();

      // Add assistant response to history
      this.addToHistory(sessionId, 'assistant', response);

      // Check if response includes any action suggestions
      const actions = this.extractActions(response, userMessage);

      return {
        message: response,
        actions: actions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI Assistant error:', error);

      // Fallback response
      return {
        message: "I apologize, but I'm having trouble processing your request right now. Please try again, or contact support if the issue persists.",
        actions: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Extract suggested actions from response
   */
  extractActions(response, userMessage) {
    const actions = [];
    const lowerResponse = response.toLowerCase();
    const lowerMessage = userMessage.toLowerCase();

    // Navigation actions
    const navigationMap = {
      'arrangements': ['arrangement', 'funeral', 'deceased'],
      'bookings': ['booking', 'job', 'schedule'],
      'calendar': ['calendar', 'schedule', 'appointment'],
      'forms': ['form', 'template', 'questionnaire'],
      'documents': ['document', 'file', 'photo'],
      'invoices': ['invoice', 'bill', 'payment', 'quote'],
      'staff': ['staff', 'employee', 'roster'],
      'vehicles': ['vehicle', 'hearse', 'limousine', 'car'],
      'equipment': ['equipment', 'maintenance'],
      'reports': ['report', 'analytics', 'statistics']
    };

    for (const [page, keywords] of Object.entries(navigationMap)) {
      if (keywords.some(kw => lowerMessage.includes(kw) || lowerResponse.includes(kw))) {
        actions.push({
          type: 'navigate',
          page: page,
          label: `Go to ${page.charAt(0).toUpperCase() + page.slice(1)}`
        });
        break; // Only suggest one navigation action
      }
    }

    // Form creation actions
    const formMap = {
      'incident_report': ['incident', 'accident', 'injury'],
      'expense_claim': ['expense', 'claim', 'reimbursement'],
      'maintenance_request': ['maintenance', 'repair', 'fix'],
      'customer_feedback': ['feedback', 'survey', 'satisfaction'],
      'pre_arrangement': ['pre-arrangement', 'pre arrangement', 'planning']
    };

    for (const [formType, keywords] of Object.entries(formMap)) {
      if (keywords.some(kw => lowerMessage.includes(kw))) {
        actions.push({
          type: 'create_form',
          formType: formType,
          label: `Create ${formType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
        });
      }
    }

    return actions;
  }

  /**
   * Get quick help suggestions based on context
   */
  getQuickHelp(context) {
    const suggestions = {
      dashboard: [
        'How do I create a new arrangement?',
        'Show me today\'s schedule',
        'How do I view pending invoices?'
      ],
      arrangements: [
        'How do I add a new arrangement?',
        'How do I send a pre-arrangement form?',
        'What are the next steps after creating an arrangement?'
      ],
      bookings: [
        'How do I schedule a service?',
        'How do I assign staff to a job?',
        'How do I mark a job as completed?'
      ],
      forms: [
        'What forms are available?',
        'How do I create a new form template?',
        'How do I send a form to a family?'
      ],
      default: [
        'How do I navigate the portal?',
        'What can you help me with?',
        'Show me common workflows'
      ]
    };

    return suggestions[context.page] || suggestions.default;
  }

  /**
   * Get workflow suggestions based on current state
   */
  getWorkflowSuggestions(workflowState) {
    const suggestions = {
      'arrangement_created': [
        'Create a quote for this arrangement',
        'Send pre-arrangement form to family',
        'Upload documents for this arrangement'
      ],
      'quote_sent': [
        'Follow up with family',
        'Check quote status',
        'Create alternative quote options'
      ],
      'quote_accepted': [
        'Convert quote to job',
        'Schedule the service',
        'Assign staff and resources'
      ],
      'job_scheduled': [
        'Assign vehicles and equipment',
        'Confirm staff availability',
        'Send service details to family'
      ],
      'job_completed': [
        'Create invoice',
        'Generate service report',
        'Request family feedback'
      ],
      'invoice_sent': [
        'Track payment status',
        'Send payment reminder',
        'Record payment received'
      ]
    };

    return suggestions[workflowState] || [];
  }
}

// Singleton instance
const aiAssistant = new AIAssistant();

module.exports = aiAssistant;
