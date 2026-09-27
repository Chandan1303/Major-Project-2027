import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { chatApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';

const SUGGESTIONS = [
  'Why is my predicted yield low?',
  'What should I monitor?',
  'What is affecting my yield?',
  'What is my current field risk?',
  'Explain my prediction.',
  'When should I irrigate?',
  'Best variety for black cotton soil?'
];

function formatMessage(text) {
  return text.split('\n').map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const bulletLine = boldLine.startsWith('•') ? `<span style="display:block;padding-left:12px">${boldLine}</span>` : boldLine;
    return <span key={i} dangerouslySetInnerHTML={{ __html: bulletLine + (i < text.split('\n').length - 1 ? '<br/>' : '') }} />;
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const { selectedFarm, selectedField } = useField();

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: `Hello ${user?.name?.split(' ')[0] || 'User'}! 👋 I'm your SugarYield AI agricultural assistant.\n\nI have live access to your farm data, soil metrics, weather feeds, and ML predictions. Ask me anything about:\n• **Why your predicted yield is low**\n• **What you should monitor right now**\n• **What is affecting your crop yield**\n• **Your current field risk and alerts**\n• **Detailed explanation of your prediction**\n\nHow can I assist your crop management today?`,
    time: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          text: r.data?.assistant_reply || 'I could not process that. Please try again.',
          time: new Date()
        }
      ]);
    } catch (e) {
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          text: `Sorry, I encountered an error: ${e.message}. Please try again.`,
          time: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        <div className="page-header">
          <div>
            <p className="eyebrow">Agro-AI Assistant</p>
            <h1 className="page-title">Agricultural Chat Assistant</h1>
            <p className="page-subtitle">
              Interactive agronomic intelligence grounded in your live farm records, soil metrics, and predictions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {selectedField && (
              <span className="badge badge-green" style={{ fontSize: 12 }}>
                📍 Active Context: {selectedField.farm_name} › {selectedField.name} ({selectedField.sugarcane_variety})
              </span>
            )}
            <span className="badge badge-blue">🤖 Grounded AI</span>
          </div>
        </div>

        <div className="chat-container">
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
                {m.role === 'assistant' && <div className="chat-avatar ai-avatar">🤖</div>}
                <div className="chat-bubble">
                  <div className="chat-text">{formatMessage(m.text)}</div>
                  <span className="chat-time">{m.time?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {m.role === 'user' && <div className="chat-avatar user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>}
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-ai">
                <div className="chat-avatar ai-avatar">🤖</div>
                <div className="chat-bubble">
                  <div className="chat-typing"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Prompt Suggestions */}
          {messages.length <= 2 && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input Row */}
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about your yield forecast, what to monitor, soil moisture, risk factors…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send()}
            />
            <button className="chat-send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
              {loading ? '…' : 'Send ➤'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
