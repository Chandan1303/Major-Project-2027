import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { chatApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  'Why is my predicted yield low?',
  'What should I monitor right now?',
  'When should I irrigate?',
  'Best variety for black cotton soil?',
  'How is yield loss calculated?',
  'What does confidence mean?',
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
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: `Hello ${user?.name?.split(' ')[0] || 'Farmer'}! 👋 I'm your SugarYield AI agricultural assistant.\n\nI have access to your farm data and prediction history. Ask me anything about:\n• **Why your yield might be low**\n• **Irrigation recommendations**\n• **Best varieties for your conditions**\n• **Soil and weather guidance**\n\nHow can I help you today?`,
    time: new Date()
  }]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (msg) => {
    const text = msg || input.trim();
    if (!text) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text, time: new Date() }]);
    setLoading(true);
    try {
      const r = await chatApi.send(text);
      setMessages(m => [...m, { role: 'assistant', text: r.data?.assistant_reply || 'I could not process that. Please try again.', time: new Date() }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', text: `Sorry, I encountered an error: ${e.message}. Please try again.`, time: new Date() }]);
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 120px)' }}>
        <div className="page-header">
          <div>
            <p className="eyebrow">AI Assistant</p>
            <h1 className="page-title">Agricultural Chat Assistant</h1>
            <p className="page-subtitle">Ask questions about your farm, predictions, soil, weather, and varieties.</p>
          </div>
          <span className="badge badge-green">🤖 AI Powered</span>
        </div>

        <div className="chat-container">
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
                {m.role === 'assistant' && <div className="chat-avatar ai-avatar">🤖</div>}
                <div className="chat-bubble">
                  <div className="chat-text">{formatMessage(m.text)}</div>
                  <span className="chat-time">{m.time?.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</span>
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

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about your farm, yield, soil, weather, varieties…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />
            <button className="chat-send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
              {loading ? '⏳' : '→'}
            </button>
          </div>
          <p className="chat-disclaimer">AI responses are based on your farm data and the ML model. Not a substitute for professional agronomic advice.</p>
        </div>
      </div>
    </AppLayout>
  );
}
