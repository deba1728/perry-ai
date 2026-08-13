import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Cpu, BookOpen, ChevronDown, ChevronUp, Sparkles, MessageSquare, Bot } from 'lucide-react';
import { useStore } from '../store';

function TypewriterText({ text, speed = 7 }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    let i = 0;
    const iv = setInterval(() => {
      setShown(p => p + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
      {shown}
      {shown.length < text.length && (
        <span style={{
          display: 'inline-block', width: '2px', height: '14px',
          background: 'var(--accent)', marginLeft: '2px', verticalAlign: 'text-bottom',
          animation: 'blink 1s step-end infinite',
        }} />
      )}
    </div>
  );
}

function ContextCard({ ctx, index }) {
  const [open, setOpen] = useState(false);
  const setHoverItem = useStore(s => s.setHoverItem);
  const pcaPoints    = useStore(s => s.pcaPoints);
  return (
    <div className="ctx-card"
      onMouseEnter={() => {
        const pt = pcaPoints.find(p => p.item.category === 'doc' && ctx.title.startsWith(p.item.metadata));
        if (pt) setHoverItem({ id: pt.item.id });
      }}
      onMouseLeave={() => setHoverItem(null)}>
      <div onClick={() => setOpen(!open)}
        style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
          <span style={{
            fontSize: '9px', fontWeight: '800', fontFamily: 'var(--font-mono)',
            background: 'var(--accent-mist)', color: 'var(--accent)',
            padding: '1px 6px', borderRadius: 'var(--r-xs)', border: '1px solid rgba(14,107,94,0.2)',
          }}>[{index}]</span>
          <span style={{ color: 'var(--text-2)', fontWeight: '500' }}>{ctx.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="tnum" style={{ fontSize: '10px', color: 'var(--text-3)' }}>d={ctx.distance.toFixed(4)}</span>
          {open ? <ChevronUp size={11} color="var(--text-3)" /> : <ChevronDown size={11} color="var(--text-3)" />}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '9px 12px', fontSize: '11px', color: 'var(--text-3)',
              lineHeight: 1.6, borderTop: '1px solid var(--border)',
              background: 'var(--bg)', fontFamily: 'var(--font-mono)',
            }}>
              {ctx.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RagTab() {
  const [question, setQuestion] = useState('');
  const bottomRef = useRef(null);
  const ragK        = useStore(s => s.ragK);
  const setRagK     = useStore(s => s.setRagK);
  const chatHistory = useStore(s => s.chatHistory);
  const isThinking  = useStore(s => s.isThinking);
  const askAI       = useStore(s => s.askAI);
  const docCount    = useStore(s => s.docCount);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    const q = question; setQuestion(''); await askAI(q);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Prompt */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Sparkles size={12} color="var(--accent)" />
          <span className="label-caps">RAG Pipeline</span>
          {docCount > 0 && (
            <span style={{
              marginLeft: 'auto', fontSize: '10px', fontWeight: '700',
              color: 'var(--success)', background: 'var(--success-bg)',
              border: '1px solid rgba(26,122,74,0.2)',
              padding: '1px 7px', borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-mono)',
            }}>{docCount} chunks</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <textarea
            placeholder={"Ask a question about your documents.\n\nExamples:\n• \"What is dynamic programming?\"\n• \"Summarize the OS notes\""}
            value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
            disabled={isThinking} rows={4} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={ragK} onChange={e => setRagK(parseInt(e.target.value))} style={{ width: '130px' }} disabled={isThinking}>
              <option value={2}>Top 2 Chunks</option>
              <option value={3}>Top 3 Chunks</option>
              <option value={5}>Top 5 Chunks</option>
            </select>
            <button className="btn-primary" onClick={handleSubmit}
              disabled={isThinking || !question.trim() || docCount === 0} style={{ flex: 1, height: '37px' }}>
              {isThinking
                ? <><div className="spinner" /><span>Retrieving...</span></>
                : <><Send size={13} /><span>Ask AI</span></>}
            </button>
          </div>
          {docCount === 0
            ? <div style={{ fontSize: '11px', color: 'var(--warning)', textAlign: 'center' }}>⚠ Add documents on the Documents tab first</div>
            : <div style={{ fontSize: '11px', color: 'var(--text-4)', textAlign: 'center' }}>
                <kbd style={{ padding: '1px 5px', background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-xs)', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>Ctrl+Enter</kbd> to submit
              </div>}
        </div>
      </div>

      {/* Conversation */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '11px' }}>
          <MessageSquare size={12} color="var(--text-3)" />
          <span className="label-caps">Conversation</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <AnimatePresence>
            {isThinking && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: 'var(--text-3)' }}>
                <div className="spinner" /><span>Retrieving context & generating response via NVIDIA NIM...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {chatHistory.length === 0 && !isThinking && (
            <div className="empty-state">
              <Bot size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.25 }} />
              <div>Ask a question to start the RAG conversation.<br />
                <span style={{ fontSize: '11px' }}>HNSW retrieves context → NVIDIA LLM answers.</span>
              </div>
            </div>
          )}

          {chatHistory.map((chat, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div className="bubble-user">{chat.question}</div>
              </div>
              <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--success)', fontWeight: '700', letterSpacing: '0.4px' }}>
                  <Cpu size={10} /><span>{chat.model?.toUpperCase() || 'NVIDIA NIM'}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontWeight: '400', fontSize: '10px' }}>NVIDIA AI · cloud inference</span>
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--text-1)', lineHeight: 1.65 }}>
                  <TypewriterText text={chat.answer} />
                </div>
                {chat.contexts?.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
                      <BookOpen size={11} color="var(--text-3)" />
                      <span className="label-caps">Retrieved Context</span>
                      <span style={{
                        marginLeft: 'auto', fontSize: '9px', fontWeight: '700',
                        color: 'var(--accent)', background: 'var(--accent-mist)',
                        border: '1px solid var(--accent-ring)',
                        padding: '1px 6px', borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-mono)',
                      }}>{chat.contexts.length} sources</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {chat.contexts.map((ctx, cIdx) => (
                        <ContextCard key={ctx.id} ctx={ctx} index={cIdx + 1} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
