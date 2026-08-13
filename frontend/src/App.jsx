import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import ScatterPlot from './components/ScatterPlot';
import SearchTab from './components/SearchTab';
import DocsTab from './components/DocsTab';
import RagTab from './components/RagTab';
import { Search, Database, Bot, BarChart2, Plus, Cpu, Activity, GitBranch } from 'lucide-react';
import './index.css';

const LEGEND = [
  { id: 'cs',     label: 'CS / Algorithms', col: '#2A7CC7' },
  { id: 'math',   label: 'Mathematics',     col: '#7C3FA6' },
  { id: 'food',   label: 'Food & Cooking',  col: '#C46A2A' },
  { id: 'sports', label: 'Sports & Games',  col: '#2A8A4A' },
  { id: 'doc',    label: 'RAG Documents',   col: '#5A5AC8' },
];

const ALGO_OPTIONS = [
  { id: 'hnsw',       label: 'HNSW' },
  { id: 'kdtree',     label: 'KD-Tree' },
  { id: 'bruteforce', label: 'Brute' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [addMeta, setAddMeta] = useState('');
  const [addCat, setAddCat]   = useState('cs');

  const qInput    = useStore(s => s.qInput);
  const setQInput = useStore(s => s.setQInput);
  const selAlgo   = useStore(s => s.selAlgo);
  const setSelAlgo = useStore(s => s.setSelAlgo);
  const metric    = useStore(s => s.metric);
  const setMetric = useStore(s => s.setMetric);
  const kSlider   = useStore(s => s.kSlider);
  const setKSlider = useStore(s => s.setKSlider);

  const loadItems         = useStore(s => s.loadItems);
  const loadHNSWInfo      = useStore(s => s.loadHNSWInfo);
  const checkNvidiaStatus = useStore(s => s.checkNvidiaStatus);
  const loadDocList       = useStore(s => s.loadDocList);
  const runSearch         = useStore(s => s.runSearch);
  const runBenchmark      = useStore(s => s.runBenchmark);
  const addVector         = useStore(s => s.addVector);

  const allItems    = useStore(s => s.allItems);
  const nvidiaStatus = useStore(s => s.nvidiaStatus);

  useEffect(() => {
    loadItems();
    loadHNSWInfo();
    checkNvidiaStatus();
    loadDocList();
    const iv = setInterval(checkNvidiaStatus, 8000);
    return () => clearInterval(iv);
  }, []);

  const handleInsertDemo = async () => {
    if (!addMeta.trim()) return;
    await addVector(addMeta, addCat);
    setAddMeta('');
  };

  const isOnline = nvidiaStatus.nvidiaAvailable;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ─── HEADER ──────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '54px',
        flexShrink: 0,
        background: 'var(--surface-0)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        {/* Left — Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'var(--accent)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}>
              <GitBranch size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-1)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                VectorDB
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.2px' }}>
                Built in C++ · NVIDIA NIM
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

          <div style={{ display: 'flex', gap: '5px' }}>
            {['HNSW', 'KD-Tree', 'Brute Force'].map(a => (
              <span key={a} className="badge badge-algo">{a}</span>
            ))}
          </div>
        </div>

        {/* Right — Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={isOnline ? 'status-online' : 'status-offline'}>
            <span className="status-dot" />
            <Cpu size={10} />
            <span>NVIDIA NIM {isOnline ? 'Ready' : 'No API Key'}</span>
          </span>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: 'var(--r-md)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <Activity size={11} color="var(--text-3)" />
            <span className="tnum" style={{ fontSize: '12px', color: 'var(--text-1)', fontWeight: '600' }}>
              {allItems.length}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>vectors · 16D</span>
          </div>
        </div>
      </header>

      {/* ─── BODY ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
        <aside style={{
          width: '260px',
          background: 'var(--surface-0)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          flexShrink: 0,
        }}>

          {/* Query */}
          <div>
            <div className="label-caps" style={{ marginBottom: '8px' }}>Query Vector</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                type="text"
                placeholder="binary tree, sushi, calculus..."
                value={qInput}
                onChange={e => setQInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
              />
              <button className="btn-primary" onClick={runSearch} style={{ width: '100%', height: '36px' }}>
                <Search size={13} /><span>Search</span>
              </button>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Algorithm */}
          <div>
            <div className="label-caps" style={{ marginBottom: '8px' }}>Algorithm</div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {ALGO_OPTIONS.map(a => (
                <button key={a.id} onClick={() => setSelAlgo(a.id)}
                  className={`algo-pill ${selAlgo === a.id ? 'active' : ''}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metric */}
          <div>
            <div className="label-caps" style={{ marginBottom: '7px' }}>Distance Metric</div>
            <select value={metric} onChange={e => setMetric(e.target.value)}>
              <option value="cosine">Cosine Similarity</option>
              <option value="euclidean">Euclidean Distance</option>
              <option value="manhattan">Manhattan Distance</option>
            </select>
          </div>

          {/* K slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '9px' }}>
              <span className="label-caps">Top-K Results</span>
              <span className="tnum" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>{kSlider}</span>
            </div>
            <input type="range" min="1" max="10" value={kSlider} onChange={e => setKSlider(parseInt(e.target.value))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-4)', marginTop: '4px' }}>
              <span>1</span><span>10</span>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Benchmark */}
          <div>
            <div className="label-caps" style={{ marginBottom: '8px' }}>Benchmark</div>
            <button className="btn-secondary" onClick={runBenchmark} style={{ width: '100%', height: '34px' }}>
              <BarChart2 size={13} /><span>Compare All Algos</span>
            </button>
          </div>

          <div className="sidebar-divider" />

          {/* Insert */}
          <div>
            <div className="label-caps" style={{ marginBottom: '8px' }}>Insert Demo Vector</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input type="text" placeholder="Describe the vector..."
                value={addMeta} onChange={e => setAddMeta(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleInsertDemo(); }} />
              <select value={addCat} onChange={e => setAddCat(e.target.value)}>
                <option value="cs">CS / Algorithms</option>
                <option value="math">Mathematics</option>
                <option value="food">Food & Cooking</option>
                <option value="sports">Sports & Games</option>
              </select>
              <button className="btn-secondary" onClick={handleInsertDemo} style={{ width: '100%', height: '34px' }}>
                <Plus size={13} /><span>Insert</span>
              </button>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Legend */}
          <div>
            <div className="label-caps" style={{ marginBottom: '10px' }}>Semantic Clusters</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {LEGEND.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div className="legend-dot" style={{ background: l.col }} />
                  <span style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* ── CENTER: SCATTER PLOT ──────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative', background: 'var(--surface-ink)', overflow: 'hidden' }}>
          <ScatterPlot />
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
        <div style={{
          width: '380px',
          background: 'var(--surface-0)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div className="tab-bar">
            {[
              { id: 'search', label: 'Search',    icon: <Search size={11} /> },
              { id: 'docs',   label: 'Documents', icon: <Database size={11} /> },
              { id: 'rag',    label: 'Ask AI',    icon: <Bot size={11} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
                {tab.icon}<span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {activeTab === 'search' && <SearchTab />}
            {activeTab === 'docs'   && <DocsTab />}
            {activeTab === 'rag'    && <RagTab />}
          </div>
        </div>

      </div>
    </div>
  );
}
