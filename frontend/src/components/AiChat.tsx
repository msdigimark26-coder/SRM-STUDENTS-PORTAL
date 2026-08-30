import React, { useState, useEffect, useRef } from 'react';
import type { NormalizedStudentData } from '@srm/shared';
import { processMessage } from '../agents/AgentOrchestrator';
import type { AgentCard } from '../agents/AgentOrchestrator';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { TimetableManager } from './timetable/TimetableManager';

interface AiChatProps {
  studentData: NormalizedStudentData;
  onUpdateTimetable?: (timetable: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  cards?: AgentCard[];
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Attendance evlo irukku?",
  "Tomorrow leave edukalama?",
  "Today which class safe to bunk?",
  "How to recover my attendance?"
];

export const AiChat: React.FC<AiChatProps> = ({ studentData, onUpdateTimetable }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('bunk-ai-chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        return [];
      }
    }
    return [{
      id: 'welcome',
      sender: 'agent',
      text: 'Hi Machan! 👋 Naan un Bunk Adkirow AI. Attendance pathi enna venum kelu!',
      timestamp: new Date()
    }];
  });
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('bunk-ai-chat', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate network delay for "thinking" feel
    setTimeout(() => {
      const response = processMessage(userMsg.text, studentData);
      
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: response.text,
        cards: response.cards,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 500);
  };

  const renderCard = (card: AgentCard, idx: number) => {
    if (card.type === 'timetable-upload' as any) {
      return (
        <div key={idx} className="ai-card" style={{ display: 'block', padding: 0, overflow: 'hidden', border: '1px solid var(--border-active)', marginTop: '0.5rem' }}>
          <TimetableManager 
            studentData={studentData} 
            onUpdateTimetable={(data) => {
              if (onUpdateTimetable) onUpdateTimetable(data);
              // Give feedback in chat
              const feedbackMsg: ChatMessage = {
                id: Date.now().toString(),
                sender: 'agent',
                text: 'Super! Timetable uploaded. Now try asking me again. 🚀',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, feedbackMsg]);
            }} 
          />
        </div>
      );
    }

    return (
      <div key={idx} className={`ai-card ai-card-${card.status || 'info'}`}>
        <div className="ai-card-header">
          <span className="ai-card-icon">{card.icon}</span>
          <div className="ai-card-titles">
            <h4>{card.title}</h4>
            {card.subtitle && <span className="ai-card-subtitle">{card.subtitle}</span>}
          </div>
          {card.value && <div className="ai-card-value">{card.value}</div>}
        </div>
        {card.badge && <div className="ai-card-badge">{card.badge}</div>}
      </div>
    );
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message-wrapper ${msg.sender}`}>
            <div className="chat-avatar">
              {msg.sender === 'agent' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="chat-bubble-container">
              <div className={`chat-bubble ${msg.sender}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              {msg.cards && msg.cards.length > 0 && (
                <div className="chat-cards-container">
                  {msg.cards.map((c, i) => renderCard(c, i))}
                </div>
              )}
              <span className="chat-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message-wrapper agent">
            <div className="chat-avatar"><Bot size={20} /></div>
            <div className="chat-bubble agent typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-area">
        {messages.length < 3 && !isTyping && (
          <div className="quick-prompts">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button key={i} className="prompt-chip" onClick={() => handleSend(prompt)}>
                <Sparkles size={14} /> {prompt}
              </button>
            ))}
          </div>
        )}
        <div className="input-box">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask anything about your attendance..."
          />
          <button 
            className="send-button"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
