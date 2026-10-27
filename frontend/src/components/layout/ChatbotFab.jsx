import { useState, useRef, useEffect } from 'react';
import {
  Fab,
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
  Avatar,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  SmartToy,
  Close,
  Send,
  HelpOutline,
} from '@mui/icons-material';
import { chatbotAPI } from '../../services/api';

const WELCOME = {
  from: 'bot',
  text: "Hi! I'm your GST assistant. Ask me about invoices, GST returns, e-way bills, ITC or anything else in the app.",
  suggestions: [
    'How do I create an invoice?',
    'When is GSTR-1 due?',
    'What is an e-way bill?',
  ],
};

/**
 * Global floating "Help" assistant. Lightweight, dismissible, resilient to
 * backend errors (falls back to a friendly message).
 */
export default function ChatbotFab() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setMessages((prev) => [...prev, { from: 'user', text: message }]);
    setInput('');
    setLoading(true);
    try {
      const response = await chatbotAPI.query(message);
      const data = response.data || {};
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: data.answer || "I'm not sure about that one yet, but our support team can help.",
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: "Sorry, I couldn't reach the assistant right now. Please try again in a moment.",
          suggestions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <Tooltip title="Help & Assistant" placement="left">
          <Fab
            color="primary"
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            }}
          >
            <HelpOutline />
          </Fab>
        </Tooltip>
      )}

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 380 },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: 'white',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
            <SmartToy fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              GST Assistant
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Always here to help
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
          {messages.map((m, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '85%',
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 2.5,
                    bgcolor: m.from === 'user' ? 'primary.main' : 'background.paper',
                    color: m.from === 'user' ? 'white' : 'text.primary',
                    border: m.from === 'user' ? 'none' : '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </Typography>
                </Box>
              </Box>
              {m.suggestions && m.suggestions.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                  {m.suggestions.map((s, si) => (
                    <Chip
                      key={si}
                      label={s}
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => send(s)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <CircularProgress size={16} />
              <Typography variant="caption">Thinking...</Typography>
            </Box>
          )}
        </Box>

        {/* Input */}
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            <Send />
          </IconButton>
        </Box>
      </Drawer>
    </>
  );
}
