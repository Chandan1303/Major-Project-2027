import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, User, Send, Sparkles, HelpCircle, MapPin, CornerDownLeft,
  MessageSquare, RefreshCw, CheckCircle2
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { chatApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';
import Badge from '../components/ui/Badge';

const SUGGESTIONS = [
  'Why is my predicted yield low?',
  'What should I monitor right now?',
  'What factors are affecting my crop yield?',
  'What is my current field risk status?',
  'Explain the AI prediction for my parcel.',
  'When should I schedule the next irrigation cycle?',
  'Which sugarcane variety is best suited for black soil?'
];

function formatMessage(text) {
  return text.split('\n').map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const bulletLine = boldLine.startsWith('•')
      ? `<span style="display:block;padding-left:14px;position:relative;margin:4px 0;"><span style="position:absolute;left:0;color:var(--primary)">•</span>${boldLine.slice(1).trim()}</span>`
      : boldLine;
    return <span key={i} dangerouslySetInnerHTML={{ __html: bulletLine + (i < text.split('\n').length - 1 ? '<br/>' : '') }} />;
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const { selectedFarm, selectedField } = useField();

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: `Hello ${user?.name?.split(' ')[0] || 'Grower'}! 👋 I'm your SugarYield AI agricultural copilot.\n\nI have active context of your farm holdings, real-time weather stations, edaphic sensor metrics, and ML predictions. Ask me about:\n• **Why your predicted yield changed**\n• **Immediate agronomic hazards to monitor**\n• **Soil moisture thresholds and irrigation directives**\n• **Explaining model feature attributions**\n\nHow can I help optimize your sugarcane parcel today?`,
    time: new Date()
  }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (msg) => {
    const text = msg || input.trim();
    if (!text) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text, time: new Date() }]);
    setLoading(true);
    try {
      const extraPayload = {
        field_id: selectedField?.id,
        farm_id: selectedFarm?.id
      };
      const r = await chatApi.send(text, extraPayload);
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          text: r.data?.assistant_reply || 'I could not process that request. Please try again.',
          time: new Date()
        }
      ]);
    } catch (e) {
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          text: `Sorry, I encountered an error: ${e.message}. Please verify connectivity and try again.`,
          time: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', maxHeight: 860 }}>
        
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <Bot size={13} /> Grounded Agronomic Intelligence Assistant
            </div>
            <h1 className="page-title" style={{ margin: '0 0 4px' }}>AI Agricultural Advisor</h1>
            <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Interactive agronomic assistance grounded in your live farm records, soil metrics, and dual-model predictions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedField && (
              <Badge variant="success">
                <MapPin size={12} style={{ marginRight: 4 }} />
                Context: {selectedField.name} ({selectedField.sugarcane_variety})
              </Badge>
            )}
            <Badge variant="primary">Dual-Model Grounded</Badge>
          </div>
        </div>

        {/* Chat Container Card */}
        <div
          className="card"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '75%' : '85%',
                    flexDirection: isUser ? 'row-reverse' : 'row'
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: isUser ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: isUser ? '#ffffff' : 'var(--primary)',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isUser ? <User size={16} /> : <Bot size={18} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background: isUser ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: isUser ? '#ffffff' : 'var(--text-primary)',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      lineHeight: 1.55,
                      fontSize: 14
                    }}
                  >
                    <div>{formatMessage(m.text)}</div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        marginTop: 6,
                        opacity: 0.7,
                        textAlign: isUser ? 'right' : 'left'
                      }}
                    >
                      {m.time?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, alignSelf: 'flex-start' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'var(--bg-secondary)',
                    color: 'var(--primary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bot size={18} />
                </div>
                <div style={{ padding: '12px 18px', borderRadius: '4px 16px 16px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={14} className="animate-spin" color="var(--primary)" />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Synthesizing agronomic advice…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Question Chips */}
          {messages.length <= 2 && (
            <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', gap: 8, overflowX: 'auto' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="input-field"
              placeholder="Ask about yield forecast, soil nutrition, irrigation timing, disease prevention…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send()}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 12 }}
            />
            <button
              className="btn-primary"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{ padding: '12px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
