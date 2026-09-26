"use client";

import { useRef, useState } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees
}

/**
 * Wraps its children in a perspective container and tilts them in 3D based
 * on cursor position, with a soft gold glow that follows the tilt. This is
 * a CSS/JS interaction effect, not a real 3D model — there's no rotatable
 * geometry here, just a perspective transform — but it reads as premium
 * "3D product" interactivity, which is what most e-commerce sites showing
 * off a "3D" product view are actually doing under the hood too.
 */
export function TiltCard({ children, className = "", maxTilt = 14 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - y) * maxTilt * 2;

    setStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`,
      boxShadow: `0 20px 50px -12px rgba(217, 168, 40, 0.5)`,
    });
  }

  function handleMouseLeave() {
    setStyle({
      transform: "rotateX(0deg) rotateY(0deg) scale(1)",
      boxShadow: "0 8px 30px -8px rgba(217, 168, 40, 0.2)",
    });
  }

  return (
    <div className={`tilt-perspective ${className}`}>
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="tilt-object rounded-2xl"
        style={style}
      >
        {children}
      </div>
    </div>
  );
}
