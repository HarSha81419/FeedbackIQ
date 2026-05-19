import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { suggestedPrompts } from '@/services/mockData';
import type { ChatMessage, Citation } from '@/types';

const mockCitations: Citation[] = [
  {
    id: 'c1',
    feedbackId: 'fb-1',
    excerpt: 'Billing cycle is confusing — charged twice this month...',
    sentiment: 'negative',
    relevance: 0.94,
  },
  {
    id: 'c2',
    feedbackId: 'fb-5',
    excerpt: 'Considering canceling — competitor offers better pricing...',
    sentiment: 'negative',
    relevance: 0.87,
  },
];

const demoResponse =
  'Based on 847 billing-related feedback items from the last 14 days, negative sentiment increased 34%. Top drivers: duplicate charges (42%), unclear invoices (31%), and refund delays (18%). Five enterprise accounts show churn risk > 0.8 correlated with billing complaints.';

export function InsightsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        'Hello! I\'m your FeedbackIQ intelligence assistant. Ask me anything about your customer feedback data.',
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const sendMessage = (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((m) => [
      ...m,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ]);

    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      if (i >= demoResponse.length) {
        clearInterval(interval);
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: demoResponse, isStreaming: false, citations: mockCitations }
              : msg
          )
        );
        setStreaming(false);
      } else {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content: demoResponse.slice(0, i) } : msg
          )
        );
      }
    }, 30);
  };

  return (
    <>
      <PageHeader
        title="AI Insights"
        subtitle="RAG-powered conversational intelligence over your feedback"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        <Card className="lg:col-span-1 p-4" padding="none">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Suggested prompts
          </p>
          <div className="space-y-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="w-full text-left text-sm text-slate-400 rounded-lg px-3 py-2.5 hover:bg-white/5 hover:text-slate-200 transition-colors border border-transparent hover:border-border"
              >
                {prompt}
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3 flex flex-col overflow-hidden" padding="none">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-accent-cyan/10 border border-accent-cyan/20 text-slate-200'
                      : 'glass text-slate-300'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <Sparkles className="h-4 w-4 text-accent-indigo mb-2" />
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                    {msg.isStreaming ? (
                      <span className="inline-block w-2 h-4 ml-1 bg-accent-cyan animate-pulse" />
                    ) : null}
                  </p>
                  {msg.citations && msg.citations.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-slate-500 font-medium">Sources</p>
                      {msg.citations.map((cite) => (
                        <div
                          key={cite.id}
                          className="rounded-lg border border-border bg-surface-elevated/50 p-3 text-xs"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-slate-500">{cite.feedbackId}</span>
                            <Badge variant={cite.sentiment}>{cite.sentiment}</Badge>
                            <span className="text-accent-cyan ml-auto">
                              {(cite.relevance * 100).toFixed(0)}% match
                            </span>
                          </div>
                          <p className="text-slate-400 italic">&ldquo;{cite.excerpt}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about trends, churn, sentiment..."
                className="flex-1 rounded-lg border border-border bg-surface-elevated/50 px-4 py-2.5 text-sm focus-ring"
                disabled={streaming}
              />
              <Button type="submit" disabled={streaming || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
