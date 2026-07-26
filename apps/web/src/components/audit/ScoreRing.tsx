'use client';

import { useEffect, useRef, useState } from 'react';

export function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--score-excellent)';
  if (score >= 70) return 'var(--score-good)';
  if (score >= 50) return 'var(--score-fair)';
  return 'var(--score-poor)';
}

const HERO_R = 54;
const HERO_CIRCUMFERENCE = 2 * Math.PI * HERO_R;

const SUB_R = 34;
const SUB_CIRCUMFERENCE = 2 * Math.PI * SUB_R;

function useScoreAnimation(
  score: number,
  circumference: number,
  delay = 0
): { displayScore: number; dashOffset: number } {
  const [displayScore, setDisplayScore] = useState(0);
  const [dashOffset, setDashOffset] = useState(circumference);
  const rafRef = useRef<number | null>(null);
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    if (prefersReduced) {
      setDisplayScore(score);
      setDashOffset(circumference * (1 - score / 100));
      return;
    }

    const duration = 800;
    let startTime: number | null = null;

    const run = (ts: number) => {
      if (!startTime) startTime = ts + delay;
      const elapsed = ts - startTime;
      if (elapsed < 0) { rafRef.current = requestAnimationFrame(run); return; }
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * score));
      setDashOffset(circumference * (1 - (eased * score) / 100));
      if (t < 1) rafRef.current = requestAnimationFrame(run);
    };

    rafRef.current = requestAnimationFrame(run);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [score, circumference, delay, prefersReduced]);

  return { displayScore, dashOffset };
}

interface ScoreRingProps {
  score: number;
  label?: string;
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  const color = getScoreColor(score);
  const { displayScore, dashOffset } = useScoreAnimation(score, HERO_CIRCUMFERENCE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg viewBox="0 0 120 120" width={120} height={120} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={60} cy={60} r={HERO_R} fill="none" stroke="var(--color-ring-track)" strokeWidth={6} />
          <circle cx={60} cy={60} r={HERO_R} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={HERO_CIRCUMFERENCE} strokeDashoffset={dashOffset} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--text-score)', color: 'var(--color-ink)', lineHeight: 1 }}>{displayScore}</span>
        </div>
      </div>
      {label && (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 500, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--color-dust)' }}>{label}</span>
      )}
    </div>
  );
}

interface SubScoreRingProps {
  score: number | null;
  label: string;
  delay?: number;
}

export function SubScoreRing({ score, label, delay = 0 }: SubScoreRingProps) {
  const safeScore = score ?? 0;
  const color = score !== null ? getScoreColor(safeScore) : 'var(--color-border)';
  const { displayScore, dashOffset } = useScoreAnimation(safeScore, SUB_CIRCUMFERENCE, delay);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg viewBox="0 0 80 80" width={80} height={80} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={40} cy={40} r={SUB_R} fill="none" stroke="var(--color-ring-track)" strokeWidth={5} />
          <circle cx={40} cy={40} r={SUB_R} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={SUB_CIRCUMFERENCE} strokeDashoffset={score !== null ? dashOffset : SUB_CIRCUMFERENCE} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, color: score !== null ? 'var(--color-ink)' : 'var(--color-mist)', lineHeight: 1 }}>{score !== null ? displayScore : '—'}</span>
        </div>
      </div>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--color-dust)', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

interface ScoreBreakdownRowProps {
  performance: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
}

export function ScoreBreakdownRow({ performance, accessibility, seo, bestPractices }: ScoreBreakdownRowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--space-6)', justifyContent: 'center', flexWrap: 'wrap' }}>
      <SubScoreRing score={performance}   label="Performance"    delay={0} />
      <SubScoreRing score={accessibility} label="Accessibility"  delay={100} />
      <SubScoreRing score={seo}           label="SEO"            delay={200} />
      <SubScoreRing score={bestPractices} label="Best Practices" delay={300} />
    </div>
  );
}
