'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

/* ─── Types ─── */

interface DoneStepProps {
  labels: {
    title: string;
    subtitle: string;
    goToDashboard: string;
  };
  onFinish: () => void;
}

/* ─── Confetti Particle ─── */

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
}

const CONFETTI_COLORS = [
  'bg-brand',
  'bg-purple-400',
  'bg-pink-400',
  'bg-yellow-400',
  'bg-green-400',
  'bg-blue-400',
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 6,
  }));
}

/* ─── Component ─── */

export function DoneStep({ labels, onFinish }: DoneStepProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles] = useState(() => generateParticles(30));

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center text-center py-8 overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className={cn('absolute rounded-sm', p.color)}
              style={{
                left: `${p.x}%`,
                top: '-10px',
                width: `${p.size}px`,
                height: `${p.size}px`,
                animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Celebration emoji */}
      <div className="mb-6 text-6xl" role="img" aria-label="Celebration">
        🎉
      </div>

      <h2 className="font-display text-3xl font-bold text-text">
        {labels.title}
      </h2>
      <p className="mt-3 max-w-sm text-text-muted">
        {labels.subtitle}
      </p>

      <Button
        size="lg"
        onClick={onFinish}
        className="mt-8"
      >
        {labels.goToDashboard}
      </Button>
    </div>
  );
}
