import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { askAI } from "@/lib/api";

const PRESETS = [
  "What is special about Kakinada?",
  "Explain the acoustics of Golconda's whispering gallery.",
  "Which classical dances come from Andhra Pradesh?",
  "What are the endangered languages of the Andamans?",
  "Tell me about Konark's chariot wheels and how they track time.",
];

export default function AskAI() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste. I'm Virana AI — a cultural guide to India's monuments, festivals, dances, languages, food and living traditions. Ask me anything.",
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `virana-${Date.now()}`);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: t }]);
    setLoading(true);
    try {
      const res = await askAI(t, sessionId);
      setMessages(m => [...m, { role: "assistant", text: res.reply, sources: res.sources || [] }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: "I couldn't reach the cultural archive just now. Please try again in a moment.", sources: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="ask-ai-page">
      <div className="mb-6">
        <div className="caption flex items-center gap-1"><Sparkles className="w-3 h-3" /> Ask Virana AI</div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-1">A cultural guide, always at hand.</h1>
        <p className="text-muted-foreground mt-2">Ask about places, dances, festivals, languages, spices, or forgotten traditions.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 sm:p-6 space-y-5 min-h-[420px] max-h-[62vh] overflow-y-auto scroll-fade-mask" data-testid="chat-log">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`msg-${m.role}-${i}`}>
              {m.role === "assistant" && (
                <div className="w-9 h-9 shrink-0 rounded-full gradient-royal flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-secondary/70 rounded-tl-sm border border-border"
              }`}>
                <div>{m.text}</div>
                {m.sources?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 pt-2 border-t border-border/50">
                    <span className="caption text-[10px]">Sources</span>
                    {m.sources.map(s => (
                      <span key={s} className="text-[10px] font-mono bg-background/50 border border-border px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-9 h-9 shrink-0 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3" data-testid="chat-loading">
              <div className="w-9 h-9 rounded-full gradient-royal flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl bg-secondary/60 border border-border px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-3 sm:p-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={loading}
                data-testid={`preset-${p.slice(0, 20).toLowerCase().replace(/\s/g, "-")}`}
                className="text-xs font-mono bg-secondary/60 border border-border rounded-full px-3 py-1 hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 bg-secondary/50 border border-border rounded-full pl-4 pr-1 py-1">
            <input
              data-testid="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about any place, tradition, dance, festival or dialect..."
              className="bg-transparent flex-1 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              data-testid="chat-send"
              className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              Send <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
