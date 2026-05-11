import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Fab,
  Drawer,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: Action[];
}

interface Action {
  type: string;
  page?: string;
  formType?: string;
  label: string;
}

interface AIAssistantProps {
  context?: {
    arrangementId?: string;
    jobId?: string;
    workflowStep?: string;
    recentAction?: string;
  };
}

export default function AIAssistant({ context }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickHelp, setQuickHelp] = useState<string[]>([]);
  const [showQuickHelp, setShowQuickHelp] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Get current page from location
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/arrangements')) return 'arrangements';
    if (path.includes('/bookings')) return 'bookings';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/forms')) return 'forms';
    if (path.includes('/documents')) return 'documents';
    if (path.includes('/invoices')) return 'invoices';
    if (path.includes('/staff')) return 'staff';
    if (path.includes('/vehicles')) return 'vehicles';
    if (path.includes('/equipment')) return 'equipment';
    if (path.includes('/reports')) return 'reports';
    if (path === '/') return 'dashboard';
    return 'default';
  };

  // Load quick help suggestions when page changes
  useEffect(() => {
    loadQuickHelp();
  }, [location.pathname]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadQuickHelp = async () => {
    try {
      const page = getCurrentPage();
      const response = await api.get(`/ai-assistant/quick-help?page=${page}`);
      setQuickHelp(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to load quick help:', error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;

    setInput('');
    setShowQuickHelp(false);

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Build context
      const chatContext = {
        page: getCurrentPage(),
        ...context,
      };

      // Send to API
      const response = await api.post('/ai-assistant/chat', {
        message: text,
        context: chatContext,
      });

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.message,
        timestamp: response.data.timestamp,
        actions: response.data.actions || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: Action) => {
    if (action.type === 'navigate' && action.page) {
      navigate(`/${action.page}`);
      setOpen(false);
    } else if (action.type === 'create_form' && action.formType) {
      navigate('/forms');
      setOpen(false);
    }
  };

  const handleClearConversation = async () => {
    try {
      await api.delete('/ai-assistant/conversation/me');
      setMessages([]);
      setShowQuickHelp(true);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  };

  const handleQuickHelp = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="AI Assistant"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <BotIcon />
      </Fab>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            maxWidth: '100vw',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                <BotIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  FADirect AI Assistant
                </Typography>
                <Typography variant="caption">Always here to help</Typography>
              </Box>
            </Box>
            <Box>
              {messages.length > 0 && (
                <IconButton size="small" onClick={handleClearConversation} sx={{ color: 'white', mr: 1 }}>
                  <DeleteIcon />
                </IconButton>
              )}
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {messages.length === 0 && showQuickHelp && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  👋 Hello! I'm your AI assistant. I can help you with:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="• Navigate the portal"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="• Guide you through workflows"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="• Create forms and reports"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="• Answer questions about features"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>

                {quickHelp.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SuggestionIcon fontSize="small" /> Quick Help
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {quickHelp.map((suggestion, index) => (
                        <Chip
                          key={index}
                          label={suggestion}
                          onClick={() => handleQuickHelp(suggestion)}
                          clickable
                          size="small"
                          sx={{ justifyContent: 'flex-start' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                  {message.actions && message.actions.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {message.actions.map((action, idx) => (
                        <Chip
                          key={idx}
                          label={action.label}
                          size="small"
                          onClick={() => handleAction(action)}
                          clickable
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            ))}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper elevation={1} sx={{ p: 1.5, bgcolor: 'grey.100' }}>
                  <CircularProgress size={20} />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    Thinking...
                  </Typography>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* Input */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={loading}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || loading}
              >
                <SendIcon />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Press Enter to send, Shift+Enter for new line
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
