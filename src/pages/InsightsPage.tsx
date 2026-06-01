import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, FileText, RefreshCcw, Zap } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { suggestedPrompts } from '@/services/mockData';
import { useStreamChat } from '@/hooks/useChat';
import type { ChatMessage, Citation } from '@/types';

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      "👋 Hello! I'm your FeedbackIQ AI analyst. Ask me anything about your customer feedback—I'll search our database and provide data-driven insights.",
  },
];

function createCitation(index: number, source: any): Citation {
  return {
    id: `source-${index}`,
    feedbackId: source.id,
    excerpt: source.content.length > 120 ? `${source.content.slice(0, 117).trim()}...` : source.content,
    sentiment: source.sentiment,
    relevance: source.score ?? source.relevance ?? 0,
  };
}

interface MessageWithMetadata extends ChatMessage {
  queryTime?: number;
  retrievedCount?: number;
}

export function InsightsPage() {
  const [messages, setMessages] = useState<MessageWithMetadata[]>(initialMessages);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { streamChat } = useStreamChat();

  const history = useMemo(
    () =>
      messages
        .slice(-6)
        .filter((msg) => msg.id !== 'welcome')
        .map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const cleaned = text.trim();
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: cleaned,
      };
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: MessageWithMetadata = {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      };

      setMessages((current) => [...current, userMessage, assistantMessage]);
      setInput('');

      try {
        let fullResponse = '';

        for await (const token of streamChat({
          query: cleaned,
          history,
          limit: 7,
        })) {
          fullResponse += token;
          setMessages((current) =>
            current.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: fullResponse, isStreaming: true }
                : msg
            )
          );
        }

        // After streaming is complete, fetch the full response with sources
        const { chatQuery } = await import('@/services/chat.service');
        const fullData = await chatQuery({ query: cleaned, history, limit: 7 });
        const citations = fullData.sources.slice(0, 4).map((source, index) => createCitation(index, source));

        setMessages((current) =>
          current.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: fullResponse,
                  isStreaming: false,
                  citations,
                  queryTime: fullData.query_time_ms,
                  retrievedCount: fullData.retrieved_count,
                }
              : msg
          )
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setMessages((current) =>
          current.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: `Sorry, I encountered an error: ${errorMsg}`,
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    },
    [history, streamChat]
  );

  return (
    <>
      <PageHeader
        title="AI Insights"
        subtitle="Conversational intelligence over your customer feedback"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <Card className="lg:col-span-1 p-4 flex flex-col" padding="none">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Quick Prompts
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Start with a suggested question or write your own.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages(initialMessages)}
              className="shrink-0"
              title="Clear chat"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto mb-4">
            {suggestedPrompts.map((prompt) => (
              <motion.button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                whileHover={{ x: 4 }}
                className="w-full text-left text-xs text-slate-400 rounded-lg px-3 py-2.5 hover:bg-white/5 hover:text-slate-200 transition-colors border border-transparent hover:border-border/50"
              >
                <Zap className="h-3 w-3 inline mr-1.5" />
                {prompt}
              </motion.button>
            ))}
          </div>

          {messages.length > 1 && (
            <div className="rounded-lg border border-border/50 bg-surface-elevated/30 p-3 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Session Stats</p>
              <p>Messages: {messages.length - 1}</p>
              {messages.some((m) => m.queryTime) && (
                <p>
                  Avg Query: {Math.round((messages.filter((m) => m.queryTime).reduce((a, m) => a + (m.queryTime || 0), 0) / (messages.filter((m) => m.queryTime).length || 1)) || 0)}ms
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden" padding="none">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-accent-cyan/10 border border-accent-cyan/20 text-slate-200'
                        : 'glass text-slate-300 space-y-3'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-accent-indigo" />
                        <span className="text-xs text-slate-500">FeedbackIQ AI</span>
                        {msg.retrievedCount !== undefined && (
                          <span className="text-xs text-slate-600">
                            ({msg.retrievedCount} sources)
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-accent-cyan animate-pulse" />
                      )}
                    </p>

                    {msg.citations && msg.citations.length > 0 && !msg.isStreaming && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 pt-3 border-t border-border/30 space-y-2"
                      >
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                          Sources
                        </p>
                        {msg.citations.map((cite) => (
                          <div
                            key={cite.id}
                            className="rounded-lg border border-border/50 bg-surface-elevated/30 p-3 text-xs hover:bg-surface-elevated/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="text-slate-600 truncate">{cite.feedbackId}</span>
                              <Badge variant={cite.sentiment} className="text-xs">
                                {cite.sentiment}
                              </Badge>
                              <span className="text-accent-cyan ml-auto shrink-0 font-medium">
                                {(cite.relevance * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-slate-400 italic line-clamp-2">
                              "{cite.excerpt}"
                            </p>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {msg.queryTime && msg.role === 'assistant' && !msg.isStreaming && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-slate-600 pt-2 border-t border-border/20 mt-2"
                      >
                        Query: {msg.queryTime}ms
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4 bg-surface-elevated/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="space-y-2"
            >
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask about trends, churn, sentiment, complaints... (Shift+Enter for new line)"
                  className="flex-1 min-h-[56px] max-h-[200px] rounded-lg border border-border bg-surface-elevated/50 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus-ring resize-none"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!input.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Ollama local LLM • Powered by customer feedback retrieval
              </p>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
