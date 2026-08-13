import { create } from 'zustand';

const API_URL = 'http://localhost:8080';

// ── KEYWORD EMBEDDING FOR DEMO VECTORS (16D) ──
const KW = {
  cs:     ['algorithm','data','tree','graph','array','linked','hash','stack','queue','sort','binary','dynamic','programming','recursion','complexity','pointer','node','search','insert','bfs','dfs','heap','trie'],
  math:   ['calculus','matrix','probability','theorem','integral','derivative','linear','algebra','equation','function','prime','modular','combinatorics','permutation','eigenvalue','statistics','proof'],
  food:   ['food','pizza','sushi','ramen','pasta','recipe','cook','eat','restaurant','dish','ingredient','flavor','spice','noodle','bread','croissant','taco','fish','rice','soup'],
  sports: ['sport','basketball','football','tennis','chess','swim','game','play','score','team','athlete','competition','match','tournament','olympic','dribble','tackle','serve']
};

export function textToEmbedding(text) {
  const t = text.toLowerCase(), ws = t.split(/\s+/);
  const s = {cs:0, math:0, food:0, sports:0};
  for (const w of ws) {
    for (const [cat, kws] of Object.entries(KW)) {
      for (const kw of kws) {
        if (w.includes(kw) || kw.startsWith(w)) {
          s[cat] += 0.35;
          break;
        }
      }
    }
  }
  const mx = Math.max(...Object.values(s), 0.01);
  const n = v => Math.min(v/mx*0.88, 0.94);
  const jitter = () => (Math.random() - .5) * .04;
  const emb = new Array(16).fill(0.08);
  const fill = (i, score) => {
    if (score < .01) return;
    const b = n(score);
    emb[i] = Math.max(.05, b + jitter());
    emb[i+1] = Math.max(.05, b + jitter());
    emb[i+2] = Math.max(.05, b * .92 + jitter());
    emb[i+3] = Math.max(.05, b * .87 + jitter());
  };
  fill(0, s.cs);
  fill(4, s.math);
  fill(8, s.food);
  fill(12, s.sports);
  return emb;
}

// ── PCA 2D PROJECTION ──
function pca2D(embs) {
  const n = embs.length, d = embs[0].length;
  if (n < 2) return embs.map(() => [0, 0]);
  const mean = new Array(d).fill(0);
  for (const e of embs) {
    for (let i = 0; i < d; i++) mean[i] += e[i] / n;
  }
  const X = embs.map(e => e.map((v, i) => v - mean[i]));
  
  function powerIter(X, excl) {
    let v = new Array(d).fill(0).map(() => Math.random() - .5);
    if (excl) {
      let dot = v.reduce((s, vi, i) => s + vi * excl[i], 0);
      v = v.map((vi, i) => vi - dot * excl[i]);
    }
    let nrm = Math.sqrt(v.reduce((s, vi) => s + vi * vi, 0));
    v = v.map(vi => vi / nrm);
    for (let it = 0; it < 200; it++) {
      const Xv = X.map(xi => xi.reduce((s, xij, j) => s + xij * v[j], 0));
      const nv = new Array(d).fill(0);
      for (let k = 0; k < n; k++) {
        for (let j = 0; j < d; j++) nv[j] += X[k][j] * Xv[k];
      }
      if (excl) {
        let dot = nv.reduce((s, vi, i) => s + vi * excl[i], 0);
        for (let i = 0; i < d; i++) nv[i] -= dot * excl[i];
      }
      nrm = Math.sqrt(nv.reduce((s, vi) => s + vi * vi, 0));
      if (nrm < 1e-10) break;
      const prev = v.slice();
      v = nv.map(vi => vi / nrm);
      if (v.reduce((s, vi, i) => s + (vi - prev[i]) ** 2, 0) < 1e-12) break;
    }
    return v;
  }
  const pc1 = powerIter(X, null), pc2 = powerIter(X, pc1);
  return X.map(x => [
    x.reduce((s, v, i) => s + v * pc1[i], 0),
    x.reduce((s, v, i) => s + v * pc2[i], 0)
  ]);
}

// ── STATE STORE ──
export const useStore = create((set, get) => ({
  // Raw Data lists
  allItems: [],
  pcaPoints: [],
  bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
  
  // Search state
  qInput: '',
  selAlgo: 'hnsw',
  metric: 'cosine',
  kSlider: 5,
  searchResults: [],
  hitIds: new Set(),
  queryPt: null,
  latency: '—',
  latencySub: 'No query yet',
  queryEmb: new Array(16).fill(0.08),

  // Benchmark stats
  benchData: null,
  showBench: false,
  
  // Graph layers info
  hnswLayers: [],

  // Document management
  nvidiaStatus: {
    nvidiaAvailable: false,
    embedModel: 'nvidia/nv-embed-v1',
    genModel: 'meta/llama-3.1-8b-instruct',
    docCount: 0,
    docDims: 0,
  },
  docList: [],
  docCount: 0,
  isEmbedding: false,
  insertStatus: '',

  // RAG / Chat state
  ragQuestion: '',
  ragK: 3,
  chatHistory: [],
  isThinking: false,

  // Selected item on canvas hover
  hoverItem: null,

  setHoverItem: (item) => set({ hoverItem: item }),
  setQInput: (val) => set({ qInput: val }),
  setSelAlgo: (algo) => set({ selAlgo: algo }),
  setMetric: (metric) => set({ metric: metric }),
  setKSlider: (k) => set({ kSlider: k }),
  setRagQuestion: (q) => set({ ragQuestion: q }),
  setRagK: (k) => set({ ragK: k }),

  // Actions
  loadItems: async () => {
    try {
      const r = await fetch(`${API_URL}/items`);
      const items = await r.json();
      set({ allItems: items });
      if (items.length >= 2) {
        const coords = pca2D(items.map(v => v.embedding));
        const pcaPoints = items.map((item, i) => ({ x: coords[i][0], y: coords[i][1], item }));
        
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const p of pcaPoints) {
          x0 = Math.min(x0, p.x);
          x1 = Math.max(x1, p.x);
          y0 = Math.min(y0, p.y);
          y1 = Math.max(y1, p.y);
        }
        const px = (x1 - x0) * 0.18 || 0.1;
        const py = (y1 - y0) * 0.18 || 0.1;
        set({
          pcaPoints,
          bounds: { minX: x0 - px, maxX: x1 + px, minY: y0 - py, maxY: y1 + py }
        });
      } else {
        set({ pcaPoints: [], bounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 } });
      }
    } catch (_) {}
  },

  loadHNSWInfo: async () => {
    try {
      const r = await fetch(`${API_URL}/hnsw-info`);
      const d = await r.json();
      const maxN = d.nodesPerLayer[0] || 1;
      const layers = d.nodesPerLayer.map((cnt, lyr) => {
        const pct = Math.max((cnt / maxN) * 100, 2);
        const edg = d.edgesPerLayer[lyr] || 0;
        return { lyr, count: cnt, edges: edg, pct };
      });
      set({ hnswLayers: layers });
    } catch (_) {}
  },

  checkNvidiaStatus: async () => {
    try {
      const r = await fetch(`${API_URL}/status`);
      const status = await r.json();
      set({ nvidiaStatus: status });
    } catch (_) {}
  },

  loadDocList: async () => {
    try {
      const r = await fetch(`${API_URL}/doc/list`);
      const docs = await r.json();
      set({ docList: docs, docCount: docs.length });
    } catch (_) {}
  },

  runSearch: async () => {
    const { qInput, kSlider, metric, selAlgo, pcaPoints } = get();
    if (!qInput.trim()) return;

    const emb = textToEmbedding(qInput);
    set({ queryEmb: emb });

    const url = `${API_URL}/search?v=${emb.join(',')}&k=${kSlider}&metric=${metric}&algo=${selAlgo}`;
    try {
      const r = await fetch(url);
      const data = await r.json();
      const results = data.results || [];
      const hitIds = new Set(results.map(res => res.id));
      const us = data.latencyUs || 0;

      let qPt = null;
      if (results.length > 0) {
        let sx = 0, sy = 0, sw = 0;
        for (let i = 0; i < Math.min(3, results.length); i++) {
          const pt = pcaPoints.find(p => p.item.id === results[i].id);
          if (pt) {
            const w = 1 / (i + 1);
            sx += pt.x * w;
            sy += pt.y * w;
            sw += w;
          }
        }
        if (sw > 0) {
          qPt = { x: sx / sw + (Math.random() - .5) * .015, y: sy / sw + (Math.random() - .5) * .015 };
        }
      }

      set({
        searchResults: results,
        hitIds,
        latency: us < 1000 ? `${us} μs` : `${(us / 1000).toFixed(2)} ms`,
        latencySub: `${selAlgo.toUpperCase()}  ·  ${metric}  ·  k=${kSlider}`,
        queryPt: qPt
      });
    } catch (_) {
      alert('Cannot reach server — is it running on :8080?');
    }
  },

  runBenchmark: async () => {
    const { qInput, metric } = get();
    const text = qInput.trim() || 'binary tree algorithm';
    const emb = textToEmbedding(text);
    try {
      const r = await fetch(`${API_URL}/benchmark?v=${emb.join(',')}&k=5&metric=${metric}`);
      const d = await r.json();
      const mx = Math.max(d.bruteforceUs, d.kdtreeUs, d.hnswUs, 1);
      const benchData = [
        { lbl: 'Brute Force', us: d.bruteforceUs, pct: Math.max((d.bruteforceUs / mx) * 100, 2), col: '#ea2261', disp: d.bruteforceUs < 1000 ? `${d.bruteforceUs} μs` : `${(d.bruteforceUs / 1000).toFixed(2)} ms` },
        { lbl: 'KD-Tree', us: d.kdtreeUs, pct: Math.max((d.kdtreeUs / mx) * 100, 2), col: '#00d9ff', disp: d.kdtreeUs < 1000 ? `${d.kdtreeUs} μs` : `${(d.kdtreeUs / 1000).toFixed(2)} ms` },
        { lbl: 'HNSW', us: d.hnswUs, pct: Math.max((d.hnswUs / mx) * 100, 2), col: '#b388ff', disp: d.hnswUs < 1000 ? `${d.hnswUs} μs` : `${(d.hnswUs / 1000).toFixed(2)} ms` }
      ];
      set({ benchData, showBench: true });
    } catch (_) {}
  },

  addVector: async (meta, cat) => {
    if (!meta.trim()) return;
    const emb = textToEmbedding(meta + ' ' + cat);
    try {
      await fetch(`${API_URL}/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: meta, category: cat, embedding: emb })
      });
      await get().loadItems();
      await get().loadHNSWInfo();
    } catch (_) {}
  },

  deleteItem: async (id) => {
    try {
      await fetch(`${API_URL}/delete/${id}`, { method: 'DELETE' });
      const { searchResults, hitIds } = get();
      const nextHits = new Set(hitIds);
      nextHits.delete(id);
      set({
        searchResults: searchResults.filter(r => r.id !== id),
        hitIds: nextHits
      });
      await get().loadItems();
      await get().loadHNSWInfo();
    } catch (_) {}
  },

  insertDocument: async (title, text) => {
    if (!title.trim() || !text.trim()) {
      set({ insertStatus: '✗ Need both a title and text.' });
      return;
    }
    set({ isEmbedding: true, insertStatus: 'Calling NVIDIA NIM...' });

    try {
      const r = await fetch(`${API_URL}/doc/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text })
      });
      const d = await r.json();
      if (d.error) {
        set({ insertStatus: `✗ ${d.error}` });
      } else {
        set({ insertStatus: `✓ Inserted ${d.chunks} chunk(s) · ${d.dims}D embeddings` });
        
        // Insert a 16D fake vector into visualizer DB just like index.html did
        const emb16 = textToEmbedding(title + ' ' + text);
        await fetch(`${API_URL}/insert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata: title, category: 'doc', embedding: emb16 })
        });
        
        await get().loadItems();
        await get().loadHNSWInfo();
        await get().loadDocList();
        await get().checkNvidiaStatus();
      }
    } catch (_) {
      set({ insertStatus: '✗ NVIDIA NIM error' });
    } finally {
      set({ isEmbedding: false });
    }
  },

  deleteDoc: async (id) => {
    try {
      await fetch(`${API_URL}/doc/delete/${id}`, { method: 'DELETE' });
      await get().loadDocList();
      await get().checkNvidiaStatus();
    } catch (_) {}
  },

  askAI: async (question) => {
    if (!question.trim()) return;
    const { ragK, pcaPoints } = get();

    set({ isThinking: true, chatHistory: [] });

    // background search to update map
    fetch(`${API_URL}/doc/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, k: ragK })
    })
    .then(res => res.json())
    .then(data => {
      if (data.contexts && data.contexts.length > 0) {
        const nextHits = new Set();
        let sx = 0, sy = 0, sw = 0;
        data.contexts.forEach((ctx, i) => {
          const pt = pcaPoints.find(p => p.item.category === 'doc' && ctx.title.startsWith(p.item.metadata));
          if (pt) {
            nextHits.add(pt.item.id);
            const w = 1 / (i + 1);
            sx += pt.x * w;
            sy += pt.y * w;
            sw += w;
          }
        });
        set({ hitIds: nextHits });
        if (sw > 0) {
          set({
            queryPt: { x: sx / sw + (Math.random() - .5) * .015, y: sy / sw + (Math.random() - .5) * .015 }
          });
        }
      } else {
        set({ hitIds: new Set() });
        // fallback matching space
        const emb16 = textToEmbedding(question);
        fetch(`${API_URL}/search?v=${emb16.join(',')}&k=3&metric=cosine&algo=hnsw`)
          .then(res2 => res2.json())
          .then(data2 => {
            if (data2.results && data2.results.length > 0) {
              let sx = 0, sy = 0, sw = 0;
              for (let i = 0; i < Math.min(3, data2.results.length); i++) {
                const pt = pcaPoints.find(p => p.item.id === data2.results[i].id);
                if (pt) {
                  const w = 1 / (i + 1);
                  sx += pt.x * w;
                  sy += pt.y * w;
                  sw += w;
                }
              }
              if (sw > 0) {
                set({
                  queryPt: { x: sx / sw + (Math.random() - .5) * .015, y: sy / sw + (Math.random() - .5) * .015 }
                });
              }
            }
          }).catch(() => {});
      }
    })
    .catch(() => {});

    try {
      const r = await fetch(`${API_URL}/doc/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, k: ragK })
      });
      const d = await r.json();
      
      set({
        chatHistory: [
          { question, answer: d.answer, contexts: d.contexts || [], model: d.model }
        ]
      });
    } catch (_) {
      set({
        chatHistory: [
          { question, answer: 'Error: Could not reach the server. Make sure ./db is running and NVIDIA_API_KEY is set.', contexts: [], model: '' }
        ]
      });
    } finally {
      set({ isThinking: false });
    }
  }
}));
