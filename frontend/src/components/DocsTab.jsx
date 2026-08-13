import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Database, AlertCircle, CheckCircle, Trash2, Hash } from 'lucide-react';
import { useStore } from '../store';

export default function DocsTab() {
  const [docTitle, setDocTitle] = useState('');
  const [docText,  setDocText]  = useState('');

  const nvidiaStatus   = useStore(s => s.nvidiaStatus);
  const docList        = useStore(s => s.docList);
  const docCount       = useStore(s => s.docCount);
  const isEmbedding    = useStore(s => s.isEmbedding);
  const insertStatus   = useStore(s => s.insertStatus);
  const insertDocument = useStore(s => s.insertDocument);
  const deleteDoc      = useStore(s => s.deleteDoc);

  const handleInsert = async () => {
    if (!docTitle.trim() || !docText.trim()) return;
    await insertDocument(docTitle, docText);
    setDocTitle('');
    setDocText('');
  };

  const isOnline = nvidiaStatus.nvidiaAvailable;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* NVIDIA Status */}
      <div className="card" style={{
        padding: '14px 16px',
        borderLeft: `3px solid ${isOnline ? 'var(--success)' : 'var(--error)'}`,
      }}>
        <div className="label-caps" style={{ marginBottom: '9px' }}>NVIDIA NIM Status</div>
        {isOnline ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '13px', fontWeight: '600' }}>
              <CheckCircle size={14} /><span>API Key Active</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-3)' }}>Embed Model</span>
              <span className="tnum" style={{ color: 'var(--text-1)', fontWeight: '500', fontSize: '11px' }}>{nvidiaStatus.embedModel}</span>
              <span style={{ color: 'var(--text-3)' }}>Generator</span>
              <span className="tnum" style={{ color: 'var(--text-1)', fontWeight: '500', fontSize: '11px' }}>{nvidiaStatus.genModel}</span>
              <span style={{ color: 'var(--text-3)' }}>Stored Chunks</span>
              <span className="tnum" style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '12px' }}>{nvidiaStatus.docCount}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)', fontSize: '13px', fontWeight: '600' }}>
              <AlertCircle size={14} /><span>API Key Not Set</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3)', lineHeight: '1.65' }}>
              To enable 768D embeddings via NVIDIA NIM:
              <ol style={{ paddingLeft: '16px', marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <li>Get a free key at <a href="https://build.nvidia.com" target="_blank" rel="noreferrer">build.nvidia.com</a></li>
                <li>Run: <code>export NVIDIA_API_KEY=nvapi-...</code></li>
                <li>Recompile and restart <code>./db</code></li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Insert Form */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Plus size={12} color="var(--text-3)" />
          <span className="label-caps">Insert Document</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <input type="text" placeholder="Document title (e.g. OS Notes, Chapter 3)"
            value={docTitle} onChange={e => setDocTitle(e.target.value)} disabled={isEmbedding} />
          <textarea
            placeholder={`Paste raw text here — lecture notes, docs, articles.\n\nAuto-split into 250-word chunks. Each gets a real 768D vector via NVIDIA nv-embed-v1.`}
            value={docText} onChange={e => setDocText(e.target.value)} disabled={isEmbedding} rows={5} />
          <button className="btn-primary" onClick={handleInsert}
            disabled={isEmbedding || !docTitle.trim() || !docText.trim()}
            style={{ width: '100%', height: '37px' }}>
            {isEmbedding
              ? <><div className="spinner" /><span>Generating Embeddings...</span></>
              : <><Database size={13} /><span>Embed & Insert</span></>}
          </button>
          <AnimatePresence>
            {insertStatus && (
              <motion.div initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  fontSize: '12px',
                  color: insertStatus.startsWith('✗') ? 'var(--error)' : 'var(--success)',
                  background: insertStatus.startsWith('✗') ? 'var(--error-bg)' : 'var(--success-bg)',
                  padding: '7px 11px', borderRadius: 'var(--r-md)', textAlign: 'center',
                  border: `1px solid ${insertStatus.startsWith('✗') ? 'rgba(196,58,42,0.18)' : 'rgba(26,122,74,0.18)'}`,
                }}>
                {insertStatus}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stored Docs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '9px' }}>
          <span className="label-caps">Stored Chunks</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', padding: '2px 7px', boxShadow: 'var(--shadow-xs)',
          }}>
            <Hash size={9} color="var(--text-3)" />
            <span className="tnum" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700' }}>{docCount}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {docList.length === 0 ? (
            <div className="empty-state">
              <FileText size={22} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.25 }} />
              <div>No chunks stored yet.<br />Paste a document above to embed it.</div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {docList.map(doc => (
                <motion.div key={doc.id} layout
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="card" style={{ padding: '12px 13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={12} color="var(--cat-doc, #5A5AC8)" />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-1)' }}>{doc.title}</span>
                    </div>
                    <button className="btn-danger" onClick={() => deleteDoc(doc.id)} style={{ padding: '2px 6px' }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                  <div className="card-inset" style={{
                    fontSize: '11px', color: 'var(--text-3)', lineHeight: '1.55',
                    fontFamily: 'var(--font-mono)', borderLeft: '2px solid #5A5AC828',
                  }}>
                    {doc.preview}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                    {doc.words} words · 768D HNSW index
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
