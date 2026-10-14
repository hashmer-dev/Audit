import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';

const MODELS = [
  'nvidia/nemotron-3.5-lightning:free',
  'liquid/lfm-2.5-2.6b:free',
  'cohere/north-mini-code:free',
  'gemini-3.1-flash'
];

export function GeneralChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, selectedModel }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-700 text-white p-3 rounded-full shadow-lg hover:bg-emerald-800 transition"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div className="w-80 h-96 bg-white border border-emerald-200 rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="bg-emerald-700 text-white p-3 flex justify-between items-center">
            <span className="font-semibold text-sm">General Chat</span>
            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>
          <div className="p-2 border-b">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full text-xs p-1 border rounded"
            >
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded-lg ${m.role === 'user' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-gray-500"><Loader2 className="animate-spin inline" size={16} /> Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 text-sm p-2 border rounded"
              placeholder="Ask anything..."
            />
            <button onClick={sendMessage} className="text-emerald-700"><Send size={20} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
