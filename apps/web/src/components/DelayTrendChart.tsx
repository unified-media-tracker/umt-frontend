import type { DelayHistoryPoint } from '@umt/shared/dto/media';
import styles from '../pages/MovieDetailPage.module.css';

const VB_W = 720;
const VB_H = 224;
const X0 = 34;
const X1 = 708;
const Y0 = 214;
const Y1 = 16;
const ZONES = [100, 65, 35, 0];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const yFor = (probability: number) => Y0 - (probability / 100) * (Y0 - Y1);

function smoothPath(points: [number, number][]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
    let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;
        const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
}

export function DelayTrendChart({ history }: { history: DelayHistoryPoint[] }) {
    if (history.length === 0) {
        return <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>No history yet for this title.</p>;
    }

    const sorted = [...history].sort((a, b) => a.computedAt.localeCompare(b.computedAt));
    const t0 = new Date(sorted[0].computedAt).getTime();
    const t1 = new Date(sorted[sorted.length - 1].computedAt).getTime();
    const span = Math.max(t1 - t0, 1);
    const xFor = (iso: string) => X0 + ((new Date(iso).getTime() - t0) / span) * (X1 - X0);

    const points: [number, number][] = sorted.map((pt) => [xFor(pt.computedAt), yFor(pt.delayProbability)]);
    const line = smoothPath(points);
    const area = `${line} L${X1},${Y0} L${points[0][0]},${Y0} Z`;
    const last = points[points.length - 1];
    const lastValue = sorted[sorted.length - 1].delayProbability;

    const tickCount = Math.min(5, sorted.length);
    const ticks = Array.from({ length: tickCount }, (_, i) => {
        const d = new Date(t0 + (span * i) / Math.max(tickCount - 1, 1));
        return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
    });

    return (
        <div>
            <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                role="img"
                aria-label={`Delay probability over time, ending at ${lastValue} percent`}
                style={{ color: 'var(--ontime)' }}
            >
                <defs>
                    <linearGradient id="delay-trend-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="currentColor" stopOpacity={0.3} />
                        <stop offset="1" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <rect x={X0} y={Y1} width={X1 - X0} height={yFor(65) - Y1} style={{ fill: 'var(--delay)', opacity: 0.07 }} />
                <rect x={X0} y={yFor(65)} width={X1 - X0} height={yFor(35) - yFor(65)} style={{ fill: 'var(--rumor)', opacity: 0.07 }} />
                <rect x={X0} y={yFor(35)} width={X1 - X0} height={Y0 - yFor(35)} style={{ fill: 'var(--ontime)', opacity: 0.07 }} />
                <g style={{ stroke: 'var(--line)' }} strokeWidth={1}>
                    {ZONES.map((v) => (
                        <line key={v} x1={X0} x2={X1} y1={yFor(v)} y2={yFor(v)} />
                    ))}
                </g>
                {ZONES.map((v) => (
                    <text key={v} x={X0 - 8} y={yFor(v) + 3.5} textAnchor="end" style={{ font: '10.5px var(--font-mono)', fill: 'var(--muted)' }}>
                        {v}
                    </text>
                ))}
                <path d={area} fill="url(#delay-trend-fill)" />
                <path d={line} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={last[0]} cy={last[1]} r={11} fill="currentColor" opacity={0.2} />
                <circle cx={last[0]} cy={last[1]} r={5} fill="currentColor" />
            </svg>
            <div className={styles.xaxis}>
                {ticks.map((t, i) => (
                    <span key={i}>{t}</span>
                ))}
            </div>
        </div>
    );
}
