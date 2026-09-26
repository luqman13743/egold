"use client";

import { useEffect, useRef, useState } from "react";

interface ScentTrait {
  label: string;
  value: number; // 0–100
}

interface ScentProfileProps {
  traits: ScentTrait[];
}

/**
 * Each trait line fills to its percentage the moment it scrolls into view,
 * and fades out + resets to empty when scrolled back above the viewport —
 * so scrolling down fills it, scrolling back up makes it fade away, exactly
 * like a re-triggerable entrance animation rather than a one-time reveal.
 */
export function ScentProfile({ traits }: ScentProfileProps) {
  return (
    <div className="space-y-8">
      {traits.map((trait) => (
        <ScentBar key={trait.label} label={trait.label} value={trait.value} />
      ))}
    </div>
  );
}

function ScentBar({ label, value }: ScentTrait) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Crossing into view → fill; scrolling back up past it → fade out.
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-medium tracking-wide uppercase text-ink/70">{label}</span>
        <span className="text-sm font-display text-accent-dim tabular-nums">
          {visible ? value : 0}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-sand overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-dim via-accent to-accent-bright transition-[width] duration-[1400ms] ease-out"
          style={{ width: visible ? `${value}%` : "0%" }}
        />
      </div>
    </div>
  );
}
