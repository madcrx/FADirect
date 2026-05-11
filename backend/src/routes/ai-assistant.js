const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const aiAssistant = require('../services/aiAssistant');

// Chat with AI assistant
router.post('/chat', authenticateToken, async (req, res, next) => {
  try {
    const { message, context, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: { message: 'Message is required' } });
    }

    // Use user ID as session ID if not provided
    const chatSessionId = sessionId || req.user.id;

    // Add user info to context
    const enrichedContext = {
      ...context,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role
    };

    // Get AI response
    const response = await aiAssistant.chat(chatSessionId, message, enrichedContext);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get quick help suggestions
router.get('/quick-help', authenticateToken, async (req, res, next) => {
  try {
    const { page } = req.query;

    const suggestions = aiAssistant.getQuickHelp({ page });

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
});

// Get workflow suggestions
router.post('/workflow-suggestions', authenticateToken, async (req, res, next) => {
  try {
    const { workflowState } = req.body;

    if (!workflowState) {
      return res.status(400).json({ error: { message: 'Workflow state is required' } });
    }

    const suggestions = aiAssistant.getWorkflowSuggestions(workflowState);

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
});

// Clear conversation history
router.delete('/conversation/:sessionId', authenticateToken, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Only allow users to clear their own conversations or admin can clear any
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isAdmin = userRoles.includes('admin');

    if (sessionId !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: { message: 'Not authorized to clear this conversation' } });
    }

    aiAssistant.clearConversation(sessionId);

    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    next(error);
  }
});

// Health check endpoint
router.get('/health', authenticateToken, async (req, res) => {
  res.json({
    status: 'operational',
    model: 'gemini-1.5-flash',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
