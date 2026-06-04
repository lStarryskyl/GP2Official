/**
 * AIChatAssistant — floating per-phase chat panel
 *
 * Usage:
 *   <AIChatAssistant
 *     projectId="..."
 *     projectName="..."
 *     phase="planning"
 *     phaseName="Planning"
 *   />
 *
 * Shows a floating leaf button. Click → opens a chat drawer.
 * Athena (gemini-2.0-flash) answers questions about the current phase.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { Loader2, Send, X, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  projectId: string;
  projectName: string;
  phase: string;
  phaseName: string;
  phaseColor?: string;
}

// Per-phase accent colors
const PHASE_COLORS: Record<string, string> = {
  planning: '#D4A017',
  feasibility_study: '#7BA05B',
  requirements_gathering: 'var(--blue-500)',
  validation: '#5F7A8A',
  design: '#6B4C8A',
  development: '#8B5E3C',
  tasks: '#D4A017',
  cost_benefit: '#2A9D8F',
  risks: '#C1440E',
  testing: '#0EA5E9',
  summary: 'var(--blue-400)',
};

const QUICK_PROMPTS = [
  'Summarise this phase in 3 bullet points',
  'What are the biggest risks here?',
  'Suggest 3 improvements to this phase',
  'What should I do next after this phase?',
  'Explain this to a non-technical stakeholder',
];

export const AIChatAssistant: React.FC<Props> = ({
  projectId,
  projectName,
  phase,
  phaseName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm **Athena**, your AI assistant for the **${phaseName}** phase. Ask me anything about this phase, or use a quick prompt below.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accentColor = PHASE_COLORS[phase] || 'var(--blue-400)';

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Signal open state to other floating panels (e.g. AIDebatePanel) via body attribute
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-athena-chat-open', 'true');
    } else {
      document.body.removeAttribute('data-athena-chat-open');
    }
    return () => document.body.removeAttribute('data-athena-chat-open');
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isSending) return;

    const userMsg: Message = { role: 'user', content: msgText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await api.post('/ai-chat/chat', {
        project_id: projectId,
        project_name: projectName,
        phase,
        message: msgText,
        chat_history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.response || 'I could not generate a response. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // ── Floating trigger button ───────────────────────────────────────────
  if (!isMounted) return null;

  return createPortal(
    <>
      {/* Floating leaf button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm shadow-2xl transition-all duration-300 hover:scale-105"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            zIndex: 1200,
            background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
            color: 'var(--brand-900)',
            boxShadow: `0 8px 32px ${accentColor}44`,
          }}
          title="Ask Athena about this phase"
        >
          <Sparkles className="w-4 h-4" />
          Ask Athena
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            zIndex: 1200,
            width: 'min(380px, calc(100vw - 24px))',
            height: 'min(520px, calc(100vh - 48px))',
            background: 'var(--brand-850)',
            border: `1px solid ${accentColor}44`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${accentColor}18`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: `${accentColor}18`, borderBottom: `1px solid ${accentColor}33` }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: accentColor }}>
                <Sparkles className="w-4 h-4 text-[var(--brand-900)]" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)] text-sm">Athena</p>
                <p className="text-xs" style={{ color: accentColor }}>{phaseName} Phase</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-700)] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[88%] px-3 py-2.5 rounded-xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user'
                      ? `${accentColor}22`
                      : 'rgba(20,43,26,0.8)',
                    border: msg.role === 'user'
                      ? `1px solid ${accentColor}44`
                      : '1px solid rgba(26,46,69,0.5)',
                    color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {/* Render markdown-ish bold */}
                  {msg.content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                    j % 2 === 1
                      ? <strong key={j} style={{ color: accentColor }}>{part}</strong>
                      : <span key={j}>{part}</span>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(20,43,26,0.8)', border: '1px solid rgba(26,46,69,0.5)' }}>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--blue-400)]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={isSending}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  background: `${accentColor}12`,
                  border: `1px solid ${accentColor}30`,
                  color: accentColor,
                  whiteSpace: 'nowrap',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 flex-shrink-0">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'var(--brand-800)', border: `1px solid ${accentColor}33` }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about this phase..."
                disabled={isSending}
                className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder-[#4a7a56] disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isSending}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:scale-110"
                style={{ background: accentColor }}
              >
                {isSending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--brand-900)]" />
                  : <Send className="w-3.5 h-3.5 text-[var(--brand-900)]" />
                }
              </button>
            </div>
            <p className="text-xs text-center mt-1.5 text-[var(--brand-600)]">Powered by Gemini 2.0 Flash</p>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};

export default AIChatAssistant;
