import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';

const CAT = {
  cs: '#2A7CC7', math: '#7C3FA6', food: '#C46A2A', sports: '#2A8A4A', doc: '#5A5AC8', default: '#6B7280',
};

export default function ScatterPlot() {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const pcaPoints   = useStore(s => s.pcaPoints);
  const bounds      = useStore(s => s.bounds);
  const queryPt     = useStore(s => s.queryPt);
  const hitIds      = useStore(s => s.hitIds);
  const hoverItem   = useStore(s => s.hoverItem);
  const setHoverItem = useStore(s => s.setHoverItem);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, item: null });
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onResize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width; canvas.height = rect.height;
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let id;
    const tick = () => { setPulse(p => p + 0.04); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const toCanvas = (wx, wy, W, H) => {
    const P = 68, rx = bounds.maxX - bounds.minX || 1, ry = bounds.maxY - bounds.minY || 1;
    return [P + ((wx - bounds.minX) / rx) * (W - 2*P), H - P - ((wy - bounds.minY) / ry) * (H - 2*P)];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background — warm very dark charcoal (not pure black)
    ctx.fillStyle = '#1C1B19';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const tx = 68 + (i/8)*(W-136), ty = 68 + (i/8)*(H-136);
      ctx.beginPath(); ctx.moveTo(tx, 68); ctx.lineTo(tx, H-68); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(68, ty); ctx.lineTo(W-68, ty); ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('PC₁  →', W/2 - 22, H-28);
    ctx.save(); ctx.translate(28, H/2+28); ctx.rotate(-Math.PI/2);
    ctx.fillText('PC₂  →', 0, 0); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = '11.5px "JetBrains Mono", monospace';
    ctx.fillText('2D PCA Projection  ·  Semantic Space', 76, 38);

    // Connector lines
    if (queryPt && hitIds.size > 0) {
      const [qx, qy] = toCanvas(queryPt.x, queryPt.y, W, H);
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1;
      for (const pt of pcaPoints) {
        if (!hitIds.has(pt.item.id)) continue;
        const [px, py] = toCanvas(pt.x, pt.y, W, H);
        ctx.strokeStyle = 'rgba(14,107,94,0.4)';
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Points
    for (const pt of pcaPoints) {
      const [cx, cy] = toCanvas(pt.x, pt.y, W, H);
      const col   = CAT[pt.item.category] || CAT.default;
      const isHit = hitIds.has(pt.item.id);
      const isHov = hoverItem?.id === pt.item.id;
      const r     = isHit ? 8 : isHov ? 7 : 5.5;

      // Halo
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r*3);
      grd.addColorStop(0, col + (isHit ? '44' : '22'));
      grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(cx, cy, r*3, 0, Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();

      // Pulse ring for hits
      if (isHit) {
        const pr = r + 5 + Math.sin(pulse*2) * 2;
        ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI*2);
        ctx.strokeStyle = col + '55'; ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Dot
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fillStyle = col; ctx.fill();

      // Hover ring
      if (isHov) {
        ctx.beginPath(); ctx.arc(cx, cy, r+4, 0, Math.PI*2);
        ctx.strokeStyle = col + 'aa'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    // Query star
    if (queryPt) {
      const [qx, qy] = toCanvas(queryPt.x, queryPt.y, W, H);
      ctx.save(); ctx.translate(qx, qy);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i*Math.PI/5) - Math.PI/2;
        const rr = i%2===0 ? 10 : 4;
        if (i===0) ctx.moveTo(Math.cos(a)*rr, Math.sin(a)*rr);
        else ctx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr);
      }
      ctx.closePath();
      ctx.fillStyle = '#F2F0EC';
      ctx.shadowColor = 'rgba(242,240,236,0.5)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '10px monospace';
      ctx.fillText('query', qx+15, qy+4);
    }

    if (!pcaPoints.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Connecting to VectorDB C++ Server...', W/2, H/2-8);
      ctx.font = '11px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillText('Make sure ./db is running on :8080', W/2, H/2+12);
      ctx.textAlign = 'left';
    }
  }, [pcaPoints, bounds, queryPt, hitIds, hoverItem, pulse]);

  const handleMouseMove = e => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let closest = null, best = 18;
    for (const pt of pcaPoints) {
      const [cx, cy] = toCanvas(pt.x, pt.y, canvas.width, canvas.height);
      const d = Math.hypot(mx-cx, my-cy);
      if (d < best) { best = d; closest = pt.item; }
    }
    if (closest) {
      setHoverItem(closest);
      setTooltip({ show: true, x: e.clientX+14, y: e.clientY-12, item: closest });
    } else {
      setHoverItem(null);
      setTooltip({ show: false, x: 0, y: 0, item: null });
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoverItem(null); setTooltip({ show: false, x:0, y:0, item:null }); }}
        style={{ display: 'block', width: '100%', height: '100%' }} />
      {tooltip.show && tooltip.item && (
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y,
          background: '#FAFAF7',
          border: '1px solid rgba(26,25,23,0.12)',
          borderRadius: '10px',
          padding: '8px 12px',
          fontSize: '12px',
          pointerEvents: 'none',
          maxWidth: '210px',
          zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          color: '#4A4845',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: CAT[tooltip.item.category] || CAT.default, flexShrink: 0 }} />
            <span style={{ fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', color: CAT[tooltip.item.category] || CAT.default, fontFamily: 'var(--font-mono)' }}>
              {tooltip.item.category}
            </span>
          </div>
          <div style={{ lineHeight: 1.45, color: '#1A1917' }}>{tooltip.item.metadata}</div>
        </div>
      )}
    </div>
  );
}
