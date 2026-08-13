import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, BarChart2, Layers, Zap, TrendingUp } from 'lucide-react';
import { useStore } from '../store';

const CAT_COLORS = {
  cs: '#2A7CC7', math: '#7C3FA6', food: '#C46A2A', sports: '#2A8A4A', doc: '#5A5AC8', default: '#8A8784',
};

const DIM_COLORS = [
  '#2A7CC7','#2A7CC7','#2A7CC7','#2A7CC7',
  '#7C3FA6','#7C3FA6','#7C3FA6','#7C3FA6',
  '#C46A2A','#C46A2A','#C46A2A','#C46A2A',
  '#2A8A4A','#2A8A4A','#2A8A4A','#2A8A4A',
];

export default function SearchTab() {
  const searchResults = useStore(s => s.searchResults);
  const deleteItem    = useStore(s => s.deleteItem);
  const latency       = useStore(s => s.latency);
  const latencySub    = useStore(s => s.latencySub);
  const queryEmb      = useStore(s => s.queryEmb);
  const setHoverItem  = useStore(s => s.setHoverItem);
  const benchData     = useStore(s => s.benchData);
  const showBench     = useStore(s => s.showBench);
  const hnswLayers    = useStore(s => s.hnswLayers);
  const selAlgo       = useStore(s => s.selAlgo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Latency */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="label-caps" style={{ marginBottom: '5px' }}>Search Latency</div>
            <div className="metric-value">{latency}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>{latencySub}</div>
          </div>
          <span style={{
            fontSize: '10px', fontWeight: '700', fontFamily: 'var(--font-mono)',
            padding: '3px 8px', borderRadius: 'var(--r-sm)',
            background: 'var(--accent-mist)', color: 'var(--accent)',
            border: '1px solid rgba(14,107,94,0.18)',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Zap size={9} />
            {selAlgo === 'hnsw' ? 'HNSW' : selAlgo === 'kdtree' ? 'KD-Tree' : 'Brute Force'}
          </span>
        </div>
      </div>

      {/* Results */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '9px' }}>
          <span className="label-caps">Nearest Neighbors</span>
          {searchResults.length > 0 && (
            <span className="tnum" style={{ fontSize: '10px', color: 'var(--text-3)' }}>k = {searchResults.length}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {searchResults.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: '16px' }}>
              <TrendingUp size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
              <div>Search to find nearest vectors in semantic space</div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {searchResults.map((r, i) => {
                const col = CAT_COLORS[r.category] || CAT_COLORS.default;
                return (
                  <motion.div key={r.id} layout
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32, delay: i * 0.03 }}
                    className="card" style={{ padding: '12px 14px', cursor: 'default' }}
                    onMouseEnter={() => setHoverItem({ id: r.id })} onMouseLeave={() => setHoverItem(null)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: `rgba(${col === '#2A7CC7' ? '42,124,199' : col === '#7C3FA6' ? '124,63,166' : col === '#C46A2A' ? '196,106,42' : col === '#2A8A4A' ? '42,138,74' : '90,90,200'},0.1)`,
                          border: `1.5px solid ${col}50`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '9px', fontWeight: '800', color: col, fontFamily: 'var(--font-mono)',
                        }}>
                          {i + 1}
                        </div>
                        <span style={{
                          fontSize: '9.5px', padding: '2px 7px', borderRadius: 'var(--r-pill)',
                          background: `${col}12`, color: col, border: `1px solid ${col}28`,
                          fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px',
                        }}>
                          {r.category}
                        </span>
                      </div>
                      <button className="btn-danger" onClick={e => { e.stopPropagation(); deleteItem(r.id); }} style={{ padding: '2px 6px' }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-1)', marginBottom: '8px', lineHeight: 1.4 }}>
                      {r.metadata}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '3px', background: 'var(--bg)', borderRadius: '99px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ width: `${Math.max(5, 100 - r.distance * 120)}%`, height: '100%', background: col, borderRadius: '99px' }} />
                      </div>
                      <span className="tnum" style={{ fontSize: '10px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        d = {r.distance.toFixed(5)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* 16D Embedding */}
      <div className="card" style={{ padding: '14px' }}>
        <div className="label-caps" style={{ marginBottom: '10px' }}>Query Embedding — 16 Dims</div>
        <div style={{ display: 'flex', gap: '3px', height: '48px', alignItems: 'flex-end', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
          {queryEmb.map((val, idx) => (
            <div key={idx} style={{
              flex: 1,
              height: `${Math.max(4, val * 100)}%`,
              background: DIM_COLORS[idx],
              borderRadius: '2px 2px 0 0',
              transition: 'height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: 0.75,
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-3)', marginTop: '5px', fontWeight: '600' }}>
          <span style={{ color: CAT_COLORS.cs }}>CS×4</span>
          <span style={{ color: CAT_COLORS.math }}>MATH×4</span>
          <span style={{ color: CAT_COLORS.food }}>FOOD×4</span>
          <span style={{ color: CAT_COLORS.sports }}>SPORT×4</span>
        </div>
      </div>

      {/* Benchmark */}
      <AnimatePresence>
        {showBench && benchData && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card" style={{ padding: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <BarChart2 size={12} color="var(--text-3)" />
              <span className="label-caps">Algorithm Benchmark</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {benchData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{item.lbl}</span>
                    <span className="tnum" style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.disp}</span>
                  </div>
                  <div className="progress-track">
                    <motion.div className="progress-bar" initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                      transition={{ type: 'spring', stiffness: 70, delay: idx * 0.1 }}
                      style={{ background: item.col }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HNSW Layers */}
      <div className="card" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Layers size={12} color="var(--text-3)" />
          <span className="label-caps">HNSW Graph Structure</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {hnswLayers.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic' }}>Loading...</div>
          ) : hnswLayers.map(l => (
            <div key={l.lyr} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="tnum" style={{ width: '22px', fontSize: '11px', color: 'var(--accent)', fontWeight: '700' }}>L{l.lyr}</span>
              <div style={{ flex: 1 }}>
                <div className="progress-track" style={{ height: '4px' }}>
                  <div className="progress-bar" style={{ width: `${l.pct}%`, opacity: 0.75 }} />
                </div>
              </div>
              <span className="tnum" style={{ fontSize: '10px', color: 'var(--text-3)', width: '76px', textAlign: 'right' }}>
                {l.count}n · {l.edges}e
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
