'use client';

import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'; // green-500
  if (score >= 50) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

/**
 * Animated SVG score ring.
 * Color-coded: green >= 90, orange >= 50, red < 50.
 * Animates from 0 to the target score on mount.
 */
export function ScoreRing({
  score,
  label,
  size = 120,
  strokeWidth = 8,
}: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [animatedDash, setAnimatedDash] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);

  useEffect(() => {
    const duration = 800;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(eased * score));
      setAnimatedDash(eased * (score / 100) * circumference);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score, circumference]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth={strokeWidth}
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - animatedDash}
            style={{ transition: 'stroke 0.3s ease' }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold"
            style={{ color }}
          >
            {displayScore}
          </span>
        </div>
      </div>
      <span className="text-sm text-gray-400 font-medium">{label}</span>
    </div>
  );
}
