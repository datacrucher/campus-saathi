import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { niceMax } from '../lib/stats';

interface Tip { x: number; y: number; content: ReactNode }

function useTip() {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const show = (e: MouseEvent, content: ReactNode) => {
    const box = ref.current!.getBoundingClientRect();
    const x = Math.min(e.clientX - box.left + 14, box.width - 200);
    setTip({ x: Math.max(0, x), y: e.clientY - box.top + 14, content });
  };
  const hide = () => setTip(null);
  const node = tip && <div className="chart-tip" style={{ left: tip.x, top: tip.y }}>{tip.content}</div>;
  return { ref, show, hide, node };
}

export interface HBarDatum { id: string; label: string; value: number; detail?: [string, number | string][] }

export function HBarChart({ data, onSelect, valueLabel }: { data: HBarDatum[]; onSelect?: (id: string) => void; valueLabel: string }) {
  const { ref, show, hide, node } = useTip();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max = niceMax(Math.max(1, ...sorted.map((d) => d.value)));
  const steps = max % 5 === 0 ? 5 : 4;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => Math.round((max / steps) * i));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <ul className="hbar-chart" onMouseLeave={hide}>
        {sorted.map((d) => (
          <li key={d.id} className="hbar-row">
            <button className="hb-label" title={d.label} onClick={() => onSelect?.(d.id)}>{d.label}</button>
            <div
              className="hb-track"
              onMouseMove={(e) => show(e, (
                <>
                  <strong>{d.label}</strong>
                  <div className="tip-row"><span>{valueLabel}</span><b>{d.value}</b></div>
                  {d.detail?.map(([k, v]) => <div className="tip-row" key={k}><span>{k}</span><b>{v}</b></div>)}
                </>
              ))}
              onClick={() => onSelect?.(d.id)}
              role="img"
              aria-label={`${d.label}: ${d.value} ${valueLabel.toLowerCase()}`}
            >
              <span className="hb-area">
                <span className="hb-bar" style={{ width: `${(d.value / max) * 100}%` }} />
                <span className="hb-val" style={{ left: `calc(${(d.value / max) * 100}% + 6px)` }}>{d.value}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="hbar-axis" aria-hidden="true">
        <span />
        <div className="ticks">{ticks.map((t) => <span key={t}>{t}</span>)}</div>
      </div>
      {node}
    </div>
  );
}

export interface VBarDatum { key: string; label: string; tick?: string; value: number; muted?: boolean }

export function VBarChart({ data, valueLabel, height = 180 }: { data: VBarDatum[]; valueLabel: string; height?: number }) {
  const { ref, show, hide, node } = useTip();
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const peak = Math.max(...data.map((d) => d.value));
  return (
    <div ref={ref} className="vbar-chart">
      <div className="vbar-plot" style={{ height }} onMouseLeave={hide}>
        {[0.5, 1].map((f) => (
          <div key={f} className="gridline" style={{ bottom: `${f * 100}%` }}><span>{Math.round(max * f)}</span></div>
        ))}
        {data.map((d) => (
          <div
            key={d.key}
            className={`vbar-col${d.muted ? ' muted-col' : ''}`}
            onMouseMove={(e) => show(e, (<><strong>{d.label}</strong><div className="tip-row"><span>{valueLabel}</span><b>{d.value}</b></div></>))}
            role="img"
            aria-label={`${d.label}: ${d.value}`}
          >
            {d.value === peak && d.value > 0 && <span className="vb-val">{d.value}</span>}
            <div className="vb-bar" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="vbar-labels" aria-hidden="true">
        {data.map((d) => <span key={d.key}>{d.tick ?? ''}</span>)}
      </div>
      {node}
    </div>
  );
}
