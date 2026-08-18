import { useId } from 'react';
import { classNames } from '@/lib/utils';

// ─── Bar Chart ─────────────────────────────────────────────────────
export function BarChart({ data, height = 180, color = '#2b7da6' }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
          <div className="relative w-full flex items-end justify-center" style={{ height: height - 28 }}>
            <div
              className="w-full max-w-[28px] rounded-t-md transition-all duration-500 group-hover:opacity-80"
              style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: 2 }}
            />
            <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-ink-700 bg-white px-1.5 py-0.5 rounded shadow-sm border border-ink-200 whitespace-nowrap">
              {d.value}
            </div>
          </div>
          <span className="text-[10px] text-ink-400 font-medium truncate max-w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Line / Area Chart ─────────────────────────────────────────────
export function LineChart({ data, height = 160, color = '#2b7da6', showArea = true }: { data: { label: string; value: number }[]; height?: number; color?: string; showArea?: boolean }) {
  const gradId = useId();
  const width = 100;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const points = data.map((d, i) => ({ x: i * step, y: height - 24 - ((d.value - min) / range) * (height - 36) }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${path} L ${width} ${height - 24} L 0 ${height - 24} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" y1={24 + f * (height - 36)} x2={width} y2={24 + f * (height - 36)} stroke="#e2e8f0" strokeWidth="0.3" strokeDasharray="1 1" />
      ))}
      {showArea && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.2" fill={color} className="opacity-0 hover:opacity-100" />
      ))}
      {data.map((d, i) => (
        i % Math.ceil(data.length / 6) === 0 || i === data.length - 1 ? (
          <text key={i} x={i * step} y={height - 6} textAnchor="middle" fontSize="3" fill="#94a3b8">{d.label}</text>
        ) : null
      ))}
    </svg>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────────
export function DonutChart({ data, size = 140, thickness = 18, centerLabel, centerValue }: { data: { label: string; value: number; color: string }[]; size?: number; thickness?: number; centerLabel?: string; centerValue?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.map((d, i) => {
            const len = (d.value / total) * circumference;
            const seg = (
              <circle
                key={i}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={d.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-xl font-bold text-ink-800">{centerValue}</span>}
            {centerLabel && <span className="text-[10px] text-ink-400 font-medium uppercase tracking-wide">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-ink-600 font-medium">{d.label}</span>
            <span className="text-ink-400 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────
export function Sparkline({ data, color = '#2b7da6', height = 32, width = 80 }: { data: number[]; color?: string; height?: number; width?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Horizontal Bar List ──────────────────────────────────────────
export function BarList({ items }: { items: { label: string; value: number; max?: number; color?: string; sublabel?: string }[] }) {
  const max = Math.max(...items.map(i => i.max ?? i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-ink-600">{item.label}</span>
            <span className="text-ink-400">{item.sublabel ?? item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
            <div className={classNames('h-full rounded-full transition-all duration-500')} style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color || '#2b7da6' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Radial Gauge ─────────────────────────────────────────────────
export function RadialGauge({ value, max = 100, size = 120, label, color = '#2b7da6' }: { value: number; max?: number; size?: number; label?: string; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = (pct / 100) * 0.75 * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="7" strokeDasharray={`${0.75 * circumference} ${circumference}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${arc} ${circumference}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink-800">{Math.round(value)}<span className="text-sm text-ink-400">%</span></span>
        {label && <span className="text-[10px] text-ink-400 font-medium uppercase tracking-wide mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
