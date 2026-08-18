import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, TrendingUp, AlertTriangle, Package, Boxes } from 'lucide-react';
import { useStore, type PageId } from '@/store';
import { classNames } from '@/lib/utils';
import { getStockHealth, daysOfCoverage } from '@/lib/decisionEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: { label: string; page: PageId }[];
}

export function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { orders, products, exceptions, setPage } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your warehouse AI assistant. Ask me about orders, inventory, exceptions, or operational recommendations. Try: 'What needs attention?' or 'Which SKUs are low on stock?'",
      suggestions: [
        { label: 'What needs attention?', page: 'dashboard' },
        { label: 'Show low stock items', page: 'inventory' },
        { label: 'What exceptions are open?', page: 'exceptions' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  if (!open) return null;

  const generateResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();
    const id = `msg-${Date.now()}`;

    if (q.includes('low stock') || q.includes('reorder') || q.includes('stock out') || q.includes('inventory')) {
      const lowStock = products.filter(p => { const h = getStockHealth(p); return h === 'low_stock' || h === 'critical' || h === 'out_of_stock'; });
      const critical = products.filter(p => getStockHealth(p) === 'out_of_stock' || getStockHealth(p) === 'critical');
      return {
        id, role: 'assistant',
        content: `I found ${lowStock.length} SKUs that need attention:\n\n${critical.slice(0, 3).map(p => `• ${p.sku} (${p.name}) — ${p.available} units left, ${daysOfCoverage(p).toFixed(1)} days of coverage`).join('\n')}\n\n${critical.length > 3 ? `...and ${critical.length - 3} more critical items.\n\n` : ''}Recommended action: Review these in the Inventory page and approve emergency replenishment orders.`,
        suggestions: [{ label: 'Go to Inventory', page: 'inventory' }],
      };
    }

    if (q.includes('exception') || q.includes('issue') || q.includes('problem') || q.includes('damaged')) {
      const open = exceptions.filter(e => e.status === 'open' || e.status === 'escalated');
      return {
        id, role: 'assistant',
        content: `There are ${open.length} open exceptions right now:\n\n${open.slice(0, 3).map(e => `• ${e.id} — ${e.category.replace(/_/g, ' ')} (${e.severity})\n  ${e.description.slice(0, 80)}...`).join('\n\n')}\n\n${open.length > 3 ? `...and ${open.length - 3} more.\n\n` : ''}Would you like to review and resolve these?`,
        suggestions: [{ label: 'Go to Exceptions', page: 'exceptions' }],
      };
    }

    if (q.includes('at risk') || q.includes('sla') || q.includes('attention') || q.includes('urgent') || q.includes('priority')) {
      const atRisk = orders.filter(o => o.atRisk);
      const critical = orders.filter(o => o.priority === 'critical' && o.atRisk);
      return {
        id, role: 'assistant',
        content: `${atRisk.length} orders are currently at risk of missing their SLA deadline.\n\n${critical.slice(0, 3).map(o => `• ${o.id} — ${o.customer} (score: ${o.priorityScore}/100)\n  Status: ${o.status}, needs immediate action`).join('\n\n')}\n\nThe most critical issue is ORD-1048, which has an inventory conflict on SKU WH-105. I recommend reviewing the allocation page to resolve this.`,
        suggestions: [{ label: 'Review Allocation', page: 'allocation' }, { label: 'View Orders', page: 'orders' }],
      };
    }

    if (q.includes('order') || q.includes('fulfillment')) {
      const pending = orders.filter(o => !['dispatched', 'completed'].includes(o.status));
      return {
        id, role: 'assistant',
        content: `There are ${pending.length} orders in progress. Breakdown:\n\n• ${orders.filter(o => o.status === 'picking').length} in picking\n• ${orders.filter(o => o.status === 'packing').length} in packing\n• ${orders.filter(o => o.status === 'quality_check').length} in quality check\n• ${orders.filter(o => o.status === 'ready_to_dispatch').length} ready for dispatch\n\nAverage fulfillment time is 3.2 hours, down 8% from last week.`,
        suggestions: [{ label: 'View Orders', page: 'orders' }],
      };
    }

    if (q.includes('zone') || q.includes('picker') || q.includes('picking') || q.includes('bottleneck')) {
      return {
        id, role: 'assistant',
        content: `Zone B (Electronics) is your main bottleneck right now:\n\n• Congestion: 78%\n• Average pick time: 5.8 min (24% above warehouse average)\n• 3 pickers assigned\n\nRecommendation: Move 1 picker from Zone D to Zone B during the 2-4 PM peak shift. This should reduce average pick time by ~15%.`,
        suggestions: [{ label: 'View Analytics', page: 'analytics' }, { label: 'Go to Picking', page: 'picking' }],
      };
    }

    if (q.includes('dispatch') || q.includes('shipping') || q.includes('carrier')) {
      return {
        id, role: 'assistant',
        content: `Dispatch status:\n\n• ${orders.filter(o => o.status === 'ready_to_dispatch').length} shipments ready for dispatch\n• Carrier cutoff at 16:00 (about 1.5 hours away)\n• 2 shipments are delayed and need attention\n\nI recommend prioritizing ORD-1042 and ORD-1045 for immediate packing and quality check.`,
        suggestions: [{ label: 'Go to Dispatch', page: 'dispatch' }],
      };
    }

    return {
      id, role: 'assistant',
      content: `I can help you with:\n\n• Order status and prioritization\n• Inventory and stock levels\n• Exception resolution\n• Picking and packing operations\n• Dispatch tracking\n• Bottleneck analysis\n\nTry asking: "What needs attention?", "Show low stock items", or "Which orders are at risk?"`,
      suggestions: [
        { label: 'What needs attention?', page: 'dashboard' },
        { label: 'Show low stock items', page: 'inventory' },
        { label: 'Open exceptions', page: 'exceptions' },
      ],
    };
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const response = generateResponse(text);
      setMessages(prev => [...prev, response]);
      setTyping(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg h-[80vh] sm:h-[600px] bg-white dark:bg-ink-900 rounded-t-2xl sm:rounded-2xl shadow-panel border border-ink-200 dark:border-ink-800 animate-slide-in-up flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-200 dark:border-ink-800 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-ink-950 dark:to-ink-900 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">WarehouseIQ Assistant</p>
            <p className="text-[10px] text-ink-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-soft" /> Online · AI-powered
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={classNames('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={classNames('max-w-[85%]', msg.role === 'user' ? 'bg-primary-600 text-white rounded-2xl rounded-br-md' : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 rounded-2xl rounded-bl-md', 'px-3.5 py-2.5')}>
                {msg.role === 'assistant' && <Sparkles className="w-3.5 h-3.5 text-accent-500 mb-1.5" />}
                <p className="text-xs whitespace-pre-line leading-relaxed">{msg.content}</p>
                {msg.suggestions && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {msg.suggestions.map(s => (
                      <button key={s.label} onClick={() => { setPage(s.page); onClose(); }} className="px-2.5 py-1 rounded-lg bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 text-[10px] font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-ink-600 transition-colors">
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-ink-100 dark:bg-ink-800 rounded-2xl rounded-bl-md px-3.5 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse-soft" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-ink-200 dark:border-ink-800 p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(input); }}
              placeholder="Ask about orders, inventory, exceptions..."
              className="input flex-1 !text-xs"
            />
            <button onClick={() => handleSend(input)} disabled={!input.trim()} className="btn-primary !p-2.5">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
