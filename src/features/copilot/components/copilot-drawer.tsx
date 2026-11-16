'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  X,
  Bot,
  ArrowRight,
  MessageSquareText,
} from 'lucide-react';
import type { CopilotMessage } from '../actions/copilot.actions';
import { cn } from '@/lib/utils';

const QUICK_PROMPTS = [
  'What SKUs are low on stock?',
  'Summarize pending customer orders',
  'Are there any pending approvals?',
];

export function CopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const submitPrompt = async (text: string) => {
    const clean = text.trim();
    if (!clean || isPending) return;

    const userMsg: CopilotMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantId = `a-${Date.now()}`;
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsPending(true);

    try {
      const res = await fetch('/api/copilot/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: clean,
          history: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let createdAssistant = false;

      const ensureAssistantMessage = () => {
        if (createdAssistant) return;
        createdAssistant = true;
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const evt = JSON.parse(trimmed) as {
            type: 'meta' | 'delta' | 'done';
            text?: string;
            model?: string;
            toolsUsed?: string[];
            actionLink?: { label: string; href: string };
          };

          if (evt.type === 'meta') {
            ensureAssistantMessage();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, model: evt.model, toolsUsed: evt.toolsUsed, actionLink: evt.actionLink }
                  : m
              )
            );
          } else if (evt.type === 'delta' && evt.text) {
            ensureAssistantMessage();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + evt.text } : m
              )
            );
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach Copilot stream.';
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: msg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsPending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPrompt(input);
  };

  return (
    <>
      {/* Floating Copilot Trigger Button (Bottom-Left) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 left-5 z-40 glass-panel rounded-full pl-3 pr-4 py-2.5 flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
          aria-label="Open OpsPilot AI Copilot"
        >
          <span className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950 shadow-[0_0_14px_rgba(200,241,53,0.45)]">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
          </span>
          <span className="text-xs font-bold text-white tracking-tight">Ask Copilot</span>
        </button>
      )}

      {/* Slide-Over Clear Crystal Glass Drawer */}
      {isOpen && (
        <aside
          aria-label="OpsPilot AI Copilot"
          className="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-[420px] h-[560px] max-h-[calc(100vh-2rem)] z-50 glass-panel rounded-[28px] flex flex-col overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.8)] animate-fade-in-up"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.1] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    OpsPilot Copilot
                  </h3>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Live database & Gemini operations assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation Thread */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-3 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-[#c8f135]">
                  <MessageSquareText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Ask Anything About Operations
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Query live inventory, pending orders, or approval gates in real time.
                  </p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => submitPrompt(q)}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl glass-panel-inset text-xs text-slate-200 hover:text-white flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#c8f135] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line',
                        isUser
                          ? 'bg-[#c8f135]/15 border border-[#c8f135]/30 text-white'
                          : 'glass-panel-inset text-slate-200'
                      )}
                    >
                      {msg.content}

                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/[0.08]">
                          {msg.toolsUsed.map((tool) => (
                            <span
                              key={tool}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[#22d3ee]"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      {msg.actionLink && (
                        <div className="mt-2 pt-1">
                          <Link
                            href={msg.actionLink.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c8f135] hover:underline"
                          >
                            <span>{msg.actionLink.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 px-1">
                      {msg.timestamp}
                      {msg.model ? ` • ${msg.model}` : ''}
                    </span>
                  </div>
                );
              })
            )}

            {isPending && (
              <div className="flex items-start">
                <div className="glass-panel-inset rounded-2xl px-3.5 py-2.5 text-xs text-slate-300 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border-2 border-[#22d3ee] border-t-transparent animate-spin" />
                  <span>Scanning live operations...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3 border-t border-white/[0.1] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about stock, orders, or approvals..."
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-full glass-panel-inset text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="h-9 w-9 rounded-full bg-[#c8f135] hover:bg-[#b8e228] text-slate-950 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
